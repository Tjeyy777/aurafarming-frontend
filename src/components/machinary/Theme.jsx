import { createTheme, alpha } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#f97316',
      light: '#fb923c',
      dark: '#ea580c',
      contrastText: '#fff',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
    },
    background: {
      default: 'hsl(220, 20%, 7%)',
      paper: 'hsl(220, 18%, 11%)',
    },
    text: {
      primary: 'hsl(220, 10%, 92%)',
      secondary: 'hsl(220, 10%, 55%)',
    },
    divider: 'hsl(220, 14%, 18%)',
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"DM Sans", "Inter", sans-serif',
    h5: { fontWeight: 700, letterSpacing: '-0.02em' },
    h6: { fontWeight: 600, letterSpacing: '-0.01em' },
    subtitle2: { fontWeight: 600, letterSpacing: '0.06em', fontSize: '0.7rem', textTransform: 'uppercase' },
    body2: { fontSize: '0.8rem' },
    caption: { fontSize: '0.7rem', letterSpacing: '0.04em' },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 10 },
        sizeSmall: { fontSize: '0.75rem', padding: '5px 12px' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid hsl(220, 14%, 18%)',
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            '& fieldset': { borderColor: 'hsl(220, 14%, 22%)' },
            '&:hover fieldset': { borderColor: 'hsl(220, 14%, 32%)' },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.05em' },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', minHeight: 40 },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 40 },
        indicator: { height: 3, borderRadius: 2 },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 600,
            fontSize: '0.68rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'hsl(220, 10%, 55%)',
            borderBottom: '1px solid hsl(220, 14%, 18%)',
            padding: '10px 16px',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid hsl(220, 14%, 16%)',
          padding: '10px 16px',
          fontSize: '0.82rem',
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: { padding: 8 },
        track: { borderRadius: 22 / 2 },
        thumb: { boxShadow: 'none' },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 4, height: 6 },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          backgroundImage: 'none',
          border: '1px solid hsl(220, 14%, 18%)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderBottom: '1px solid hsl(220, 14%, 18%)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        },
      },
    },
  },
});