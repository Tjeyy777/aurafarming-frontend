import { Stack, ToggleButtonGroup, ToggleButton, IconButton, Typography, TextField } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { getDateRange, shiftAnchor, toISODate, periodLabel, isCurrentPeriod } from '../../utils/dateRange';

/**
 * value: { period: 'day'|'week'|'month'|'custom', anchor: ISO, customStart: ISO, customEnd: ISO }
 * onChange(next) with the same shape.
 */
export default function PeriodPicker({ value, onChange }) {
  const { period, anchor, customStart, customEnd } = value;

  const setPeriod = (_e, p) => {
    if (!p || p === period) return;
    if (p === 'custom') {
      const src = period === 'custom' ? 'month' : period;
      const { start, end } = getDateRange(src, anchor);
      onChange({ ...value, period: 'custom', customStart: toISODate(start), customEnd: toISODate(end) });
    } else {
      onChange({ ...value, period: p });
    }
  };

  const step = (dir) => onChange({ ...value, anchor: toISODate(shiftAnchor(period, anchor, dir)) });

  return (
    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
      <ToggleButtonGroup
        size="small"
        exclusive
        value={period}
        onChange={setPeriod}
        sx={{ '& .MuiToggleButton-root': { px: 1.5, py: 0.4, textTransform: 'none' } }}
      >
        <ToggleButton value="day">Day</ToggleButton>
        <ToggleButton value="week">Week</ToggleButton>
        <ToggleButton value="month">Month</ToggleButton>
        <ToggleButton value="custom">Custom</ToggleButton>
      </ToggleButtonGroup>

      {period === 'custom' ? (
        <Stack direction="row" spacing={1}>
          <TextField
            type="date" size="small" label="From" InputLabelProps={{ shrink: true }}
            value={customStart} onChange={(e) => onChange({ ...value, customStart: e.target.value })}
          />
          <TextField
            type="date" size="small" label="To" InputLabelProps={{ shrink: true }}
            value={customEnd} onChange={(e) => onChange({ ...value, customEnd: e.target.value })}
          />
        </Stack>
      ) : (
        <Stack direction="row" alignItems="center" spacing={0.25}>
          <IconButton size="small" onClick={() => step(-1)}><ChevronLeftIcon fontSize="small" /></IconButton>
          <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 150, textAlign: 'center' }}>
            {periodLabel(period, anchor)}
          </Typography>
          <IconButton size="small" onClick={() => step(1)} disabled={isCurrentPeriod(period, anchor)}>
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Stack>
      )}
    </Stack>
  );
}
