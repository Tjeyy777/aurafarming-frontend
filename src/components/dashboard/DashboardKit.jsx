// Chart building blocks for the analytics dashboard, built to the dataviz
// method: forms match the question, one axis, categorical hues in fixed order,
// solid hairline grid, thin marks, selective labels, a table twin for each.
import { useMemo, useState } from 'react';
import {
  Box, Card, CardContent, Stack, Typography, ToggleButtonGroup, ToggleButton, useTheme,
} from '@mui/material';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList,
  ComposedChart, Line, Area, ReferenceLine,
} from 'recharts';

export { default as StatCard } from '../common/StatCard';
export { default as EmptyState } from '../common/EmptyState';
export { default as Sparkline } from '../common/Sparkline';



// ── Card shell ──────────────────────────────────────────────────────────────
export function ChartCard({ title, subtitle, action, children, height }) {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ px: 2.5, py: 1.5, borderBottom: (t) => `1px solid ${t.palette.divider}`, gap: 1 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" noWrap>{title}</Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{subtitle}</Typography>
          )}
        </Box>
        {action}
      </Stack>
      <CardContent sx={{ p: 2, flexGrow: 1, ...(height ? { height } : {}), '&:last-child': { pb: 2 } }}>
        {children}
      </CardContent>
    </Card>
  );
}

// Two-button Chart / Table switch for a card header.
export function ViewToggle({ value, onChange }) {
  return (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={value}
      onChange={(_e, v) => v && onChange(v)}
      sx={{ '& .MuiToggleButton-root': { px: 1, py: 0.25, fontSize: 11, textTransform: 'none', lineHeight: 1.6 } }}
    >
      <ToggleButton value="chart">Chart</ToggleButton>
      <ToggleButton value="table">Table</ToggleButton>
    </ToggleButtonGroup>
  );
}

// Wraps a chart + its table twin behind a ViewToggle.
export function ChartWithTable({ title, subtitle, height, chart, table, defaultView = 'chart' }) {
  const [view, setView] = useState(defaultView);
  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      height={view === 'chart' ? height : undefined}
      action={<ViewToggle value={view} onChange={setView} />}
    >
      {view === 'chart' ? chart : table}
    </ChartCard>
  );
}

// ── Tooltip ─────────────────────────────────────────────────────────────────
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
        minWidth: 120,
      }}
    >
      {label != null && label !== '' && (
        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
          {label}
        </Typography>
      )}
      {payload.filter((p) => p.value != null).map((p, i) => (
        <Stack key={p.dataKey ?? i} direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Box sx={{ width: 9, height: 9, borderRadius: '2px', bgcolor: p.color || p.stroke || p.fill || p.payload?.fill }} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{p.name}</Typography>
          </Stack>
          <Typography variant="caption" sx={{ fontWeight: 600, fontFamily: (t) => t.typography.fontFamilyMono, ml: 1.5 }}>
            {valueFormatter ? valueFormatter(p.value, p.dataKey) : p.value}
          </Typography>
        </Stack>
      ))}
    </Box>
  );
}

// ── Horizontal bar — magnitude, grows with row count, never compresses ──────
export function HBarChart({
  data,
  labelKey = 'name',
  valueKey = 'value',
  valueFormatter = (v) => v,
  colorByIndex = false,
  color,
  rowHeight = 32,
  minHeight = 140,
  labelWidth = 140,
}) {
  const chart = useTheme().palette.chart;
  const rows = data || [];
  const height = Math.max(minHeight, rows.length * rowHeight + 16);
  const barColor = color || chart.sequential[3];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} layout="vertical" margin={{ left: 4, right: 72, top: 4, bottom: 4 }} barCategoryGap="24%">
        <CartesianGrid stroke={chart.grid} horizontal={false} />
        <XAxis type="number" tick={{ fill: chart.axis, fontSize: 12 }} tickFormatter={valueFormatter} axisLine={{ stroke: chart.baseline }} tickLine={false} />
        <YAxis
          type="category" dataKey={labelKey} width={labelWidth}
          tick={{ fill: chart.axis, fontSize: 12 }} interval={0}
          axisLine={false} tickLine={false}
        />
        <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} cursor={{ fill: 'rgba(128,128,128,0.06)' }} />
        <Bar dataKey={valueKey} radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false}>
          {rows.map((r, i) => (
            <Cell
              key={r[labelKey] ?? i}
              fill={r.__other
                ? chart.other
                : colorByIndex ? chart.series[i % chart.series.length] : barColor}
            />
          ))}
          <LabelList
            dataKey={valueKey}
            position="right"
            formatter={valueFormatter}
            style={{ fill: chart.axis, fontSize: 11, fontWeight: 500 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Stacked horizontal bar — part-of-item composition per row ───────────────
export function StackedHBarChart({
  data, labelKey = 'name', segments, valueFormatter = (v) => v,
  rowHeight = 34, minHeight = 140, labelWidth = 140,
}) {
  const chart = useTheme().palette.chart;
  const rows = data || [];
  const height = Math.max(minHeight, rows.length * rowHeight + 24);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} layout="vertical" margin={{ left: 4, right: 16, top: 4, bottom: 4 }} barCategoryGap="28%">
        <CartesianGrid stroke={chart.grid} horizontal={false} />
        <XAxis type="number" tick={{ fill: chart.axis, fontSize: 12 }} tickFormatter={valueFormatter} axisLine={{ stroke: chart.baseline }} tickLine={false} />
        <YAxis type="category" dataKey={labelKey} width={labelWidth} tick={{ fill: chart.axis, fontSize: 12 }} interval={0} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} cursor={{ fill: 'rgba(128,128,128,0.06)' }} />
        {segments.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.name}
            stackId="a"
            fill={s.color || chart.series[i % chart.series.length]}
            maxBarSize={22}
            isAnimationActive={false}
            radius={i === segments.length - 1 ? [0, 4, 4, 0] : 0}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── 100% share bar — one row, part-to-whole, built from divs ────────────────
export function ShareBar({ data, valueKey = 'value', labelKey = 'name', valueFormatter = (v) => v }) {
  const chart = useTheme().palette.chart;
  const rows = (data || []).filter((r) => r[valueKey] > 0);
  const total = rows.reduce((s, r) => s + r[valueKey], 0) || 1;
  return (
    <Box>
      <Box sx={{ display: 'flex', gap: '2px', height: 34, borderRadius: '5px', overflow: 'hidden' }}>
        {rows.map((r, i) => {
          const pct = (r[valueKey] / total) * 100;
          return (
            <Box
              key={r[labelKey] ?? i}
              title={`${r[labelKey]}: ${valueFormatter(r[valueKey])} (${pct.toFixed(1)}%)`}
              sx={{
                width: `${pct}%`, minWidth: pct > 0 ? 3 : 0,
                bgcolor: r.__other ? chart.other : chart.series[i % chart.series.length],
              }}
            />
          );
        })}
      </Box>
      <Stack direction="row" flexWrap="wrap" sx={{ mt: 1.5, gap: '4px 16px' }}>
        {rows.map((r, i) => (
          <Stack key={r[labelKey] ?? i} direction="row" spacing={0.75} alignItems="center">
            <Box sx={{ width: 9, height: 9, borderRadius: '2px', bgcolor: r.__other ? chart.other : chart.series[i % chart.series.length] }} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {r[labelKey]} · {((r[valueKey] / total) * 100).toFixed(0)}%
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

// ── Time series — 1–3 lines on one axis, optional 0-split area for profit ───
const splitOffset = (data, key) => {
  const vals = (data || []).map((d) => d[key]).filter((v) => v != null);
  if (!vals.length) return 0;
  const max = Math.max(...vals, 0);
  const min = Math.min(...vals, 0);
  if (max <= 0) return 0;
  if (min >= 0) return 1;
  return max / (max - min);
};

export function TrendChart({ data, series, valueFormatter = (v) => v, splitKey }) {
  const chart = useTheme().palette.chart;
  const rows = data || [];
  const dense = rows.length > 24;
  const off = splitKey ? splitOffset(rows, splitKey) : 0;
  const gid = `split-${splitKey || 'x'}`;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={rows} margin={{ left: 8, right: 16, top: 8, bottom: 4 }}>
        {splitKey && (
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset={off} stopColor={chart.up} stopOpacity={0.14} />
              <stop offset={off} stopColor={chart.down} stopOpacity={0.14} />
            </linearGradient>
          </defs>
        )}
        <CartesianGrid stroke={chart.grid} vertical={false} />
        <XAxis dataKey="label" tick={{ fill: chart.axis, fontSize: 12 }} minTickGap={24} axisLine={{ stroke: chart.baseline }} tickLine={false} />
        <YAxis tick={{ fill: chart.axis, fontSize: 12 }} tickFormatter={valueFormatter} width={58} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} />
        {splitKey && <ReferenceLine y={0} stroke={chart.baseline} />}
        {splitKey && (
          <Area
            type="monotone" dataKey={splitKey} name="Net"
            stroke="none" fill={`url(#${gid})`} isAnimationActive={false}
          />
        )}
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={2}
            dot={dense ? false : { r: 3, strokeWidth: 0 }}
            activeDot={{ r: 4, strokeWidth: 2, stroke: chart.grid }}
            isAnimationActive={false}
          />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ── Heatmap — category × time grid, sequential fill, fixed cells, scrolls ───
function rampStep(value, max, ramp) {
  if (!max || value <= 0) return null;
  const t = Math.min(1, value / max);
  const idx = Math.min(ramp.length - 1, Math.round(t * (ramp.length - 1)));
  return ramp[idx];
}

export function Heatmap({ rows, cols, getValue, valueFormatter = (v) => v, rowLabelWidth = 132, cellSize = 26 }) {
  const chart = useTheme().palette.chart;
  const theme = useTheme();
  const max = useMemo(() => {
    let m = 0;
    rows.forEach((r) => cols.forEach((c) => { m = Math.max(m, getValue(r, c) || 0); }));
    return m;
  }, [rows, cols, getValue]);

  return (
    <Box>
      <Box sx={{ overflowX: 'auto', pb: 1 }}>
        <Box sx={{ display: 'inline-block', minWidth: '100%' }}>
          {/* header */}
          <Box sx={{ display: 'flex', pl: `${rowLabelWidth}px` }}>
            {cols.map((c) => (
              <Box key={c.key} sx={{ width: cellSize, flexShrink: 0, textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 10 }}>{c.short ?? c.label}</Typography>
              </Box>
            ))}
          </Box>
          {rows.map((r) => (
            <Box key={r.key} sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: rowLabelWidth, flexShrink: 0, pr: 1 }}>
                <Typography variant="body2" noWrap sx={{ fontSize: 12 }}>{r.label}</Typography>
              </Box>
              {cols.map((c) => {
                const v = getValue(r, c) || 0;
                const bg = rampStep(v, max, chart.sequential);
                return (
                  <Box
                    key={c.key}
                    title={`${r.label} · ${c.label}: ${valueFormatter(v)}`}
                    sx={{
                      width: cellSize, height: cellSize, flexShrink: 0,
                      m: '1px',
                      borderRadius: '3px',
                      bgcolor: bg || theme.palette.surface2,
                      border: bg ? 'none' : `1px solid ${theme.palette.divider}`,
                    }}
                  />
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>
      {/* legend */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>0</Typography>
        <Box sx={{ display: 'flex', gap: '2px' }}>
          {chart.sequential.map((c) => (
            <Box key={c} sx={{ width: 16, height: 10, borderRadius: '2px', bgcolor: c }} />
          ))}
        </Box>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{valueFormatter(max)}</Typography>
      </Stack>
    </Box>
  );
}

// ── Table twin — dense, matches app density ─────────────────────────────────
export function MiniTable({ columns, rows, emptyText = 'No data', minWidth = 520 }) {
  const theme = useTheme();
  const grid = columns.map((c) => c.width || '1fr').join(' ');
  return (
    <Card sx={{ overflow: 'hidden' }}>
      <Box sx={{ overflowX: 'auto' }}>
        <Box sx={{ minWidth }}>
          <Box
            sx={{
              display: 'grid', gridTemplateColumns: grid, gap: 1, px: 2, py: 1.25,
              bgcolor: 'surface2', borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            {columns.map((c) => (
              <Typography key={c.key} variant="overline" sx={{ color: 'text.secondary', textAlign: c.align || 'left', letterSpacing: '0.03em' }}>
                {c.label}
              </Typography>
            ))}
          </Box>
          {rows.length === 0 ? (
            <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }} variant="body2">{emptyText}</Typography>
          ) : (
            rows.map((r, i) => (
              <Box
                key={r.id ?? i}
                onClick={r.onClick}
                sx={{
                  display: 'grid', gridTemplateColumns: grid, gap: 1, px: 2, py: 1.25,
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
