import { Grid, Box, Typography, Divider } from '@mui/material';

export default function StatsCards({ stats, onFilterService }) {
  const cards = [
    { label: 'Total', value: stats.total, color: 'text.primary' },
    { label: 'Active', value: stats.active, color: 'success.main' },
    { 
      label: 'Service Due', 
      value: stats.dueForService, 
      statusColor: '#f59e0b', // Amber
      active: stats.dueForService > 0,
      onClick: () => onFilterService?.('due_soon') 
    },
    { 
      label: 'Overdue', 
      value: stats.overdue, 
      statusColor: '#ef4444', // Red
      active: stats.overdue > 0,
      onClick: () => onFilterService?.('overdue') 
    },
  ];

  return (
    <Grid container spacing={0}> {/* No spacing between grids for a seamless look */}
      {cards.map((card, index) => (
        <Grid item xs={6} sm={4} md={2} key={card.label}>
          <Box
            onClick={card.onClick}
            sx={{
              p: 2.5,
              cursor: card.onClick ? 'pointer' : 'default',
              bgcolor: 'background.default',
              borderRight: index === cards.length - 1 ? 'none' : '1px solid',
              borderColor: 'divider',
              transition: 'background 0.2s',
              position: 'relative',
              '&:hover': card.onClick ? {
                bgcolor: 'rgba(0,0,0,0.01)',
              } : {},
            }}
          >
            {/* Minimal Status Indicator (The Pip) */}
            {card.active && (
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 12, 
                  right: 12, 
                  width: 6, 
                  height: 6, 
                  borderRadius: '50%', 
                  bgcolor: card.statusColor,
                  boxShadow: `0 0 8px ${card.statusColor}80`
                }} 
              />
            )}

            <Typography
              sx={{
                fontSize: '0.65rem',
                fontWeight: 600,
                color: 'text.secondary',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                mb: 0.5
              }}
            >
              {card.label}
            </Typography>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 500,
                fontFamily: "'Inter', sans-serif", // Or your DM Mono for numbers
                fontVariantNumeric: 'tabular-nums',
                color: card.active ? card.statusColor : 'text.primary',
                letterSpacing: '-0.02em'
              }}
            >
              {card.value}
            </Typography>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
}