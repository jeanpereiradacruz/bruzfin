/**
 * Erro de domínio: uma regra de negócio violada ou uma entrada inválida.
 * `code` é estável (para testes e tradução); `message` é o texto em pt-BR para o usuário.
 */
export type DomainError<Code extends string = string> = {
  readonly code: Code;
  readonly message: string;
};

export const domainError = <Code extends string>(
  code: Code,
  message: string,
): DomainError<Code> => ({ code, message });
