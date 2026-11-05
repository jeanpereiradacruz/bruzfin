/**
 * Dependências do app montadas no composition root.
 * Cada ticket que criar uma porta no @bruzfin/core adiciona aqui o caso de uso já ligado ao
 * adapter (ex.: KAN-25 adiciona o login com AuthGateway + expo-auth-session).
 */
export type AppDependencies = Readonly<Record<string, never>>;

export const createAppDependencies = (): AppDependencies => ({});
