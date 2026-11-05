/**
 * Contrato de um caso de uso da camada de aplicação.
 *
 * Um caso de uso orquestra o domínio e conversa com o mundo externo apenas por **portas**
 * (interfaces declaradas aqui no core, ex.: `TransactionGateway`, `TokenStorage`).
 * As implementações das portas (adapters: HTTP, SecureStore, módulos nativos) ficam no app ou no web
 * e são injetadas pelo composition root.
 */
export interface UseCase<Input, Output> {
  execute(input: Input): Promise<Output>;
}
