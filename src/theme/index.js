import { createTheme } from '@mui/material/styles';

// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for the design system. Both modes share one token
// set; only the values swap. Components read `theme.palette.*` and the custom
// keys below (surface2, borderStrong, textTertiary) — never raw hex.
// ─────────────────────────────────────────────────────────────────────────────

export const FONT_SANS =
  "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
export const FONT_MONO =
  "'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

// Categorical chart palette — CVD-validated (dataviz method). Fixed hue order,
// never cycled: a 9th series folds into "Other". Light + dark are the same eight
// hues stepped for each surface. Prefer `theme.palette.chart` in components;
// this export is the light set for non-theme call sites.
export const CHART_SERIES = [
  '#2A78D6', '#EB6834', '#1BAF7A', '#EDA100',
  '#E87BA4', '#008300', '#4A3AA7', '#E34948',
];

const CHART_TOKENS = {
  light: {
    series: ['#2A78D6', '#EB6834', '#1BAF7A', '#EDA100', '#E87BA4', '#008300', '#4A3AA7', '#E34948'],
    // single-hue blue ramp, light→dark, for magnitude bars & heatmaps (ordinal-safe: no lighter than step 250)
    sequential: ['#86B6EF', '#6DA7EC', '#5598E7', '#3987E5', '#2A78D6', '#256ABF', '#1C5CAB'],
    grid: '#E4E1DC',
    axis: '#928C84',
    baseline: '#D6D2CB',
    up: '#15803D',
    down: '#DC2626',
    other: '#928C84',
  },
  dark: {
    series: ['#3987E5', '#D95926', '#199E70', '#C98500', '#D55181', '#008300', '#9085E9', '#E66767'],
    sequential: ['#184F95', '#1C5CAB', '#256ABF', '#2A78D6', '#3987E5', '#5598E7', '#6DA7EC'],
    grid: '#332F2B',
    axis: '#78726A',
    baseline: '#403B36',
    up: '#4ADE80',
    down: '#F87171',
    other: '#78726A',
  },
};

const PALETTES = {
  light: {
    mode: 'light',
    primary: { main: '#EA580C', dark: '#C2410C', light: '#FB923C', contrastText: '#FFFFFF' },
    secondary: { main: '#2563EB', contrastText: '#FFFFFF' },
    success: { main: '#15803D', contrastText: '#FFFFFF' },
    warning: { main: '#B45309', contrastText: '#FFFFFF' },
    error: { main: '#DC2626', contrastText: '#FFFFFF' },
    info: { main: '#2563EB', contrastText: '#FFFFFF' },
    background: { default: '#F7F6F4', paper: '#FFFFFF' },
    text: { primary: '#1C1A17', secondary: '#6B6660', disabled: '#928C84' },
    divider: '#E4E1DC',
    surface2: '#F2F0ED',
    borderStrong: '#D6D2CB',
    textTertiary: '#928C84',
    chart: CHART_TOKENS.light,
  },
  dark: {
    mode: 'dark',
    primary: { main: '#F97316', dark: '#C2410C', light: '#FB923C', contrastText: '#FFFFFF' },
    secondary: { main: '#60A5FA', contrastText: '#0B0B0C' },
    success: { main: '#4ADE80', contrastText: '#0B0B0C' },
    warning: { main: '#FBBF24', contrastText: '#0B0B0C' },
    error: { main: '#F87171', contrastText: '#0B0B0C' },
    info: { main: '#60A5FA', contrastText: '#0B0B0C' },
    background: { default: '#191816', paper: '#211F1D' },
    text: { primary: '#F2EFEA', secondary: '#A8A29A', disabled: '#78726A' },
    divider: '#332F2B',
    surface2: '#2A2724',
    borderStrong: '#403B36',
    textTertiary: '#78726A',
    chart: CHART_TOKENS.dark,
  },
};

function buildShadows(isDark) {
  const rgb = isDark ? '0, 0, 0' : '28, 26, 23';
  const s = (y, blur, a) => `0px ${y}px ${blur}px rgba(${rgb}, ${a})`;
  const base = [
    'none',
    s(1, 2, isDark ? 0.4 : 0.05),
    s(2, 6, isDark ? 0.44 : 0.07),
    s(4, 12, isDark ? 0.48 : 0.09),
    s(10, 28, isDark ? 0.55 : 0.12),
  ];
  const arr = [...base];
  while (arr.length < 25) arr.push(base[4]);
  return arr;
}

export const getDesignTokens = (mode) => {
  const p = PALETTES[mode] || PALETTES.dark;
  const isDark = p.mode === 'dark';

  return {
    palette: p,
    shape: { borderRadius: 8 },
    shadows: buildShadows(isDark),
    typography: {
      fontFamily: FONT_SANS,
      fontFamilyMono: FONT_MONO,
      h1: { fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.25 },
      h2: { fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.015em', lineHeight: 1.3 },
      h3: { fontSize: '1.125rem', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.35 },
      h4: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.4 },
      h5: { fontSize: '0.9375rem', fontWeight: 600, lineHeight: 1.45 },
      h6: { fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.45 },
      subtitle1: { fontSize: '0.9375rem', fontWeight: 600, lineHeight: 1.5 },
      subtitle2: { fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.45 },
      body1: { fontSize: '0.9375rem', fontWeight: 400, lineHeight: 1.55 },
      body2: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.5 },
      caption: { fontSize: '0.75rem', fontWeight: 400, lineHeight: 1.4 },
      overline: {
        fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.06em',
        textTransform: 'uppercase', lineHeight: 1.4,
      },
      button: { fontSize: '0.875rem', fontWeight: 500, textTransform: 'none', letterSpacing: 0 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: p.background.default,
            color: p.text.primary,
            fontFamily: FONT_SANS,
          },
          '*::selection': {
            background: isDark ? 'rgba(249, 115, 22, 0.28)' : 'rgba(234, 88, 12, 0.16)',
          },
          '*::-webkit-scrollbar': { width: 10, height: 10 },
          '*::-webkit-scrollbar-thumb': {
            backgroundColor: p.borderStrong,
            borderRadius: 8,
            border: `2px solid ${p.background.default}`,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
          outlined: { borderColor: p.divider },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: `1px solid ${p.divider}`,
            borderRadius: 10,
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 8, textTransform: 'none', fontWeight: 500 },
          sizeLarge: { paddingTop: 9, paddingBottom: 9, fontSize: '0.9375rem' },
          containedPrimary: { '&:hover': { backgroundColor: p.primary.dark } },
          outlined: { borderColor: p.borderStrong },
        },
      },
      MuiIconButton: {
        styleOverrides: { root: { borderRadius: 8 } },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 6, fontWeight: 500, height: 24 },
          label: { textTransform: 'none', paddingLeft: 8, paddingRight: 8 },
          sizeSmall: { height: 20, fontSize: '0.6875rem' },
          outlined: { borderColor: p.borderStrong },
        },
      },
      MuiTextField: { defaultProps: { size: 'small' } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { borderRadius: 8 },
          notchedOutline: { borderColor: p.borderStrong },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
            backgroundImage: 'none',
            border: `1px solid ${p.divider}`,
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: { root: { fontSize: '1.0625rem', fontWeight: 600 } },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? '#2A2724' : '#1C1A17',
            color: '#F2EFEA',
            fontSize: '0.75rem',
            fontWeight: 400,
            borderRadius: 6,
            padding: '6px 10px',
          },
          arrow: { color: isDark ? '#2A2724' : '#1C1A17' },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { borderColor: p.divider },
          head: {
            fontWeight: 600,
            color: p.text.secondary,
            fontSize: '0.75rem',
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
          },
        },
      },
      MuiDivider: { styleOverrides: { root: { borderColor: p.divider } } },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            '&.Mui-selected': {
              backgroundColor: isDark ? 'rgba(249, 115, 22, 0.14)' : 'rgba(234, 88, 12, 0.10)',
              '&:hover': {
                backgroundColor: isDark ? 'rgba(249, 115, 22, 0.20)' : 'rgba(234, 88, 12, 0.14)',
              },
            },
          },
        },
      },
      MuiTab: {
        styleOverrides: { root: { textTransform: 'none', fontWeight: 600, fontSize: '0.875rem' } },
      },
    },
  };
};

// Default export kept for any legacy `import { theme }` — the app builds its
// live theme from getDesignTokens() in App.jsx.
export const theme = createTheme(getDesignTokens('dark'));
