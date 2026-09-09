import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import Sparkline from './Sparkline';

/**
 * Compact KPI tile. Value renders in the mono face with tabular figures.
 *   <StatCard label="Net weight today" value="184.2 t" hint="42 trips" accent="success.main"
 *     delta={{ value: 12, goodWhenUp: true }} trend={[...12 numbers]} />
 */
export default function StatCard({ label, value, hint, sub, accent, icon: Icon, delta, trend, trendColor }) {
  const note = hint ?? sub;
  const dUp = delta && delta.value >= 0;
  const dGood = delta && (dUp === (delta.goodWhenUp !== false));

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Typography
            variant="overline"
            sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.3 }}
          >
            {label}
          </Typography>
          {Icon && <Icon sx={{ fontSize: 18, color: 'text.disabled' }} />}
        </Stack>

        <Typography
          sx={{
            mt: 0.75,
            fontFamily: (t) => t.typography.fontFamilyMono,
            fontVariantNumeric: 'tabular-nums',
            fontSize: '1.5rem',
            fontWeight: 600,
            letterSpacing: '-0.01em',
            color: accent || 'text.primary',
            lineHeight: 1.2,
          }}
        >
          {value}
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
          {delta && (
            <Stack direction="row" spacing={0.25} alignItems="center" sx={{ color: dGood ? 'success.main' : 'error.main' }}>
              {dUp ? <ArrowUpwardIcon sx={{ fontSize: 13 }} /> : <ArrowDownwardIcon sx={{ fontSize: 13 }} />}
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {Math.abs(delta.value).toFixed(0)}%
              </Typography>
            </Stack>
          )}
          {note != null && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{note}</Typography>
          )}
        </Stack>

        {trend?.length > 1 && (
          <Box sx={{ mt: 1 }}>
            <Sparkline data={trend} color={trendColor} height={30} />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
