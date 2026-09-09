import { Grid } from "@mui/material";
import StatCard from "../common/StatCard";

export default function StatsCards({ stats }) {
  const presentPct = stats.total ? Math.round((stats.present / stats.total) * 100) : 0;

  return (
    <Grid container spacing={2.5} sx={{ mb: 3 }}>
      <Grid item xs={6} md={3}>
        <StatCard
          label="Projected daily payout"
          value={`₹${(stats.totalPay || 0).toLocaleString("en-IN")}`}
          accent="primary.main"
        />
      </Grid>
      <Grid item xs={6} md={3}>
        <StatCard label="Present" value={stats.present} hint={`${presentPct}% of workforce`} accent="success.main" />
      </Grid>
      <Grid item xs={6} md={3}>
        <StatCard label="Absent" value={stats.absent} accent="error.main" />
      </Grid>
      <Grid item xs={6} md={3}>
        <StatCard label="Unmarked" value={stats.unmarked} accent="warning.main" />
      </Grid>
    </Grid>
  );
}
