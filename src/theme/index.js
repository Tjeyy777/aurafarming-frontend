import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: 'hsl(25, 95%, 53%)', // Safety Orange
      contrastText: '#fff',
    },
    background: {
      default: '#0a0c10', // Match your Layout background
      paper: '#0d1017',   // Slightly lighter for cards
    },
    text: {
      primary: 'hsl(220, 10%, 92%)',
      secondary: 'hsl(220, 10%, 65%)',
    },
    divider: 'rgba(255, 255, 255, 0.06)',
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: "'DM Mono', 'IBM Plex Mono', monospace",
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: '6px',
        },
      },
    },
  },
});

export const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // LIGHT MODE: Professional Blue & White
          primary: { main: '#1976d2' },
          background: { default: '#f8fafc', paper: '#ffffff' },
          text: { primary: '#0f172a', secondary: '#64748b' },
          divider: '#e2e8f0',
        }
      : {
          // DARK MODE: Industrial Orange & Black
          primary: { main: '#f97316' },
          background: { default: '#0a0c10', paper: '#0d1017' },
          text: { primary: '#f1f5f9', secondary: '#94a3b8' },
          divider: 'rgba(255, 255, 255, 0.06)',
        }),
  },
  typography: {
    fontFamily: mode === 'dark' ? "'DM Mono', monospace" : "'Inter', sans-serif",
  },
  shape: { borderRadius: 8 },
});