import React, { useState, useMemo } from 'react';
import { Box, Grid, TextField, Stack, CircularProgress, Divider } from '@mui/material';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import InsightsIcon from '@mui/icons-material/Insights';
import { fetchAllWeighbridgeEntries, fetchAllRentedLogs } from '../utils/exportDataFetcher';
import { useMaterials } from '../hooks/useMaterials';
import { useParties } from '../hooks/useParties';
import PageHeader from './common/PageHeader';
import StatCard from './common/StatCard';
import { ChartCard, ChartWithTable, TrendChart, HBarChart, MiniTable } from './dashboard/DashboardKit';
import { buildRevenueCostTrend, topNplusOther, fmtCurrency, fmtCompactCurrency } from './dashboard/dashboardUtils';
import CompanyBreakdown from './dashboard/CompanyBreakdown';
import DriverPerformance from './dashboard/DriverPerformance';

const CHART_TREND = ['#2A78D6', '#EB6834']; // revenue / cost — matches slot 1 & 2

const pctDelta = (cur, prev) => {
  if (!prev) return null;
  return { value: ((cur - prev) / Math.abs(prev)) * 100 };
};

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
    placeholderData: keepPreviousData,
  });
  const { data: rentedLogsData, isLoading: loadingRented } = useQuery({
    queryKey: ['rentedLogsAll'],
    queryFn: fetchAllRentedLogs,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
  const { isLoading: loadingMat } = useMaterials();
  const { data: parties = [] } = useParties();

  const analytics = useMemo(() => {
    if (!weighbridgeData || !rentedLogsData) return null;

    const start = new Date(startDate); start.setHours(0, 0, 0, 0);
    const end = new Date(endDate); end.setHours(23, 59, 59, 999);
    const spanMs = end - start;
    const prevStart = new Date(start.getTime() - spanMs - 1);
    const prevEnd = new Date(start.getTime() - 1);

    const inRange = (d, s, e) => d >= s && d <= e;

    let revenue = 0, cost = 0, tonnes = 0;
    let prevRevenue = 0, prevCost = 0;
    const materialRevenue = {};
    const materialCost = {};

    weighbridgeData.forEach((e) => {
      if (e.status !== 'completed' || !e.netWeight || !e.materialRate) return;
      const d = new Date(e.entryTime || e.exitTime || e.createdAt);
      const rev = (e.netWeight / 1000) * e.materialRate;
      if (inRange(d, start, end)) {
        revenue += rev;
        tonnes += e.netWeight / 1000;
        const m = e.materialId?.name || 'Unspecified';
        if (!materialRevenue[m]) materialRevenue[m] = { name: m, revenue: 0, trips: 0, weight: 0 };
        materialRevenue[m].revenue += rev;
        materialRevenue[m].trips += 1;
        materialRevenue[m].weight += e.netWeight;
      } else if (inRange(d, prevStart, prevEnd)) {
        prevRevenue += rev;
      }
    });

    rentedLogsData.forEach((l) => {
      if (l.isTrip) return;
      const d = new Date(l.date);
      const c = Number(l.cost || 0);
      if (inRange(d, start, end)) {
        cost += c;
        const m = l.materialId?.name || 'Unspecified';
        if (!materialCost[m]) materialCost[m] = { name: m, cost: 0, hours: 0 };
        materialCost[m].cost += c;
        materialCost[m].hours += Number(l.totalHours || 0);
      } else if (inRange(d, prevStart, prevEnd)) {
        prevCost += c;
      }
    });

    return {
      revenue, cost, tonnes,
      profit: revenue - cost,
      prevProfit: prevRevenue - prevCost,
      costPerTonne: tonnes > 0 ? cost / tonnes : 0,
      prevRevenue, prevCost,
      materialRevenue: Object.values(materialRevenue).sort((a, b) => b.revenue - a.revenue),
      materialCost: Object.values(materialCost).sort((a, b) => b.cost - a.cost),
    };
  }, [weighbridgeData, rentedLogsData, startDate, endDate]);

  const rcTrend = useMemo(
    () => buildRevenueCostTrend(weighbridgeData, rentedLogsData, startDate, endDate),
    [weighbridgeData, rentedLogsData, startDate, endDate],
  );

  const isLoading = (loadingWb && !weighbridgeData) || (loadingRented && !rentedLogsData) || loadingMat;
  if (isLoading) {
    return (
      <Box sx={{ py: 12, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  const a = analytics || {};
  const revSpark = rcTrend.map((d) => d.revenue);
  const costSpark = rcTrend.map((d) => d.cost);
  const profitSpark = rcTrend.map((d) => d.profit);

  const revByMaterial = topNplusOther(
    (a.materialRevenue || []).map((m) => ({ name: m.name, value: m.revenue })), 'value', 8,
  );
  const costByMaterial = topNplusOther(
    (a.materialCost || []).map((m) => ({ name: m.name, value: m.cost })), 'value', 8,
  );

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: '1840px', mx: 'auto', pb: 10 }}>
      <PageHeader
        icon={InsightsIcon}
        title="Analytics"
        subtitle="Revenue vs cost from material production and rented machinery"
        actions={(
          <Stack direction="row" spacing={1.5}>
            <TextField type="date" label="From" InputLabelProps={{ shrink: true }} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <TextField type="date" label="To" InputLabelProps={{ shrink: true }} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </Stack>
        )}
      />

      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            label="Revenue (weighbridge)"
            value={fmtCurrency(a.revenue)}
            delta={pctDelta(a.revenue, a.prevRevenue)}
            trend={revSpark}
            trendColor={CHART_TREND[0]}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            label="Cost (rented machinery)"
            value={fmtCurrency(a.cost)}
            delta={pctDelta(a.cost, a.prevCost) && { ...pctDelta(a.cost, a.prevCost), goodWhenUp: false }}
            trend={costSpark}
            trendColor={CHART_TREND[1]}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            label="Net profit"
            value={`${a.profit < 0 ? '−' : ''}${fmtCurrency(Math.abs(a.profit || 0))}`}
            accent={a.profit >= 0 ? 'success.main' : 'error.main'}
            delta={pctDelta(a.profit, a.prevProfit)}
            trend={profitSpark}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            label="Cost per tonne"
            value={fmtCurrency(a.costPerTonne)}
            sub={`${(a.tonnes || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })} t produced`}
          />
        </Grid>
      </Grid>

      <Box sx={{ mb: 4 }}>
        <ChartCard title="Revenue vs cost" subtitle="Shaded band is profit — green above, red below" height={360}>
          {rcTrend.length === 0
            ? <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>No data in this period.</Box>
            : (
              <TrendChart
                data={rcTrend}
                valueFormatter={fmtCompactCurrency}
                splitKey="profit"
                series={[
                  { key: 'revenue', name: 'Revenue', color: CHART_TREND[0] },
                  { key: 'cost', name: 'Cost', color: CHART_TREND[1] },
                ]}
              />
            )}
        </ChartCard>
      </Box>

      <Grid container spacing={3} alignItems="flex-start">
        <Grid item xs={12} lg={6}>
          <ChartWithTable
            title="Revenue by material"
            chart={
              revByMaterial.length === 0
                ? <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>No revenue in this period.</Box>
                : <HBarChart data={revByMaterial} valueKey="value" valueFormatter={fmtCompactCurrency} color={CHART_TREND[0]} labelWidth={120} />
            }
            table={(
              <MiniTable
                minWidth={380}
                emptyText="No revenue in this period."
                columns={[
                  { key: 'name', label: 'Material', bold: true },
                  { key: 'weight', label: 'Weight', align: 'right', mono: true },
                  { key: 'trips', label: 'Trips', align: 'right', mono: true },
                  { key: 'revenue', label: 'Revenue', align: 'right', mono: true, bold: true, color: 'success.main' },
                ]}
                rows={(a.materialRevenue || []).map((m) => ({
                  name: m.name,
                  weight: `${(m.weight / 1000).toFixed(2)} t`,
                  trips: m.trips,
                  revenue: fmtCurrency(m.revenue),
                }))}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} lg={6}>
          <ChartWithTable
            title="Rented cost by material"
            chart={
              costByMaterial.length === 0
                ? <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>No rented cost in this period.</Box>
                : <HBarChart data={costByMaterial} valueKey="value" valueFormatter={fmtCompactCurrency} color={CHART_TREND[1]} labelWidth={120} />
            }
            table={(
              <MiniTable
                minWidth={320}
                emptyText="No rented cost in this period."
                columns={[
                  { key: 'name', label: 'Material', bold: true },
                  { key: 'hours', label: 'Hours', align: 'right', mono: true },
                  { key: 'cost', label: 'Cost', align: 'right', mono: true, bold: true, color: 'error.main' },
                ]}
                rows={(a.materialCost || []).map((m) => ({
                  name: m.name,
                  hours: `${m.hours.toFixed(1)} h`,
                  cost: fmtCurrency(m.cost),
                }))}
              />
            )}
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
