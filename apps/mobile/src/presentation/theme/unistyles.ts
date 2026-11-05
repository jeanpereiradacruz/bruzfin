import { StyleSheet } from 'react-native-unistyles';
import { type AppThemes, appThemes } from './theme';

declare module 'react-native-unistyles' {
  export interface UnistylesThemes extends AppThemes {}
}

StyleSheet.configure({
  themes: appThemes,
  // O tema segue o modo claro/escuro do sistema.
  settings: { adaptiveThemes: true },
});
