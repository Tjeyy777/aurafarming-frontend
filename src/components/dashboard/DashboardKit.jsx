// Chart-specific building blocks for the analytics dashboard. Generic pieces
// (StatCard, EmptyState, PageHeader) live in ../common.
import { Box, Card, CardContent, Stack, Typography, useTheme } from '@mui/material';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList,
} from 'recharts';
import { CHART_COLORS } from './dashboardUtils';

export { default as StatCard } from '../common/StatCard';
export { default as EmptyState } from '../common/EmptyState';

export function ChartCard({ title, subtitle, action, children, height }) {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ px: 2.5, py: 1.75, borderBottom: (t) => `1px solid ${t.palette.divider}` }}
      >
        <Box>
          <Typography variant="h4">{title}</Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{subtitle}</Typography>
          )}
        </Box>
        {action}
      </Stack>
      <CardContent
        sx={{ p: 2, flexGrow: 1, ...(height ? { height } : {}), '&:last-child': { pb: 2 } }}
      >
        {children}
      </CardContent>
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

/**
 * Horizontal bar chart that grows in height with the number of rows, so it
 * never compresses however much data is passed. Category labels sit on the Y
 * axis (they never collide). Pass pre-sorted, already top-N'd data.
 */
export function HBarChart({
  data,
  labelKey = 'name',
  valueKey = 'value',
  valueFormatter = (v) => v,
  colorByIndex = false,
  color,
  barLabels = true,
  rowHeight = 34,
  minHeight = 160,
  labelWidth = 140,
}) {
  const theme = useTheme();
  const axis = theme.palette.text.secondary;
  const rows = data || [];
  const height = Math.max(minHeight, rows.length * rowHeight + 16);
  const barColor = color || CHART_COLORS[0];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} layout="vertical" margin={{ left: 4, right: barLabels ? 64 : 16, top: 4, bottom: 4 }} barCategoryGap="22%">
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} horizontal={false} />
        <XAxis type="number" tick={{ fill: axis, fontSize: 12 }} tickFormatter={valueFormatter} />
        <YAxis
          type="category"
          dataKey={labelKey}
          width={labelWidth}
          tick={{ fill: axis, fontSize: 12 }}
          interval={0}
        />
        <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} cursor={{ fill: 'rgba(128,128,128,0.08)' }} />
        <Bar dataKey={valueKey} radius={[0, 4, 4, 0]} maxBarSize={24}>
          {colorByIndex
            ? rows.map((r, i) => (
                <Cell key={r[labelKey] ?? i} fill={r.__other ? theme.palette.textTertiary : CHART_COLORS[i % CHART_COLORS.length]} />
              ))
            : rows.map((r, i) => (
                <Cell key={r[labelKey] ?? i} fill={r.__other ? theme.palette.textTertiary : barColor} />
              ))}
          {barLabels && (
            <LabelList
              dataKey={valueKey}
              position="right"
              formatter={valueFormatter}
              style={{ fill: axis, fontSize: 12, fontWeight: 600 }}
            />
          )}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Lightweight table matching the app's density.
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
