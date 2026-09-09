import React, { useMemo, useState } from 'react';
import { Box, Grid, MenuItem, TextField, Typography, Stack } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import PageHeader from '../common/PageHeader';
import {
  StatCard, ChartCard, ChartWithTable, EmptyState,
  HBarChart, TrendChart, ShareBar, Heatmap, MiniTable,
} from './DashboardKit';
import {
  calcEntryCost, filterLogsByRange, buildTrend, topNplusOther,
  weekColumns, bucketKeyOf, fmtCurrency, fmtCompactCurrency, fmtNumber, fmtHours,
} from './dashboardUtils';

const ALL = '__ALL__';
const UNASSIGNED = '__UNASSIGNED__';
const REVENUE = '#2A78D6';

export default function CompanyBreakdown({ logs, parties = [], startDate, endDate }) {
  const [selected, setSelected] = useState(ALL);

  const periodLogs = useMemo(
    () => filterLogsByRange(logs, startDate, endDate),
    [logs, startDate, endDate],
  );
  const hasUnassigned = useMemo(() => periodLogs.some((l) => !l.companyId), [periodLogs]);

  const perCompany = useMemo(() => {
    const map = new Map();
    periodLogs.forEach((l) => {
      const id = l.companyId?._id || UNASSIGNED;
      const name = l.companyId?.name || 'Unassigned';
      if (!map.has(id)) map.set(id, { id, name, cost: 0, hours: 0, trips: 0, entries: 0 });
      const row = map.get(id);
      row.cost += calcEntryCost(l);
      row.hours += Number(l.totalHours || 0);
      if (l.isTrip) row.trips += 1; else row.entries += 1;
    });
    return [...map.values()].sort((a, b) => b.cost - a.cost);
  }, [periodLogs]);

  const grandTotalCost = useMemo(() => perCompany.reduce((s, c) => s + c.cost, 0), [perCompany]);

  const selectedLogs = useMemo(() => {
    if (selected === ALL) return periodLogs;
    if (selected === UNASSIGNED) return periodLogs.filter((l) => !l.companyId);
    return periodLogs.filter((l) => l.companyId?._id === selected);
  }, [periodLogs, selected]);

  const stats = useMemo(() => {
    const main = selectedLogs.filter((l) => !l.isTrip);
    const trips = selectedLogs.filter((l) => l.isTrip);
    const totalCost = selectedLogs.reduce((s, l) => s + calcEntryCost(l), 0);
    const ourHours = main.reduce((s, l) => s + Number(l.totalHours || 0), 0);
    const tripHours = trips.reduce((s, l) => s + Number(l.totalHours || 0), 0);
    const vehicles = new Set(selectedLogs.map((l) => l.vehicleId?._id).filter(Boolean));
    const drivers = new Set(selectedLogs.map((l) => (l.driverName || '').trim().toLowerCase()).filter(Boolean));
    const totalHours = ourHours + tripHours;
    return {
      totalCost, ourHours, tripHours,
      trips: trips.length, entries: main.length,
      vehicles: vehicles.size, drivers: drivers.size,
      effRate: totalHours > 0 ? totalCost / totalHours : 0,
      share: grandTotalCost > 0 ? (totalCost / grandTotalCost) * 100 : 0,
    };
  }, [selectedLogs, grandTotalCost]);

  const byVehicle = useMemo(() => {
    const map = new Map();
    selectedLogs.forEach((l) => {
      const key = l.vehicleId?.vehicleNumber || 'Unknown';
      if (!map.has(key)) {
        map.set(key, {
          vehicle: key, type: l.vehicleId?.vehicleType || '—', owner: l.vehicleId?.ownerName || '—',
          hours: 0, cost: 0, trips: 0,
        });
      }
      const row = map.get(key);
      row.hours += Number(l.totalHours || 0);
      row.cost += calcEntryCost(l);
      if (l.isTrip) row.trips += 1;
    });
    return [...map.values()].sort((a, b) => b.cost - a.cost);
  }, [selectedLogs]);

  const byType = useMemo(() => {
    const map = new Map();
    selectedLogs.forEach((l) => {
      const key = l.vehicleId?.vehicleType || 'Unspecified';
      map.set(key, (map.get(key) || 0) + calcEntryCost(l));
    });
    return [...map.entries()]
      .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [selectedLogs]);

  const byMaterial = useMemo(() => {
    const map = new Map();
    selectedLogs.forEach((l) => {
      const key = l.materialId?.name || 'Unspecified';
      map.set(key, (map.get(key) || 0) + calcEntryCost(l));
    });
    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [selectedLogs]);

  const trend = useMemo(() => buildTrend(selectedLogs, startDate, endDate), [selectedLogs, startDate, endDate]);

  // Vehicle × week utilisation heatmap
  const heat = useMemo(() => {
    const cols = weekColumns(startDate, endDate);
    const vehicleRows = byVehicle.slice(0, 16).map((v) => ({ key: v.vehicle, label: v.vehicle }));
    const map = new Map();
    selectedLogs.forEach((l) => {
      const vk = l.vehicleId?.vehicleNumber;
      if (!vk) return;
      const wk = bucketKeyOf(l.date, 'week');
      const k = `${vk}|${wk}`;
      map.set(k, (map.get(k) || 0) + Number(l.totalHours || 0));
    });
    return { cols, rows: vehicleRows, get: (r, c) => map.get(`${r.key}|${c.weekKey}`) || 0 };
  }, [selectedLogs, byVehicle, startDate, endDate]);

  const selectedName = selected === ALL
    ? 'All companies'
    : selected === UNASSIGNED ? 'Unassigned'
      : parties.find((p) => p._id === selected)?.name || 'Company';

  const vehicleChartData = useMemo(
    () => topNplusOther(byVehicle.map((v) => ({ name: v.vehicle, value: v.cost })), 'value', 10),
    [byVehicle],
  );
  const materialChartData = useMemo(() => topNplusOther(byMaterial, 'value', 8), [byMaterial]);
  const companyChartData = useMemo(() => topNplusOther(perCompany.map((c) => ({ name: c.name, value: c.cost, __other: c.__other })), 'value', 12), [perCompany]);
  const costSpark = trend.map((d) => d.cost);

  return (
    <Box>
      <PageHeader
        icon={BusinessIcon}
        title="Company breakdown"
        subtitle="Rented machinery cost, hours and usage per owner company"
        actions={(
          <TextField
            select size="small" label="Company"
            value={selected} onChange={(e) => setSelected(e.target.value)}
            sx={{ minWidth: 240 }}
          >
            <MenuItem value={ALL}>All companies</MenuItem>
            {parties.map((p) => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
            {hasUnassigned && <MenuItem value={UNASSIGNED}>Unassigned</MenuItem>}
          </TextField>
        )}
      />

      {periodLogs.length === 0 ? (
        <EmptyState title="No rented machinery activity" description="Nothing was logged in this period." dense />
      ) : (
        <Stack spacing={3}>
          <Grid container spacing={2.5}>
            <Grid item xs={6} md={4} lg={2}>
              <StatCard label={`${selectedName} — cost`} value={fmtCurrency(stats.totalCost)} sub={`${stats.share.toFixed(1)}% of rented spend`} trend={costSpark} trendColor={REVENUE} />
            </Grid>
            <Grid item xs={6} md={4} lg={2}>
              <StatCard label="Work hours" value={fmtNumber(stats.ourHours)} sub={`+ ${fmtNumber(stats.tripHours)} trip hrs`} />
            </Grid>
            <Grid item xs={6} md={4} lg={2}>
              <StatCard label="Entries / trips" value={`${stats.entries} / ${stats.trips}`} />
            </Grid>
            <Grid item xs={6} md={4} lg={2}>
              <StatCard label="Effective rate" value={`${fmtCurrency(stats.effRate)}/hr`} accent="success.main" />
            </Grid>
            <Grid item xs={6} md={4} lg={2}>
              <StatCard label="Vehicles used" value={stats.vehicles} />
            </Grid>
            <Grid item xs={6} md={4} lg={2}>
              <StatCard label="Drivers" value={stats.drivers} />
            </Grid>
          </Grid>

          {selected === ALL && companyChartData.length > 1 && (
            <ChartCard title="Share of rented spend by company">
              <ShareBar data={companyChartData} valueKey="value" valueFormatter={fmtCurrency} />
            </ChartCard>
          )}

          <Grid container spacing={3} alignItems="flex-start">
            {selected === ALL && (
              <Grid item xs={12} lg={6}>
                <ChartWithTable
                  title="Cost by company"
                  chart={companyChartData.length === 0
                    ? <EmptyState dense />
                    : <HBarChart data={companyChartData} valueKey="value" valueFormatter={fmtCompactCurrency} colorByIndex labelWidth={150} />}
                  table={(
                    <MiniTable
                      minWidth={360}
                      columns={[
                        { key: 'name', label: 'Company', bold: true },
                        { key: 'hours', label: 'Hours', align: 'right', mono: true, render: (r) => fmtNumber(r.hours) },
                        { key: 'cost', label: 'Cost', align: 'right', mono: true, bold: true, color: 'success.main', render: (r) => fmtCurrency(r.cost) },
                      ]}
                      rows={perCompany}
                    />
                  )}
                />
              </Grid>
            )}

            <Grid item xs={12} lg={selected === ALL ? 6 : 12}>
              <ChartWithTable
                title="Cost by vehicle"
                subtitle={byVehicle.length > 10 ? `Top 10 of ${byVehicle.length}` : undefined}
                chart={vehicleChartData.length === 0
                  ? <EmptyState dense />
                  : <HBarChart data={vehicleChartData} valueKey="value" valueFormatter={fmtCompactCurrency} color={REVENUE} labelWidth={130} />}
                table={(
                  <MiniTable
                    minWidth={560}
                    columns={[
                      { key: 'vehicle', label: 'Vehicle', bold: true },
                      { key: 'type', label: 'Type', color: 'text.secondary' },
                      { key: 'owner', label: 'Owner', color: 'text.secondary' },
                      { key: 'hours', label: 'Hours', align: 'right', mono: true, render: (r) => fmtNumber(r.hours) },
                      { key: 'trips', label: 'Trips', align: 'right', mono: true },
                      { key: 'cost', label: 'Cost', align: 'right', mono: true, bold: true, color: 'success.main', render: (r) => fmtCurrency(r.cost) },
                    ]}
                    rows={byVehicle}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} lg={6}>
              <ChartCard title="Cost by material">
                {materialChartData.length === 0
                  ? <EmptyState dense />
                  : <HBarChart data={materialChartData} valueKey="value" valueFormatter={fmtCompactCurrency} colorByIndex labelWidth={130} />}
              </ChartCard>
            </Grid>

            <Grid item xs={12} lg={6}>
              <ChartCard title="Cost by vehicle type">
                {byType.length === 0
                  ? <EmptyState dense />
                  : <HBarChart data={byType} valueKey="value" valueFormatter={fmtCompactCurrency} colorByIndex labelWidth={110} />}
              </ChartCard>
            </Grid>

            <Grid item xs={12}>
              <ChartCard title={`Cost trend — ${selectedName}`} height={300}>
                {trend.length === 0
                  ? <EmptyState dense />
                  : (
                    <TrendChart
                      data={trend}
                      valueFormatter={fmtCompactCurrency}
                      series={[{ key: 'cost', name: 'Cost', color: REVENUE }]}
                    />
                  )}
              </ChartCard>
            </Grid>

            <Grid item xs={12}>
              <ChartCard title="Vehicle utilisation" subtitle="Hours worked per vehicle, per week">
                {heat.rows.length === 0 || heat.cols.length === 0
                  ? <EmptyState dense />
                  : <Heatmap rows={heat.rows} cols={heat.cols} getValue={heat.get} valueFormatter={fmtHours} />}
              </ChartCard>
            </Grid>
          </Grid>
        </Stack>
      )}
    </Box>
  );
}
