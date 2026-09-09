import React, { useState, useMemo } from 'react';
import { Box, Grid, TextField, Stack, CircularProgress, Divider } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import InsightsIcon from '@mui/icons-material/Insights';
import { fetchAllWeighbridgeEntries, fetchAllRentedLogs } from '../utils/exportDataFetcher';
import { useMaterials } from '../hooks/useMaterials';
import { useParties } from '../hooks/useParties';
import PageHeader from './common/PageHeader';
import StatCard from './common/StatCard';
import { MiniTable } from './dashboard/DashboardKit';
import CompanyBreakdown from './dashboard/CompanyBreakdown';
import DriverPerformance from './dashboard/DriverPerformance';

const fmtCurrency = (val) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

export default function ProfitDashboard() {
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

    // Weighbridge revenue = net tons × material rate
    weighbridgeData.forEach((entry) => {
      if (entry.status !== 'completed') return;
      const entryDate = new Date(entry.entryTime || entry.exitTime || entry.createdAt);
      if (entryDate >= start && entryDate <= end && entry.netWeight && entry.materialRate) {
        const rev = (entry.netWeight / 1000) * entry.materialRate;
        totalRevenue += rev;
        const mat = entry.materialId?.name || 'Unspecified';
        if (!materialRevenue[mat]) materialRevenue[mat] = { revenue: 0, trips: 0, weight: 0 };
        materialRevenue[mat].revenue += rev;
        materialRevenue[mat].trips += 1;
        materialRevenue[mat].weight += entry.netWeight;
      }
    });

    // Rented cost = backend-computed hours × hourly rate
    rentedLogsData.forEach((log) => {
      if (log.isTrip) return;
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
      <Box sx={{ py: 12, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  const revenueRows = Object.entries(analytics?.materialRevenue || {})
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .map(([mat, d]) => ({ mat, weight: `${(d.weight / 1000).toFixed(2)} t`, trips: d.trips, revenue: fmtCurrency(d.revenue) }));

  const costRows = Object.entries(analytics?.materialCost || {})
    .sort((a, b) => b[1].cost - a[1].cost)
    .map(([mat, d]) => ({ mat, hours: `${d.hours.toFixed(1)} h`, cost: fmtCurrency(d.cost) }));

  const profit = analytics?.profit ?? 0;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: '1840px', mx: 'auto', pb: 10 }}>
      <PageHeader
        icon={InsightsIcon}
        title="Analytics"
        subtitle="Revenue vs cost from material production and rented machinery"
        actions={(
          <Stack direction="row" spacing={1.5}>
            <TextField
              type="date" label="From" InputLabelProps={{ shrink: true }}
              value={startDate} onChange={(e) => setStartDate(e.target.value)}
            />
            <TextField
              type="date" label="To" InputLabelProps={{ shrink: true }}
              value={endDate} onChange={(e) => setEndDate(e.target.value)}
            />
          </Stack>
        )}
      />

      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <StatCard label="Revenue (weighbridge)" value={fmtCurrency(analytics?.totalRevenue)} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard label="Cost (rented machinery)" value={fmtCurrency(analytics?.totalCost)} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            label="Net profit"
            value={`${profit < 0 ? '−' : ''}${fmtCurrency(Math.abs(profit))}`}
            accent={profit >= 0 ? 'success.main' : 'error.main'}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <MiniTable
            minWidth={420}
            emptyText="No revenue in this period."
            columns={[
              { key: 'mat', label: 'Material', bold: true },
              { key: 'weight', label: 'Weight', align: 'right', mono: true },
              { key: 'trips', label: 'Trips', align: 'right', mono: true },
              { key: 'revenue', label: 'Revenue', align: 'right', mono: true, bold: true, color: 'success.main' },
            ]}
            rows={revenueRows}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <MiniTable
            minWidth={360}
            emptyText="No rented cost in this period."
            columns={[
              { key: 'mat', label: 'Material', bold: true },
              { key: 'hours', label: 'Hours', align: 'right', mono: true },
              { key: 'cost', label: 'Cost', align: 'right', mono: true, bold: true, color: 'error.main' },
            ]}
            rows={costRows}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 6 }} />
      <CompanyBreakdown logs={rentedLogsData || []} parties={parties} startDate={startDate} endDate={endDate} />

      <Divider sx={{ my: 6 }} />
      <DriverPerformance logs={rentedLogsData || []} startDate={startDate} endDate={endDate} />
    </Box>
  );
}
