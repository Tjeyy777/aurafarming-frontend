import React, { useMemo, useState } from 'react';
import { Box, Grid, MenuItem, TextField, Typography, Stack, useTheme } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import PageHeader from '../common/PageHeader';
import { StatCard, ChartCard, ChartTooltip, EmptyState, HBarChart, MiniTable } from './DashboardKit';
import {
  CHART_COLORS, calcEntryCost, filterLogsByRange, buildTrend, topNplusOther,
  fmtCurrency, fmtCompactCurrency, fmtNumber, fmtHours,
} from './dashboardUtils';

const ALL = '__ALL__';
const UNASSIGNED = '__UNASSIGNED__';

export default function CompanyBreakdown({ logs, parties = [], startDate, endDate }) {
  const theme = useTheme();
  const axis = theme.palette.text.secondary;
  const gridStroke = theme.palette.divider;
  const [selected, setSelected] = useState(ALL);

  const periodLogs = useMemo(
    () => filterLogsByRange(logs, startDate, endDate),
    [logs, startDate, endDate],
  );

  const hasUnassigned = useMemo(() => periodLogs.some((l) => !l.companyId), [periodLogs]);

  // Per-company aggregate (drives the "All companies" overview + share math).
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

  const grandTotalCost = useMemo(
    () => perCompany.reduce((s, c) => s + c.cost, 0),
    [perCompany],
  );

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
    const drivers = new Set(
      selectedLogs.map((l) => (l.driverName || '').trim().toLowerCase()).filter(Boolean),
    );
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
          vehicle: key,
          type: l.vehicleId?.vehicleType || '—',
          owner: l.vehicleId?.ownerName || '—',
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

  const byMaterial = useMemo(() => {
    const map = new Map();
    selectedLogs.forEach((l) => {
      const key = l.materialId?.name || 'Unspecified';
      if (!map.has(key)) map.set(key, { name: key, value: 0, hours: 0 });
      const row = map.get(key);
      row.value += calcEntryCost(l);
      row.hours += Number(l.totalHours || 0);
    });
    return [...map.values()].filter((r) => r.value > 0).sort((a, b) => b.value - a.value);
  }, [selectedLogs]);

  const trend = useMemo(
    () => buildTrend(selectedLogs, startDate, endDate),
    [selectedLogs, startDate, endDate],
  );

  const selectedName = selected === ALL
    ? 'All Companies'
    : selected === UNASSIGNED
      ? 'Unassigned'
      : parties.find((p) => p._id === selected)?.name || 'Company';

  const vehicleChartData = useMemo(
    () => topNplusOther(byVehicle.map((v) => ({ name: v.vehicle, cost: v.cost })), 'cost', 10),
    [byVehicle],
  );
  const materialChartData = useMemo(() => topNplusOther(byMaterial, 'value', 8), [byMaterial]);
  const companyChartData = useMemo(() => topNplusOther(perCompany, 'cost', 12), [perCompany]);

  return (
    <Box>
      <PageHeader
        icon={BusinessIcon}
        title="Company breakdown"
        subtitle="Rented machinery cost, hours and usage per owner company"
        actions={(
          <TextField
            select
            size="small"
            label="Company"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            sx={{ minWidth: 240 }}
          >
            <MenuItem value={ALL}>All Companies</MenuItem>
            {parties.map((p) => (
              <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
            ))}
            {hasUnassigned && <MenuItem value={UNASSIGNED}>Unassigned</MenuItem>}
          </TextField>
        )}
      />

      {periodLogs.length === 0 ? (
        <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 6 }}>
          No rented machinery activity in this period.
        </Typography>
      ) : (
        <Stack spacing={3}>
          <Grid container spacing={2.5}>
            <Grid item xs={6} md={4} lg={2}>
              <StatCard
                label={`${selectedName} — Cost`}
                value={fmtCurrency(stats.totalCost)}
                accent={CHART_COLORS[0]}
                sub={`${stats.share.toFixed(1)}% of all rented spend`}
              />
            </Grid>
            <Grid item xs={6} md={4} lg={2}>
              <StatCard label="Work Hours" value={fmtNumber(stats.ourHours)} sub={`+ ${fmtNumber(stats.tripHours)} trip hrs`} />
            </Grid>
            <Grid item xs={6} md={4} lg={2}>
              <StatCard label="Entries / Trips" value={`${stats.entries} / ${stats.trips}`} />
            </Grid>
            <Grid item xs={6} md={4} lg={2}>
              <StatCard label="Effective Rate" value={`${fmtCurrency(stats.effRate)}/hr`} accent="success.main" />
            </Grid>
            <Grid item xs={6} md={4} lg={2}>
              <StatCard label="Vehicles Used" value={stats.vehicles} />
            </Grid>
            <Grid item xs={6} md={4} lg={2}>
              <StatCard label="Drivers" value={stats.drivers} />
            </Grid>
          </Grid>

          <Grid container spacing={3} alignItems="flex-start">
            {selected === ALL && (
              <Grid item xs={12} lg={6}>
                <ChartCard title="Cost by company">
                  {companyChartData.length === 0
                    ? <EmptyState dense />
                    : (
                      <HBarChart
                        data={companyChartData}
                        labelKey="name"
                        valueKey="cost"
                        valueFormatter={fmtCompactCurrency}
                        colorByIndex
                        labelWidth={150}
                      />
                    )}
                </ChartCard>
              </Grid>
            )}

            <Grid item xs={12} lg={selected === ALL ? 6 : 12}>
              <ChartCard title="Cost by vehicle" subtitle={vehicleChartData.length ? `Top ${Math.min(10, byVehicle.length)} of ${byVehicle.length}` : undefined}>
                {vehicleChartData.length === 0
                  ? <EmptyState dense />
                  : (
                    <HBarChart
                      data={vehicleChartData}
                      labelKey="name"
                      valueKey="cost"
                      valueFormatter={fmtCompactCurrency}
                      color={CHART_COLORS[0]}
                      labelWidth={130}
                    />
                  )}
              </ChartCard>
            </Grid>

            <Grid item xs={12} lg={6}>
              <ChartCard title="Cost by material">
                {materialChartData.length === 0
                  ? <EmptyState dense />
                  : (
                    <HBarChart
                      data={materialChartData}
                      labelKey="name"
                      valueKey="value"
                      valueFormatter={fmtCompactCurrency}
                      colorByIndex
                      labelWidth={130}
                    />
                  )}
              </ChartCard>
            </Grid>

            <Grid item xs={12} lg={6}>
              <ChartCard title={`Cost trend — ${selectedName}`} height={320}>
                {trend.length === 0 ? <EmptyState dense /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trend} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
                      <defs>
                        <linearGradient id="cbCostFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.28} />
                          <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: axis, fontSize: 12 }} minTickGap={24} />
                      <YAxis tick={{ fill: axis, fontSize: 12 }} tickFormatter={fmtCompactCurrency} width={56} />
                      <Tooltip content={<ChartTooltip valueFormatter={(v, k) => (k === 'cost' ? fmtCurrency(v) : fmtHours(v))} />} />
                      <Area type="monotone" dataKey="cost" name="Cost" stroke={CHART_COLORS[0]} fill="url(#cbCostFill)" strokeWidth={2} dot={trend.length > 24 ? false : { r: 2 }} activeDot={{ r: 4 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            </Grid>
          </Grid>

          <MiniTable
            minWidth={640}
            columns={[
              { key: 'vehicle', label: 'Vehicle', bold: true },
              { key: 'type', label: 'Type', color: 'text.secondary' },
              { key: 'owner', label: 'Owner', color: 'text.secondary' },
              { key: 'hours', label: 'Hours', align: 'right', mono: true, render: (r) => fmtNumber(r.hours) },
              { key: 'trips', label: 'Trips', align: 'right', mono: true },
              { key: 'cost', label: 'Cost', align: 'right', bold: true, mono: true, color: 'success.main', render: (r) => fmtCurrency(r.cost) },
            ]}
            rows={byVehicle}
            emptyText="No vehicle activity for this company."
          />
        </Stack>
      )}
    </Box>
  );
}
