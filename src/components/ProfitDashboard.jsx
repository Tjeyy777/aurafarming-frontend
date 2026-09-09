import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Box, Grid, Stack, CircularProgress, Divider, Button } from '@mui/material';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import InsightsIcon from '@mui/icons-material/Insights';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { fetchAllWeighbridgeEntries, fetchAllRentedLogs } from '../utils/exportDataFetcher';
import { generateAnalyticsPDF } from '../utils/pdfGenerator';
import { useMaterials } from '../hooks/useMaterials';
import { useParties } from '../hooks/useParties';
import { getDateRange, toISODate, periodLabel, rangeLabel } from '../utils/dateRange';
import PageHeader from './common/PageHeader';
import StatCard from './common/StatCard';
import PeriodPicker from './dashboard/PeriodPicker';
import { ChartCard, ChartWithTable, TrendChart, HBarChart, MiniTable } from './dashboard/DashboardKit';
import {
  buildRevenueCostTrend, filterLogsByRange, topNplusOther, fmtCurrency, fmtCompactCurrency,
} from './dashboard/dashboardUtils';
import { profitSummary, companyRows, driverRows, utilisationGrid } from './dashboard/analyticsModel';
import CompanyBreakdown from './dashboard/CompanyBreakdown';
import DriverPerformance from './dashboard/DriverPerformance';

const REVENUE = '#2A78D6';
const COST = '#EB6834';

const pctDelta = (cur, prev) => (prev ? { value: ((cur - prev) / Math.abs(prev)) * 100 } : null);

// Fixed-size, always-light copy of the Revenue-vs-Cost chart used only for the
// PDF snapshot (html2canvas can't read the themed on-screen one reliably).
function PdfChart({ data }) {
  return (
    <ComposedChart width={860} height={330} data={data} margin={{ left: 12, right: 24, top: 18, bottom: 8 }}>
      <CartesianGrid stroke="#E4E1DC" vertical={false} />
      <XAxis dataKey="label" tick={{ fill: '#6B6660', fontSize: 12 }} axisLine={{ stroke: '#D6D2CB' }} tickLine={false} />
      <YAxis tick={{ fill: '#6B6660', fontSize: 12 }} tickFormatter={fmtCompactCurrency} axisLine={false} tickLine={false} width={64} />
      <Line type="monotone" dataKey="revenue" name="Revenue" stroke={REVENUE} strokeWidth={2} dot={false} isAnimationActive={false} />
      <Line type="monotone" dataKey="cost" name="Cost" stroke={COST} strokeWidth={2} dot={false} isAnimationActive={false} />
      <Legend />
    </ComposedChart>
  );
}

export default function ProfitDashboard() {
  const [pd, setPd] = useState(() => {
    const anchor = toISODate(new Date());
    const { start, end } = getDateRange('month', anchor);
    return { period: 'month', anchor, customStart: toISODate(start), customEnd: toISODate(end) };
  });
  const [exporting, setExporting] = useState(false);
  const pdfChartRef = useRef(null);

  const { startDate, endDate, periodLbl, isDayView } = useMemo(() => {
    if (pd.period === 'custom') {
      return { startDate: pd.customStart, endDate: pd.customEnd, periodLbl: 'Custom range', isDayView: false };
    }
    const { start, end } = getDateRange(pd.period, pd.anchor);
    return {
      startDate: toISODate(start),
      endDate: toISODate(end),
      periodLbl: `${pd.period[0].toUpperCase()}${pd.period.slice(1)} · ${periodLabel(pd.period, pd.anchor)}`,
      isDayView: pd.period === 'day',
    };
  }, [pd]);

  const { data: weighbridgeData, isLoading: loadingWb } = useQuery({
    queryKey: ['weighbridgeAll'], queryFn: fetchAllWeighbridgeEntries,
    staleTime: 5 * 60 * 1000, placeholderData: keepPreviousData,
  });
  const { data: rentedLogsData, isLoading: loadingRented } = useQuery({
    queryKey: ['rentedLogsAll'], queryFn: fetchAllRentedLogs,
    staleTime: 5 * 60 * 1000, placeholderData: keepPreviousData,
  });
  const { isLoading: loadingMat } = useMaterials();
  const { data: parties = [] } = useParties();

  const summary = useMemo(
    () => (weighbridgeData && rentedLogsData ? profitSummary(weighbridgeData, rentedLogsData, startDate, endDate) : null),
    [weighbridgeData, rentedLogsData, startDate, endDate],
  );
  const rcTrend = useMemo(
    () => buildRevenueCostTrend(weighbridgeData, rentedLogsData, startDate, endDate),
    [weighbridgeData, rentedLogsData, startDate, endDate],
  );

  const handleExportPdf = useCallback(async () => {
    if (!summary) return;
    setExporting(true);
    try {
      let chartImage = null;
      if (pdfChartRef.current && rcTrend.length > 1) {
        const { default: html2canvas } = await import('html2canvas');
        const canvas = await html2canvas(pdfChartRef.current, { scale: 2, backgroundColor: '#ffffff', logging: false });
        chartImage = canvas.toDataURL('image/png');
      }
      const periodLogs = filterLogsByRange(rentedLogsData, startDate, endDate);
      const { rows: companies } = companyRows(rentedLogsData, startDate, endDate);
      const { rows: drivers } = driverRows(rentedLogsData, startDate, endDate);
      const utilisation = utilisationGrid(
        periodLogs, startDate, endDate,
        (l) => l.vehicleId?.vehicleNumber, (l) => l.vehicleId?.vehicleNumber, 24,
      );
      generateAnalyticsPDF({
        periodLabel: periodLbl,
        dateRangeStr: rangeLabel(startDate, endDate),
        summary, companies, drivers, utilisation, chartImage,
      });
    } catch (e) {
      console.error('Analytics PDF failed', e);
      alert('Could not generate the PDF. Check the console.');
    } finally {
      setExporting(false);
    }
  }, [summary, rcTrend, rentedLogsData, startDate, endDate, periodLbl]);

  const isLoading = (loadingWb && !weighbridgeData) || (loadingRented && !rentedLogsData) || loadingMat;
  if (isLoading) {
    return <Box sx={{ py: 12, display: 'flex', justifyContent: 'center' }}><CircularProgress size={28} /></Box>;
  }

  const a = summary || {};
  const revByMaterial = topNplusOther((a.materialRevenue || []).map((m) => ({ name: m.name, value: m.revenue })), 'value', 8);
  const costByMaterial = topNplusOther((a.materialCost || []).map((m) => ({ name: m.name, value: m.cost })), 'value', 8);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: '1840px', mx: 'auto', pb: 10 }}>
      <PageHeader
        icon={InsightsIcon}
        title="Analytics"
        subtitle="Revenue vs cost from material production and rented machinery"
        actions={(
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} alignItems={{ lg: 'center' }}>
            <PeriodPicker value={pd} onChange={setPd} />
            <Button
              variant="outlined"
              startIcon={exporting ? <CircularProgress size={16} /> : <PictureAsPdfIcon />}
              onClick={handleExportPdf}
              disabled={exporting || !summary}
            >
              Export PDF
            </Button>
          </Stack>
        )}
      />

      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard label="Revenue (weighbridge)" value={fmtCurrency(a.revenue)} delta={pctDelta(a.revenue, a.prevRevenue)} trend={rcTrend.map((d) => d.revenue)} trendColor={REVENUE} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            label="Cost (rented machinery)" value={fmtCurrency(a.cost)}
            delta={pctDelta(a.cost, a.prevCost) && { ...pctDelta(a.cost, a.prevCost), goodWhenUp: false }}
            trend={rcTrend.map((d) => d.cost)} trendColor={COST}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            label="Net profit"
            value={`${a.profit < 0 ? '−' : ''}${fmtCurrency(Math.abs(a.profit || 0))}`}
            accent={a.profit >= 0 ? 'success.main' : 'error.main'}
            delta={pctDelta(a.profit, a.prevProfit)}
            trend={rcTrend.map((d) => d.profit)}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            label="Cost per tonne" value={fmtCurrency(a.costPerTonne)}
            sub={`${(a.tonnes || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })} t · ${(a.margin || 0).toFixed(0)}% margin`}
          />
        </Grid>
      </Grid>

      {!isDayView && (
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
                    { key: 'revenue', name: 'Revenue', color: REVENUE },
                    { key: 'cost', name: 'Cost', color: COST },
                  ]}
                />
              )}
          </ChartCard>
        </Box>
      )}

      <Grid container spacing={3} alignItems="flex-start">
        <Grid item xs={12} lg={6}>
          <ChartWithTable
            title="Revenue by material"
            chart={revByMaterial.length === 0
              ? <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>No revenue in this period.</Box>
              : <HBarChart data={revByMaterial} valueKey="value" valueFormatter={fmtCompactCurrency} color={REVENUE} labelWidth={120} />}
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
                  name: m.name, weight: `${(m.weight / 1000).toFixed(2)} t`, trips: m.trips, revenue: fmtCurrency(m.revenue),
                }))}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} lg={6}>
          <ChartWithTable
            title="Rented cost by material"
            chart={costByMaterial.length === 0
              ? <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>No rented cost in this period.</Box>
              : <HBarChart data={costByMaterial} valueKey="value" valueFormatter={fmtCompactCurrency} color={COST} labelWidth={120} />}
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
                  name: m.name, hours: `${m.hours.toFixed(1)} h`, cost: fmtCurrency(m.cost),
                }))}
              />
            )}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 6 }} />
      <CompanyBreakdown logs={rentedLogsData || []} parties={parties} startDate={startDate} endDate={endDate} compact={isDayView} />

      <Divider sx={{ my: 6 }} />
      <DriverPerformance logs={rentedLogsData || []} startDate={startDate} endDate={endDate} compact={isDayView} />

      {/* Off-screen light chart for the PDF snapshot */}
      <Box aria-hidden sx={{ position: 'fixed', left: '-10000px', top: 0, width: 880, bgcolor: '#fff', p: 1 }} ref={pdfChartRef}>
        <PdfChart data={rcTrend} />
      </Box>
    </Box>
  );
}
