import { Grid, Card, CardContent, Typography, Box, Stack, CircularProgress } from "@mui/material";

export default function StatsCards({ stats }) {
  const presentPct = stats.total ? Math.round((stats.present / stats.total) * 100) : 0;

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} md={4}>
        <Card sx={{ borderRadius: 4, background: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)", color: "#fff", boxShadow: "0 10px 20px rgba(99, 102, 241, 0.3)" }}>
          <CardContent>
            <Typography variant="overline" sx={{ opacity: 0.8, fontWeight: 700 }}>Projected Daily Payout</Typography>
            <Typography variant="h3" fontWeight={900}>₹{stats.totalPay.toLocaleString()}</Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={8}>
        <Card sx={{ borderRadius: 4, border: "1px solid", borderColor: "divider" }}>
          <CardContent>
            <Stack direction="row" spacing={4} justifyContent="space-around" alignItems="center">
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress variant="determinate" value={presentPct} size={60} color="success" />
                <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="caption" fontWeight={700}>{`${presentPct}%`}</Typography>
                </Box>
              </Box>
              <Box textAlign="center">
                <Typography variant="h4" fontWeight={900}>{stats.present}</Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>PRESENT</Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="h4" fontWeight={900} color="error.main">{stats.absent}</Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>ABSENT</Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="h4" fontWeight={900} color="warning.main">{stats.unmarked}</Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>UNMARKED</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}