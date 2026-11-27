import type { AuthTokens, CurrentUser, Session } from '../../domain/auth/session';
import {
  type Clock,
  type PendingRevocationQueue,
  type SessionStore,
  systemClock,
  type TokenGateway,
  type TokenStorage,
} from './ports';

export type SessionManagerOptions = {
  /**
   * Renova o access token quando faltar menos que isso para expirar (padrão: 60 s).
   * A expiração é calculada pelo relógio do aparelho no momento em que o token chega
   * (`expiresIn` relativo), então a diferença de relógio com o servidor não entra na conta;
   * a margem cobre a latência da rede e pequenos ajustes do relógio.
   */
  readonly refreshMarginMs?: number;
};

/** No máximo isso de refresh tokens aguardando revogação; os mais antigos já expiraram de qualquer jeito. */
const MAX_PENDING_REVOCATIONS = 5;

/**
 * Ciclo de vida da sessão: restaura do armazenamento seguro ao abrir o app, entrega um access token
 * válido para cada requisição (renovando antes de expirar), renova **uma única vez** quando várias
 * requisições precisam ao mesmo tempo (single-flight — o Keycloak rotaciona o refresh token e recusa
 * o reuso) e encerra a sessão ao sair, mesmo sem internet.
 */
export class SessionManager {
  private readonly refreshMarginMs: number;
  private refreshing: Promise<string | null> | null = null;
  /**
   * Fila das gravações da sessão (Keystore + memória). Uma de cada vez, sempre sobre a sessão mais
   * recente: uma renovação e uma troca de perfil simultâneas não sobrescrevem o refresh token novo.
   */
  private writes: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly tokens: TokenGateway,
    private readonly storage: TokenStorage,
    private readonly sessions: SessionStore,
    private readonly pendingRevocations: PendingRevocationQueue,
    private readonly clock: Clock = systemClock,
    options: SessionManagerOptions = {},
  ) {
    this.refreshMarginMs = options.refreshMarginMs ?? 60_000;
  }

  /**
   * Ao abrir o app: recupera a sessão salva e, se o access token já venceu, renova antes de liberar
   * a navegação. Sem internet, mantém a sessão (o usuário continua logado e a renovação é tentada
   * de novo na próxima requisição). Também tenta revogar o que ficou pendente de um "Sair" offline.
   */
  async restore(): Promise<void> {
    let saved: Session | null = null;
    try {
      saved = await this.storage.load();
    } catch {
      saved = null; // armazenamento ilegível (ex.: chave do Keystore apagada): começa sem sessão
    }
    if (saved) {
      this.sessions.save(saved);
      if (this.needsRefresh(saved.tokens)) await this.refreshSingleFlight();
    }
    void this.flushPendingRevocations();
  }

  /** Inicia uma sessão nova (após o login): guarda em memória e no armazenamento seguro. */
  async start(session: Session): Promise<void> {
    await this.serialized(async () => {
      await this.persist(session);
      this.sessions.save(session);
    });
    void this.flushPendingRevocations();
  }

  /**
   * Atualiza o perfil da sessão atual (ex.: o lar mudou) na memória e no armazenamento seguro.
   * Sem sessão, não faz nada.
   */
  async updateUser(update: (user: CurrentUser) => CurrentUser): Promise<void> {
    await this.serialized(async () => {
      const current = this.sessions.current();
      if (!current) return;
      const updated: Session = { ...current, user: update(current.user) };
      await this.persist(updated);
      if (this.sessions.current() === current) this.sessions.save(updated);
    });
  }

  /**
   * Access token para a próxima requisição. Renova antes, se estiver perto de vencer.
   * Sem sessão devolve `null`. Se a renovação falhar por falta de rede, devolve o token atual
   * (a API responde 401 e a requisição falha normalmente, sem derrubar a sessão).
   */
  async getAccessToken(): Promise<string | null> {
    const session = this.sessions.current();
    if (!session) return null;
    if (!this.needsRefresh(session.tokens)) return session.tokens.accessToken;
    return (
      (await this.refreshSingleFlight()) ?? this.sessions.current()?.tokens.accessToken ?? null
    );
  }

  /**
   * A API recusou `rejectedToken` (401). Se outra requisição já renovou nesse meio-tempo, devolve
   * o token novo sem renovar de novo; senão renova (single-flight). `null` = não há como repetir.
   */
  async handleUnauthorized(rejectedToken: string): Promise<string | null> {
    const session = this.sessions.current();
    if (!session) return null;
    if (session.tokens.accessToken !== rejectedToken) return session.tokens.accessToken;
    return this.refreshSingleFlight();
  }

  /**
   * "Sair": apaga a sessão do aparelho primeiro (vale mesmo sem internet) e depois encerra a sessão
   * no provedor. Se não der para falar com o provedor, o refresh token fica na fila para revogar depois.
   */
  async signOut(): Promise<void> {
    const session = this.sessions.current();
    this.refreshing = null;
    this.sessions.clear('signed-out');
    try {
      await this.serialized(() => this.storage.clear());
    } catch {
      // Nada a fazer: a sessão já saiu da memória e o próximo save sobrescreve.
    }

    const refreshToken = session?.tokens.refreshToken;
    if (!refreshToken) return;
    const result = await this.tokens.endSession(refreshToken).catch(() => null);
    if (!result?.ok) await this.enqueueRevocation(refreshToken);
  }

  /** Tenta revogar os refresh tokens que ficaram pendentes; os que falharem continuam na fila. */
  async flushPendingRevocations(): Promise<void> {
    let pending: readonly string[];
    try {
      pending = await this.pendingRevocations.list();
    } catch {
      return;
    }
    for (const refreshToken of pending) {
      const result = await this.tokens.endSession(refreshToken).catch(() => null);
      if (!result?.ok) return; // ainda offline: tenta de novo na próxima oportunidade
      await this.pendingRevocations.remove(refreshToken).catch(() => {});
    }
  }

  private needsRefresh(tokens: AuthTokens): boolean {
    return tokens.expiresAt - this.clock.now() <= this.refreshMarginMs;
  }

  private refreshSingleFlight(): Promise<string | null> {
    if (!this.refreshing) {
      const flight = this.refresh().finally(() => {
        if (this.refreshing === flight) this.refreshing = null;
      });
      this.refreshing = flight;
    }
    return this.refreshing;
  }

  private async refresh(): Promise<string | null> {
    const session = this.sessions.current();
    const refreshToken = session?.tokens.refreshToken;
    if (!session) return null;
    if (!refreshToken) {
      this.expire();
      return null;
    }

    const result = await this.tokens.refresh(refreshToken).catch(() => null);
    // Saiu (ou entrou com outra conta) enquanto renovava: descarta o resultado.
    if (this.sessions.current()?.tokens.refreshToken !== refreshToken)
      return this.sessions.current()?.tokens.accessToken ?? null;

    if (result === null || (!result.ok && result.error.code === 'auth.offline')) return null;
    if (!result.ok) {
      this.expire();
      return null;
    }

    const tokens: AuthTokens = {
      ...result.value,
      // Sem rotação, o provedor pode não devolver um refresh novo: o atual continua valendo.
      ...(result.value.refreshToken ? {} : { refreshToken }),
    };
    return this.serialized(async () => {
      // Parte do estado mais recente: o perfil pode ter mudado enquanto a renovação estava na rede.
      const base = this.sessions.current();
      if (!base || base.tokens.refreshToken !== refreshToken)
        return base?.tokens.accessToken ?? null;
      const renewed: Session = { ...base, tokens };
      await this.persist(renewed);
      // Saiu enquanto gravava: a limpeza do armazenamento está na fila, logo depois desta gravação.
      if (this.sessions.current() !== base)
        return this.sessions.current()?.tokens.accessToken ?? null;
      this.sessions.save(renewed);
      return renewed.tokens.accessToken;
    });
  }

  /** O provedor recusou a renovação: volta para a tela de entrada com aviso. */
  private expire(): void {
    this.sessions.clear('expired');
    this.serialized(() => this.storage.clear()).catch(() => {});
  }

  private serialized<T>(task: () => Promise<T>): Promise<T> {
    const run = this.writes.then(task, task);
    this.writes = run.catch(() => undefined);
    return run;
  }

  private async persist(session: Session): Promise<void> {
    try {
      await this.storage.save(session);
    } catch {
      // Falha do Keystore não impede o uso agora; só não sobrevive a reabrir o app.
    }
  }

  private async enqueueRevocation(refreshToken: string): Promise<void> {
    try {
      const pending = await this.pendingRevocations.list();
      if (pending.length >= MAX_PENDING_REVOCATIONS) {
        const oldest = pending[0];
        if (oldest) await this.pendingRevocations.remove(oldest);
      }
      await this.pendingRevocations.add(refreshToken);
    } catch {
      // Sem como guardar: o refresh expira sozinho no provedor (ociosidade da sessão).
    }
  }
}
