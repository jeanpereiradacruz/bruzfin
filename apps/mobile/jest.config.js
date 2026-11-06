/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['react-native-unistyles/mocks', './jest.setup.ts'],
  testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
  // pnpm guarda os pacotes em node_modules/.pnpm/<pacote>/node_modules/<pacote>;
  // os pacotes React Native/Expo publicam código não transpilado e precisam passar pelo Babel.
  transformIgnorePatterns: [
    'node_modules/(?!(?:\\.pnpm/[^/]+/node_modules/)?(?:(?:jest-)?react-native|@react-native(?:-community)?|expo(?:nent)?|@expo(?:nent)?/.*|@expo-google-fonts/.*|expo-.*|react-navigation|@react-navigation/.*|react-native-.*|standard-navigation|@bruzfin/.*))',
  ],
};
