import { Box, Card, CardContent, Stack, Typography } from '@mui/material';

/**
 * Compact KPI tile. Value renders in the mono face with tabular figures.
 *   <StatCard label="Net weight today" value="184.2 t" hint="42 trips" accent="success.main" />
 */
export default function StatCard({ label, value, hint, sub, accent, icon: Icon }) {
  const note = hint ?? sub;
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
        {note != null && (
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
            {note}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export function StatCardValue({ children, accent }) {
  return (
    <Box
      component="span"
      sx={{
        fontFamily: (t) => t.typography.fontFamilyMono,
        fontVariantNumeric: 'tabular-nums',
        color: accent,
      }}
    >
      {children}
    </Box>
  );
}
