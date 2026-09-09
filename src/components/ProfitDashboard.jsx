import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Stack,
  CircularProgress, useTheme, Paper, Divider
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ScaleIcon from "@mui/icons-material/Scale";
import { fetchAllWeighbridgeEntries, fetchAllRentedLogs } from '../utils/exportDataFetcher';
import { useMaterials } from '../hooks/useMaterials';
import { useParties } from '../hooks/useParties';
import CompanyBreakdown from './dashboard/CompanyBreakdown';
import DriverPerformance from './dashboard/DriverPerformance';

const fmtCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);

function StatCard({ label, value, icon: Icon, accent, isProfit }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <Card
      sx={{
        borderRadius: "16px",
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: isDark ? "rgba(18,22,30,0.7)" : "#fff",
        backdropFilter: "blur(12px)",
        transition: "transform 0.18s",
        "&:hover": { transform: "translateY(-2px)" },
      }}
    >
      <CardContent sx={{ p: "24px !important" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {label}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 1, color: isProfit ? (value >= 0 ? '#10b981' : '#ef4444') : accent || "text.primary" }}>
              {isProfit && value < 0 ? `-${fmtCurrency(Math.abs(value))}` : (typeof value === 'number' ? fmtCurrency(value) : value)}
            </Typography>
          </Box>
          {Icon && (
            <Box sx={{ bgcolor: accent ? `${accent}18` : (isDark ? "rgba(255,255,255,0.06)" : "#f4f6f8"), borderRadius: "12px", p: 1.5 }}>
              <Icon sx={{ fontSize: 26, color: accent || "text.secondary" }} />
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function ProfitDashboard() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // Default to current month
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);

  const { data: weighbridgeData, isLoading: loadingWb } = useQuery({
    queryKey: ['weighbridgeAll'],
    queryFn: fetchAllWeighbridgeEntries,
    staleTime: 5 * 60 * 1000,
  });

  const { data: rentedLogsData, isLoading: loadingRented } = useQuery({
    queryKey: ['rentedLogsAll'],
    queryFn: fetchAllRentedLogs,
    staleTime: 5 * 60 * 1000,
  });

  const { isLoading: loadingMat } = useMaterials();
  const { data: parties = [] } = useParties();

  const analytics = useMemo(() => {
    if (!weighbridgeData || !rentedLogsData) return null;

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    let totalRevenue = 0;
    let totalCost = 0;
    const materialRevenue = {};
    const materialCost = {};

    // Filter and aggregate weighbridge (Revenue = net tons × material rate)
    weighbridgeData.forEach((entry) => {
      if (entry.status !== 'completed') return;
      const entryDate = new Date(entry.entryTime || entry.exitTime || entry.createdAt);
      if (entryDate >= start && entryDate <= end) {
        if (entry.netWeight && entry.materialRate) {
          const rev = (entry.netWeight / 1000) * entry.materialRate;
          totalRevenue += rev;

          const mat = entry.materialId?.name || 'Unspecified';
          if (!materialRevenue[mat]) materialRevenue[mat] = { revenue: 0, trips: 0, weight: 0 };
          materialRevenue[mat].revenue += rev;
          materialRevenue[mat].trips += 1;
          materialRevenue[mat].weight += entry.netWeight;
        }
      }
    });

    // Filter and aggregate rented logs (Cost = backend-computed hours × hourly rate)
    rentedLogsData.forEach((log) => {
      if (log.isTrip) return; // trips carry no cost
      const logDate = new Date(log.date);
      if (logDate >= start && logDate <= end) {
        const cost = log.cost || 0;
        const hours = log.totalHours || 0;
        if (cost > 0 || hours > 0) {
          totalCost += cost;

          const mat = log.materialId?.name || 'Unspecified';
          if (!materialCost[mat]) materialCost[mat] = { cost: 0, hours: 0 };
          materialCost[mat].cost += cost;
          materialCost[mat].hours += hours;
        }
      }
    });

    return {
      totalRevenue,
      totalCost,
      profit: totalRevenue - totalCost,
      materialRevenue,
      materialCost,
    };
  }, [weighbridgeData, rentedLogsData, startDate, endDate]);

  const isLoading = loadingWb || loadingRented || loadingMat;

  if (isLoading) {
    return (
      <Box sx={{ py: 10, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: "1600px", mx: "auto", pb: 10 }}>
      {/* Header & Controls */}
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} sx={{ mb: 4, gap: 2 }}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ bgcolor: "#8b5cf6", borderRadius: "10px", p: 1, display: "flex" }}>
              <AccountBalanceWalletIcon sx={{ fontSize: 24, color: "#fff" }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>Profit Analytics</Typography>
          </Stack>
          <Typography variant="body1" sx={{ color: "text.secondary", pl: "52px", mt: 0.5 }}>
            Revenue vs Cost analysis based on material production and rented machinery
          </Typography>
        </Box>
        <Paper elevation={0} sx={{ p: 1, display: 'flex', gap: 2, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#fff', borderRadius: "12px", border: `1px solid ${theme.palette.divider}` }}>
          <TextField
            type="date"
            label="Start Date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <TextField
            type="date"
            label="End Date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </Paper>
      </Stack>

      {/* Primary Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <StatCard label="Total Revenue (Weighbridge)" value={analytics?.totalRevenue} icon={ScaleIcon} accent="#3b82f6" />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard label="Total Cost (Rented Machinery)" value={analytics?.totalCost} icon={LocalShippingIcon} accent="#f59e0b" />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard label="Net Profit" value={analytics?.profit} icon={analytics?.profit >= 0 ? TrendingUpIcon : TrendingDownIcon} isProfit />
        </Grid>
      </Grid>

      {/* Detailed Breakdown */}
      <Grid container spacing={3}>
        {/* Revenue Breakdown */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: "16px", border: `1px solid ${theme.palette.divider}`, bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#fff", height: '100%' }}>
            <Box sx={{ p: 2.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Revenue by Material</Typography>
            </Box>
            <CardContent sx={{ p: 0 }}>
              {Object.keys(analytics?.materialRevenue || {}).length === 0 ? (
                <Typography sx={{ p: 3, color: 'text.secondary', textAlign: 'center' }}>No revenue data for this period.</Typography>
              ) : (
                <Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', p: 2, bgcolor: isDark ? 'rgba(0,0,0,0.2)' : '#f8faff', borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>Material</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', textAlign: 'right' }}>Weight</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', textAlign: 'right' }}>Trips</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', textAlign: 'right' }}>Revenue</Typography>
                  </Box>
                  {Object.entries(analytics.materialRevenue).sort((a, b) => b[1].revenue - a[1].revenue).map(([mat, data]) => (
                    <Box key={mat} sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                      <Typography sx={{ fontWeight: 700 }}>{mat}</Typography>
                      <Typography sx={{ textAlign: 'right' }}>{(data.weight / 1000).toFixed(2)} T</Typography>
                      <Typography sx={{ textAlign: 'right' }}>{data.trips}</Typography>
                      <Typography sx={{ textAlign: 'right', fontWeight: 800, color: '#10b981' }}>{fmtCurrency(data.revenue)}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Cost Breakdown */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: "16px", border: `1px solid ${theme.palette.divider}`, bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#fff", height: '100%' }}>
            <Box sx={{ p: 2.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Rented Cost by Material</Typography>
            </Box>
            <CardContent sx={{ p: 0 }}>
              {Object.keys(analytics?.materialCost || {}).length === 0 ? (
                <Typography sx={{ p: 3, color: 'text.secondary', textAlign: 'center' }}>No cost data for this period.</Typography>
              ) : (
                <Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', p: 2, bgcolor: isDark ? 'rgba(0,0,0,0.2)' : '#f8faff', borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>Material</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', textAlign: 'right' }}>Hours</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', textAlign: 'right' }}>Cost</Typography>
                  </Box>
                  {Object.entries(analytics.materialCost).sort((a, b) => b[1].cost - a[1].cost).map(([wt, data]) => (
                    <Box key={wt} sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                      <Typography sx={{ fontWeight: 700 }}>{wt}</Typography>
                      <Typography sx={{ textAlign: 'right' }}>{data.hours.toFixed(1)} h</Typography>
                      <Typography sx={{ textAlign: 'right', fontWeight: 800, color: '#ef4444' }}>{fmtCurrency(data.cost)}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 6 }} />
      <CompanyBreakdown logs={rentedLogsData || []} parties={parties} startDate={startDate} endDate={endDate} />

      <Divider sx={{ my: 6 }} />
      <DriverPerformance logs={rentedLogsData || []} startDate={startDate} endDate={endDate} />
    </Box>
  );
}
