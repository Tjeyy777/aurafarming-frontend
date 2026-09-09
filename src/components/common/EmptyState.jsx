import { Box, Stack, Typography } from '@mui/material';

/**
 * Neutral empty / no-results panel. No emoji, no jokes.
 *   <EmptyState icon={InboxIcon} title="No entries yet"
 *     description="Weighbridge trips will show up here." action={<Button>New entry</Button>} />
 */
export default function EmptyState({ icon: Icon, title, description, action, dense }) {
  return (
    <Box
      sx={{
        textAlign: 'center',
        py: dense ? 5 : 9,
        px: 3,
        border: (t) => `1px dashed ${t.palette.divider}`,
        borderRadius: '10px',
      }}
    >
      <Stack spacing={1.25} alignItems="center">
        {Icon && <Icon sx={{ fontSize: 28, color: 'text.disabled' }} />}
        <Typography variant="h4">{title}</Typography>
        {description && (
          <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 380 }}>
            {description}
          </Typography>
        )}
        {action && <Box sx={{ pt: 0.5 }}>{action}</Box>}
      </Stack>
    </Box>
  );
}
