import React, { useMemo, useState } from 'react';
import { Box, Grid, MenuItem, TextField, Typography, Stack, useTheme } from '@mui/material';
import EngineeringIcon from '@mui/icons-material/Engineering';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import PageHeader from '../common/PageHeader';
import { StatCard, ChartCard, ChartTooltip, EmptyState, HBarChart, MiniTable } from './DashboardKit';
import {
  CHART_COLORS, calcEntryCost, filterLogsByRange, buildTrend, topNplusOther,
  normalizeDriver, driverKey, fmtCurrency, fmtNumber, fmtHours,
} from './dashboardUtils';

export default function DriverPerformance({ logs, startDate, endDate }) {
  const theme = useTheme();
  const axis = theme.palette.text.secondary;
  const gridStroke = theme.palette.divider;
  const [selected, setSelected] = useState('');

  const periodLogs = useMemo(
    () => filterLogsByRange(logs, startDate, endDate).filter((l) => normalizeDriver(l.driverName)),
    [logs, startDate, endDate],
  );

  // One row per distinct (normalised) driver name.
  const drivers = useMemo(() => {
    const map = new Map();
    periodLogs.forEach((l) => {
      const key = driverKey(l.driverName);
      if (!map.has(key)) {
        map.set(key, {
          key,
          name: normalizeDriver(l.driverName),
          hours: 0, workHours: 0, tripHours: 0, trips: 0, entries: 0, cost: 0,
          days: new Set(), vehicles: new Set(), companies: new Set(),
        });
      }
      const d = map.get(key);
      const h = Number(l.totalHours || 0);
      d.hours += h;
      if (l.isTrip) { d.tripHours += h; d.trips += 1; } else { d.workHours += h; d.entries += 1; }
      d.cost += calcEntryCost(l);
      if (l.date) d.days.add(new Date(l.date).toISOString().split('T')[0]);
      if (l.vehicleId?._id) d.vehicles.add(l.vehicleId._id);
      if (l.companyId?._id) d.companies.add(l.companyId._id);
    });
    return [...map.values()]
      .map((d) => ({
        ...d,
        daysCount: d.days.size,
        vehiclesCount: d.vehicles.size,
        companiesCount: d.companies.size,
        avgPerDay: d.days.size > 0 ? d.hours / d.days.size : 0,
      }))
      .sort((a, b) => b.hours - a.hours);
  }, [periodLogs]);

  const selectedDriver = useMemo(
    () => drivers.find((d) => d.key === selected) || null,
    [drivers, selected],
  );

  const driverLogs = useMemo(
    () => (selectedDriver ? periodLogs.filter((l) => driverKey(l.driverName) === selectedDriver.key) : []),
    [periodLogs, selectedDriver],
  );

  const byVehicle = useMemo(() => {
    const map = new Map();
    driverLogs.forEach((l) => {
      const key = l.vehicleId?.vehicleNumber || 'Unknown';
      if (!map.has(key)) map.set(key, { name: key, hours: 0, cost: 0, trips: 0 });
      const row = map.get(key);
      row.hours += Number(l.totalHours || 0);
      row.cost += calcEntryCost(l);
      if (l.isTrip) row.trips += 1;
    });
    return [...map.values()].sort((a, b) => b.hours - a.hours);
  }, [driverLogs]);

  const byCompany = useMemo(() => {
    const map = new Map();
    driverLogs.forEach((l) => {
      const key = l.companyId?.name || 'Unassigned';
      if (!map.has(key)) map.set(key, { name: key, value: 0 });
      map.get(key).value += Number(l.totalHours || 0);
    });
    return [...map.values()].filter((r) => r.value > 0).sort((a, b) => b.value - a.value);
  }, [driverLogs]);

  const byMaterial = useMemo(() => {
    const map = new Map();
    driverLogs.forEach((l) => {
      const key = l.materialId?.name || 'Unspecified';
      if (!map.has(key)) map.set(key, { name: key, value: 0 });
      map.get(key).value += Number(l.totalHours || 0);
    });
    return [...map.values()].filter((r) => r.value > 0).sort((a, b) => b.value - a.value);
  }, [driverLogs]);

  const trend = useMemo(
    () => buildTrend(driverLogs, startDate, endDate),
    [driverLogs, startDate, endDate],
  );

  const topByHours = useMemo(
    () => topNplusOther(drivers.map((d) => ({ name: d.name, hours: d.hours })), 'hours', 12),
    [drivers],
  );
  const vehicleChartData = useMemo(() => topNplusOther(byVehicle, 'hours', 10), [byVehicle]);
  const companyChartData = useMemo(() => topNplusOther(byCompany, 'value', 8), [byCompany]);
  const materialChartData = useMemo(() => topNplusOther(byMaterial, 'value', 8), [byMaterial]);

  return (
    <Box>
      <PageHeader
        icon={EngineeringIcon}
        title="Driver performance"
        subtitle="Hours, trips and output per driver across rented machinery logs"
        actions={(
          <TextField
            select
            size="small"
            label="Driver"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            sx={{ minWidth: 240 }}
            disabled={drivers.length === 0}
          >
            <MenuItem value="">— Select a driver —</MenuItem>
            {drivers.map((d) => (
              <MenuItem key={d.key} value={d.key}>{d.name}</MenuItem>
            ))}
          </TextField>
        )}
      />

      {drivers.length === 0 ? (
        <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 6 }}>
          No driver activity in this period.
        </Typography>
      ) : (
        <Stack spacing={3}>
          <Grid container spacing={3} alignItems="flex-start">
            <Grid item xs={12} lg={6}>
              <ChartCard title="Top drivers by hours">
                <HBarChart
                  data={topByHours}
                  labelKey="name"
                  valueKey="hours"
                  valueFormatter={fmtHours}
                  colorByIndex
                  labelWidth={130}
                />
              </ChartCard>
            </Grid>
            <Grid item xs={12} lg={6}>
              <MiniTable
                minWidth={560}
                columns={[
                  { key: 'name', label: 'Driver', bold: true },
                  { key: 'hours', label: 'Hours', align: 'right', mono: true, render: (r) => fmtNumber(r.hours) },
                  { key: 'trips', label: 'Trips', align: 'right', mono: true },
                  { key: 'daysCount', label: 'Days', align: 'right', mono: true },
                  { key: 'vehiclesCount', label: 'Vehicles', align: 'right', mono: true },
                  { key: 'cost', label: 'Cost Gen.', align: 'right', bold: true, mono: true, color: 'success.main', render: (r) => fmtCurrency(r.cost) },
                ]}
                rows={drivers.map((d) => ({
                  ...d,
                  id: d.key,
                  selected: d.key === selected,
                  onClick: () => setSelected(d.key === selected ? '' : d.key),
                }))}
              />
            </Grid>
          </Grid>

          {selectedDriver && (
            <>
              <Grid container spacing={2.5}>
                <Grid item xs={6} md={4} lg={2}>
                  <StatCard label={`${selectedDriver.name} — Hours`} value={fmtNumber(selectedDriver.hours)} accent={CHART_COLORS[1]} sub={`${fmtNumber(selectedDriver.workHours)} work + ${fmtNumber(selectedDriver.tripHours)} trip`} />
                </Grid>
                <Grid item xs={6} md={4} lg={2}>
                  <StatCard label="Trips" value={selectedDriver.trips} sub={`${selectedDriver.entries} work entries`} />
                </Grid>
                <Grid item xs={6} md={4} lg={2}>
                  <StatCard label="Days Worked" value={selectedDriver.daysCount} sub={`${fmtNumber(selectedDriver.avgPerDay)} hrs/day avg`} />
                </Grid>
                <Grid item xs={6} md={4} lg={2}>
                  <StatCard label="Cost Generated" value={fmtCurrency(selectedDriver.cost)} accent="success.main" />
                </Grid>
                <Grid item xs={6} md={4} lg={2}>
                  <StatCard label="Vehicles Driven" value={selectedDriver.vehiclesCount} />
                </Grid>
                <Grid item xs={6} md={4} lg={2}>
                  <StatCard label="Companies Worked For" value={selectedDriver.companiesCount} />
                </Grid>
              </Grid>

              <Grid container spacing={3} alignItems="flex-start">
                <Grid item xs={12} lg={6}>
                  <ChartCard title="Hours by vehicle" subtitle={byVehicle.length ? `Top ${Math.min(10, byVehicle.length)} of ${byVehicle.length}` : undefined}>
                    {vehicleChartData.length === 0
                      ? <EmptyState dense />
                      : (
                        <HBarChart
                          data={vehicleChartData}
                          labelKey="name"
                          valueKey="hours"
                          valueFormatter={fmtHours}
                          color={CHART_COLORS[1]}
                          labelWidth={120}
                        />
                      )}
                  </ChartCard>
                </Grid>
                <Grid item xs={12} lg={6}>
                  <ChartCard title="Hours by company">
                    {companyChartData.length === 0
                      ? <EmptyState dense />
                      : (
                        <HBarChart
                          data={companyChartData}
                          labelKey="name"
                          valueKey="value"
                          valueFormatter={fmtHours}
                          colorByIndex
                          labelWidth={130}
                        />
                      )}
                  </ChartCard>
                </Grid>
                <Grid item xs={12} lg={materialChartData.length > 0 ? 6 : 12}>
                  <ChartCard title={`Activity trend — ${selectedDriver.name}`} height={320}>
                    {trend.length === 0 ? <EmptyState dense /> : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trend} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
                          <defs>
                            <linearGradient id="dpHoursFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_COLORS[1]} stopOpacity={0.28} />
                              <stop offset="95%" stopColor={CHART_COLORS[1]} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                          <XAxis dataKey="label" tick={{ fill: axis, fontSize: 12 }} minTickGap={24} />
                          <YAxis tick={{ fill: axis, fontSize: 12 }} width={48} />
                          <Tooltip content={<ChartTooltip valueFormatter={(v) => fmtHours(v)} />} />
                          <Area type="monotone" dataKey="hours" name="Hours" stroke={CHART_COLORS[1]} fill="url(#dpHoursFill)" strokeWidth={2} dot={trend.length > 24 ? false : { r: 2 }} activeDot={{ r: 4 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </ChartCard>
                </Grid>
                {materialChartData.length > 0 && (
                  <Grid item xs={12} lg={6}>
                    <ChartCard title="Hours by material">
                      <HBarChart
                        data={materialChartData}
                        labelKey="name"
                        valueKey="value"
                        valueFormatter={fmtHours}
                        color={CHART_COLORS[3]}
                        labelWidth={130}
                      />
                    </ChartCard>
                  </Grid>
                )}
              </Grid>
            </>
          )}
        </Stack>
      )}
    </Box>
  );
}
