import { Box, Stack, Typography } from '@mui/material';

/**
 * Standard page heading. One per page.
 *   <PageHeader title="Weighbridge" subtitle="Today's trips and daily totals"
 *     actions={<Button>New entry</Button>} />
 */
export default function PageHeader({ title, subtitle, actions, icon: Icon }) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      sx={{ mb: 3, gap: 2 }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        {Icon && (
          <Box
            sx={{
              width: 34, height: 34, borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: 'surface2', color: 'text.secondary',
              border: (t) => `1px solid ${t.palette.divider}`,
            }}
          >
            <Icon sx={{ fontSize: 19 }} />
          </Box>
        )}
        <Box>
          <Typography variant="h1" sx={{ fontSize: '1.375rem' }}>{title}</Typography>
          {subtitle && (
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
      {actions && <Box sx={{ flexShrink: 0 }}>{actions}</Box>}
    </Stack>
  );
}
