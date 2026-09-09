// Chart-specific building blocks for the analytics dashboard. Generic pieces
// (StatCard, EmptyState, PageHeader) live in ../common.
import { Box, Card, CardContent, Stack, Typography, useTheme } from '@mui/material';

export { default as StatCard } from '../common/StatCard';
export { default as EmptyState } from '../common/EmptyState';

export function ChartCard({ title, subtitle, children, height = 420 }) {
  return (
    <Card sx={{ height: '100%' }}>
      <Box sx={{ px: 2.5, py: 1.75, borderBottom: (t) => `1px solid ${t.palette.divider}` }}>
        <Typography variant="h4">{title}</Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{subtitle}</Typography>
        )}
      </Box>
      <CardContent sx={{ p: 2, height, '&:last-child': { pb: 2 } }}>{children}</CardContent>
    </Card>
  );
}

export function ChartTooltip({ active, payload, label, valueFormatter }) {
  const theme = useTheme();
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: `1px solid ${theme.palette.borderStrong}`,
        borderRadius: '8px',
        p: 1.25,
        boxShadow: theme.shadows[3],
      }}
    >
      {label != null && label !== '' && (
        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
          {label}
        </Typography>
      )}
      {payload.map((p, i) => (
        <Stack key={p.dataKey ?? i} direction="row" spacing={1} alignItems="center">
          <Box sx={{ width: 9, height: 9, borderRadius: '2px', bgcolor: p.color || p.fill || p.payload?.fill }} />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{p.name}:</Typography>
          <Typography
            variant="caption"
            sx={{ fontWeight: 600, fontFamily: (t) => t.typography.fontFamilyMono }}
          >
            {valueFormatter ? valueFormatter(p.value, p.dataKey) : p.value}
          </Typography>
        </Stack>
      ))}
    </Box>
  );
}

// Lightweight table matching the app's density. `columns`: array of
// { key, label, align?, width?, bold?, color?, mono?, render? }. Rows may carry
// an `onClick` and `selected`.
export function MiniTable({ columns, rows, emptyText = 'No data', minWidth = 520 }) {
  const theme = useTheme();
  const grid = columns.map((c) => c.width || '1fr').join(' ');
  return (
    <Card sx={{ overflow: 'hidden' }}>
      <Box sx={{ overflowX: 'auto' }}>
        <Box sx={{ minWidth }}>
          <Box
            sx={{
              display: 'grid', gridTemplateColumns: grid, gap: 1,
              px: 2, py: 1.25,
              bgcolor: 'surface2',
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            {columns.map((c) => (
              <Typography
                key={c.key}
                variant="overline"
                sx={{ color: 'text.secondary', textAlign: c.align || 'left', letterSpacing: '0.03em' }}
              >
                {c.label}
              </Typography>
            ))}
          </Box>
          {rows.length === 0 ? (
            <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }} variant="body2">
              {emptyText}
            </Typography>
          ) : (
            rows.map((r, i) => (
              <Box
                key={r.id ?? i}
                onClick={r.onClick}
                sx={{
                  display: 'grid', gridTemplateColumns: grid, gap: 1,
                  px: 2, py: 1.25,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  cursor: r.onClick ? 'pointer' : 'default',
                  bgcolor: r.selected ? 'action.selected' : 'transparent',
                  '&:hover': { bgcolor: r.onClick ? 'action.hover' : 'transparent' },
                  '&:last-of-type': { borderBottom: 'none' },
                }}
              >
                {columns.map((c) => (
                  <Typography
                    key={c.key}
                    variant="body2"
                    sx={{
                      textAlign: c.align || 'left',
                      fontWeight: c.bold ? 600 : 400,
                      color: c.color || 'text.primary',
                      fontFamily: c.mono ? (t) => t.typography.fontFamilyMono : undefined,
                      fontVariantNumeric: c.mono ? 'tabular-nums' : undefined,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}
                  >
                    {c.render ? c.render(r) : r[c.key]}
                  </Typography>
                ))}
              </Box>
            ))
          )}
        </Box>
      </Box>
    </Card>
  );
}
