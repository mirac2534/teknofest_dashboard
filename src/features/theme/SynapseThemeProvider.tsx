import { createContext, useContext, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import type { PaletteMode } from '@mui/material';
import { storageKeys } from '../../utils/storage';

type ThemeContextValue = {
  mode: PaletteMode;
  toggleMode: () => void;
};

const ThemeModeContext = createContext<ThemeContextValue | null>(null);

function getInitialMode(): PaletteMode {
  const saved = localStorage.getItem(storageKeys.themeMode);
  return saved === 'light' || saved === 'dark' ? saved : 'dark';
}

export function SynapseThemeProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<PaletteMode>(getInitialMode);

  const contextValue = useMemo(
    () => ({
      mode,
      toggleMode: () => {
        setMode((currentMode) => {
          const nextMode = currentMode === 'dark' ? 'light' : 'dark';
          localStorage.setItem(storageKeys.themeMode, nextMode);
          return nextMode;
        });
      },
    }),
    [mode],
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === 'dark' ? '#38bdf8' : '#0369a1',
          },
          secondary: {
            main: mode === 'dark' ? '#34d399' : '#047857',
          },
          warning: {
            main: '#f59e0b',
          },
          error: {
            main: '#ef4444',
          },
          background: {
            default: mode === 'dark' ? '#07111f' : '#eef3f8',
            paper: mode === 'dark' ? '#0d1b2e' : '#ffffff',
          },
          text: {
            primary: mode === 'dark' ? '#e5eef8' : '#0f172a',
            secondary: mode === 'dark' ? '#93a4b8' : '#526174',
          },
          divider: mode === 'dark' ? 'rgba(148, 163, 184, 0.18)' : 'rgba(15, 23, 42, 0.12)',
        },
        typography: {
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          h1: { fontWeight: 800, letterSpacing: 0 },
          h2: { fontWeight: 800, letterSpacing: 0 },
          h3: { fontWeight: 800, letterSpacing: 0 },
          h4: { fontWeight: 800, letterSpacing: 0 },
          h5: { fontWeight: 750, letterSpacing: 0 },
          h6: { fontWeight: 750, letterSpacing: 0 },
          button: { fontWeight: 700, textTransform: 'none', letterSpacing: 0 },
        },
        shape: {
          borderRadius: 8,
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                transition: 'background-color 240ms ease, color 240ms ease',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              },
            },
          },
          MuiButtonBase: {
            defaultProps: {
              disableRipple: false,
            },
          },
        },
      }),
    [mode],
  );

  return (
    <ThemeModeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  const context = useContext(ThemeModeContext);

  if (!context) {
    throw new Error('useThemeMode must be used within SynapseThemeProvider');
  }

  return context;
}
