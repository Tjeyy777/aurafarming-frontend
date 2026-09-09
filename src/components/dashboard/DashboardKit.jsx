// Small shared UI pieces for the analytics dashboard sections.
import { Box, Card, CardContent, Stack, Typography, useTheme } from '@mui/material';

export function StatCard({ label, value, sub, accent }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Card
      sx={{
        borderRadius: '14px',
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#fff',
        height: '100%',
      }}
    >
      <CardContent sx={{ p: '18px !important' }}>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary', fontWeight: 700, fontSize: 11,
            textTransform: 'uppercase', letterSpacing: '0.05em',
            display: 'block', lineHeight: 1.3,
          }}
        >
          {label}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.75, color: accent || 'text.primary' }}>
          {value}
        </Typography>
        {sub != null && (
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>
            {sub}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export function SectionHeader({ icon: Icon, color, title, subtitle, action }) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      sx={{ mb: 3, gap: 2 }}
    >
      <Box>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {Icon && (
            <Box sx={{ bgcolor: color, borderRadius: '10px', p: 1, display: 'flex' }}>
              <Icon sx={{ fontSize: 22, color: '#fff' }} />
            </Box>
          )}
          <Typography variant="h5" sx={{ fontWeight: 900 }}>{title}</Typography>
        </Stack>
        {subtitle && (
          <Typography variant="body2" sx={{ color: 'text.secondary', pl: Icon ? '46px' : 0, mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action}
    </Stack>
  );
}

export function ChartCard({ title, subtitle, children, height = 420 }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Card
      sx={{
        borderRadius: '16px',
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#fff',
        height: '100%',
      }}
    >
      <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{title}</Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{subtitle}</Typography>
        )}
      </Box>
      <CardContent sx={{ p: 2.5, pt: 2.5, height, '&:last-child': { pb: 2.5 } }}>{children}</CardContent>
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
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2, p: 1.25, boxShadow: 3,
      }}
    >
      {label != null && label !== '' && (
        <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', mb: 0.5 }}>
          {label}
        </Typography>
      )}
      {payload.map((p, i) => (
        <Stack key={p.dataKey ?? i} direction="row" spacing={1} alignItems="center">
          <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: p.color || p.fill || p.payload?.fill }} />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {p.name}:
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 700 }}>
            {valueFormatter ? valueFormatter(p.value, p.dataKey) : p.value}
          </Typography>
        </Stack>
      ))}
    </Box>
  );
}

export function EmptyState({ text = 'No data for this selection.' }) {
  return (
    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>{text}</Typography>
    </Box>
  );
}

// Lightweight table matching the ProfitDashboard style. `columns` is an array of
// { key, label, align?, width?, bold?, color?, render? }. Rows may carry an
// `onClick` for row selection.
export function MiniTable({ columns, rows, emptyText = 'No data', minWidth = 520 }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const grid = columns.map((c) => c.width || '1fr').join(' ');
  return (
    <Card
      sx={{
        borderRadius: '16px',
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#fff',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ overflowX: 'auto' }}>
        <Box sx={{ minWidth }}>
          <Box
            sx={{
              display: 'grid', gridTemplateColumns: grid, gap: 1, p: 1.5,
              bgcolor: isDark ? 'rgba(0,0,0,0.25)' : '#f8faff',
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            {columns.map((c) => (
              <Typography
                key={c.key}
                variant="caption"
                sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', textAlign: c.align || 'left' }}
              >
                {c.label}
              </Typography>
            ))}
          </Box>
          {rows.length === 0 ? (
            <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>{emptyText}</Typography>
          ) : (
            rows.map((r, i) => (
              <Box
                key={r.id ?? i}
                onClick={r.onClick}
                sx={{
                  display: 'grid', gridTemplateColumns: grid, gap: 1, p: 1.5,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  cursor: r.onClick ? 'pointer' : 'default',
                  bgcolor: r.selected ? 'action.selected' : 'transparent',
                  '&:hover': { bgcolor: r.onClick ? 'action.hover' : 'transparent' },
                }}
              >
                {columns.map((c) => (
                  <Typography
                    key={c.key}
                    variant="body2"
                    sx={{
                      textAlign: c.align || 'left',
                      fontWeight: c.bold ? 800 : 500,
                      color: c.color || 'text.primary',
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
