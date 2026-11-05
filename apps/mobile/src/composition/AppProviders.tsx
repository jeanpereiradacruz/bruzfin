import { createContext, type ReactNode, useContext } from 'react';
import { type AppDependencies, createAppDependencies } from './dependencies';

const DependenciesContext = createContext<AppDependencies | null>(null);

type AppProvidersProps = {
  readonly children: ReactNode;
  /** Permite injetar dependências falsas em testes. */
  readonly dependencies?: AppDependencies;
};

/**
 * Composition root: o único lugar que conhece as implementações concretas (adapters).
 * As telas recebem os casos de uso por `useDependencies()` e nunca falam com HTTP diretamente.
 */
export function AppProviders({ children, dependencies }: AppProvidersProps) {
  return (
    <DependenciesContext.Provider value={dependencies ?? createAppDependencies()}>
      {children}
    </DependenciesContext.Provider>
  );
}

export function useDependencies(): AppDependencies {
  const dependencies = useContext(DependenciesContext);
  if (!dependencies) {
    throw new Error('useDependencies precisa estar dentro de <AppProviders>.');
  }
  return dependencies;
}
