import { Box, Card, Stack, Typography } from '@mui/material';

/**
 * Titled bordered container for a block of content on a page.
 *   <Section title="Revenue by material" action={<Button size="small">Export</Button>}>
 *     ...
 *   </Section>
 */
export default function Section({ title, subtitle, action, children, disablePadding }) {
  return (
    <Card>
      {(title || action) && (
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ px: 2.5, py: 1.75, borderBottom: (t) => `1px solid ${t.palette.divider}` }}
        >
          <Box>
            {title && <Typography variant="h4">{title}</Typography>}
            {subtitle && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{subtitle}</Typography>
            )}
          </Box>
          {action}
        </Stack>
      )}
      <Box sx={{ p: disablePadding ? 0 : 2.5 }}>{children}</Box>
    </Card>
  );
}
