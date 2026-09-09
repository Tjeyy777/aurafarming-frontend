import React, { useMemo, useState } from 'react';
import { Box, Grid, MenuItem, TextField, Stack } from '@mui/material';
import EngineeringIcon from '@mui/icons-material/Engineering';
import PageHeader from '../common/PageHeader';
import {
  StatCard, ChartCard, ChartWithTable, EmptyState,
  HBarChart, StackedHBarChart, TrendChart, Heatmap, MiniTable,
} from './DashboardKit';
import {
  calcEntryCost, filterLogsByRange, buildTrend, topNplusOther,
  weekColumns, bucketKeyOf, normalizeDriver, driverKey,
  fmtCurrency, fmtNumber, fmtHours,
} from './dashboardUtils';

const HOURS = '#EB6834';

export default function DriverPerformance({ logs, startDate, endDate, compact = false }) {
  const [selected, setSelected] = useState('');

  const periodLogs = useMemo(
    () => filterLogsByRange(logs, startDate, endDate).filter((l) => normalizeDriver(l.driverName)),
    [logs, startDate, endDate],
  );

  const drivers = useMemo(() => {
    const map = new Map();
    periodLogs.forEach((l) => {
      const key = driverKey(l.driverName);
      if (!map.has(key)) {
        map.set(key, {
          key, name: normalizeDriver(l.driverName),
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

  const selectedDriver = useMemo(() => drivers.find((d) => d.key === selected) || null, [drivers, selected]);
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
      map.set(key, (map.get(key) || 0) + Number(l.totalHours || 0));
    });
    return [...map.entries()].map(([name, value]) => ({ name, value })).filter((r) => r.value > 0).sort((a, b) => b.value - a.value);
  }, [driverLogs]);

  const byMaterial = useMemo(() => {
    const map = new Map();
    driverLogs.forEach((l) => {
      const key = l.materialId?.name || 'Unspecified';
      map.set(key, (map.get(key) || 0) + Number(l.totalHours || 0));
    });
    return [...map.entries()].map(([name, value]) => ({ name, value })).filter((r) => r.value > 0).sort((a, b) => b.value - a.value);
  }, [driverLogs]);

  const trend = useMemo(() => buildTrend(driverLogs, startDate, endDate), [driverLogs, startDate, endDate]);

  const topByHours = useMemo(
    () => topNplusOther(drivers.map((d) => ({ name: d.name, value: d.hours, __other: d.__other })), 'value', 12),
    [drivers],
  );
  const workTripData = useMemo(
    () => drivers.slice(0, 12).map((d) => ({ name: d.name, work: d.workHours, trip: d.tripHours })),
    [drivers],
  );
  const vehicleChartData = useMemo(() => topNplusOther(byVehicle.map((v) => ({ name: v.name, value: v.hours })), 'value', 10), [byVehicle]);
  const companyChartData = useMemo(() => topNplusOther(byCompany, 'value', 8), [byCompany]);
  const materialChartData = useMemo(() => topNplusOther(byMaterial, 'value', 8), [byMaterial]);

  // Driver × week utilisation heatmap
  const heat = useMemo(() => {
    const cols = weekColumns(startDate, endDate);
    const rows = drivers.slice(0, 16).map((d) => ({ key: d.key, label: d.name }));
    const map = new Map();
    periodLogs.forEach((l) => {
      const dk = driverKey(l.driverName);
      const wk = bucketKeyOf(l.date, 'week');
      map.set(`${dk}|${wk}`, (map.get(`${dk}|${wk}`) || 0) + Number(l.totalHours || 0));
    });
    return { cols, rows, get: (r, c) => map.get(`${r.key}|${c.weekKey}`) || 0 };
  }, [periodLogs, drivers, startDate, endDate]);

  return (
    <Box>
      <PageHeader
        icon={EngineeringIcon}
        title="Driver performance"
        subtitle="Hours, trips and output per driver across rented machinery logs"
        actions={(
          <TextField
            select size="small" label="Driver"
            value={selected} onChange={(e) => setSelected(e.target.value)}
            sx={{ minWidth: 240 }} disabled={drivers.length === 0}
          >
            <MenuItem value="">— Select a driver —</MenuItem>
            {drivers.map((d) => <MenuItem key={d.key} value={d.key}>{d.name}</MenuItem>)}
          </TextField>
        )}
      />

      {drivers.length === 0 ? (
        <EmptyState title="No driver activity" description="No rented machinery logs name a driver in this period." dense />
      ) : (
        <Stack spacing={3}>
          <Grid container spacing={3} alignItems="flex-start">
            <Grid item xs={12} lg={6}>
              <ChartWithTable
                title="Top drivers by hours"
                chart={<HBarChart data={topByHours} valueKey="value" valueFormatter={fmtHours} color={HOURS} labelWidth={130} />}
                table={(
                  <MiniTable
                    minWidth={560}
                    columns={[
                      { key: 'name', label: 'Driver', bold: true },
                      { key: 'hours', label: 'Hours', align: 'right', mono: true, render: (r) => fmtNumber(r.hours) },
                      { key: 'trips', label: 'Trips', align: 'right', mono: true },
                      { key: 'daysCount', label: 'Days', align: 'right', mono: true },
                      { key: 'vehiclesCount', label: 'Vehicles', align: 'right', mono: true },
                      { key: 'cost', label: 'Cost gen.', align: 'right', mono: true, bold: true, color: 'success.main', render: (r) => fmtCurrency(r.cost) },
                    ]}
                    rows={drivers.map((d) => ({
                      ...d, id: d.key, selected: d.key === selected,
                      onClick: () => setSelected(d.key === selected ? '' : d.key),
                    }))}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} lg={6}>
              <ChartCard title="Work vs trip hours" subtitle="How much of each driver's time is non-productive trips">
                {workTripData.length === 0
                  ? <EmptyState dense />
                  : (
                    <StackedHBarChart
                      data={workTripData}
                      valueFormatter={fmtHours}
                      labelWidth={130}
                      segments={[
                        { key: 'work', name: 'Work', color: HOURS },
                        { key: 'trip', name: 'Trips', color: '#EDA100' },
                      ]}
                    />
                  )}
              </ChartCard>
            </Grid>
            {!compact && (
              <Grid item xs={12}>
                <ChartCard title="Driver utilisation" subtitle="Hours worked per driver, per week">
                  {heat.rows.length === 0 || heat.cols.length === 0
                    ? <EmptyState dense />
                    : <Heatmap rows={heat.rows} cols={heat.cols} getValue={heat.get} valueFormatter={fmtHours} />}
                </ChartCard>
              </Grid>
            )}
          </Grid>

          {selectedDriver && (
            <>
              <Grid container spacing={2.5}>
                <Grid item xs={6} md={4} lg={2}>
                  <StatCard label={`${selectedDriver.name} — hours`} value={fmtNumber(selectedDriver.hours)} accent={HOURS} sub={`${fmtNumber(selectedDriver.workHours)} work + ${fmtNumber(selectedDriver.tripHours)} trip`} trend={trend.map((d) => d.hours)} trendColor={HOURS} />
                </Grid>
                <Grid item xs={6} md={4} lg={2}>
                  <StatCard label="Trips" value={selectedDriver.trips} sub={`${selectedDriver.entries} work entries`} />
                </Grid>
                <Grid item xs={6} md={4} lg={2}>
                  <StatCard label="Days worked" value={selectedDriver.daysCount} sub={`${fmtNumber(selectedDriver.avgPerDay)} hrs/day avg`} />
                </Grid>
                <Grid item xs={6} md={4} lg={2}>
                  <StatCard label="Cost generated" value={fmtCurrency(selectedDriver.cost)} accent="success.main" />
                </Grid>
                <Grid item xs={6} md={4} lg={2}>
                  <StatCard label="Vehicles driven" value={selectedDriver.vehiclesCount} />
                </Grid>
                <Grid item xs={6} md={4} lg={2}>
                  <StatCard label="Companies worked for" value={selectedDriver.companiesCount} />
                </Grid>
              </Grid>

              <Grid container spacing={3} alignItems="flex-start">
                <Grid item xs={12} lg={6}>
                  <ChartCard title="Hours by vehicle" subtitle={byVehicle.length > 10 ? `Top 10 of ${byVehicle.length}` : undefined}>
                    {vehicleChartData.length === 0 ? <EmptyState dense /> : <HBarChart data={vehicleChartData} valueKey="value" valueFormatter={fmtHours} color={HOURS} labelWidth={120} />}
                  </ChartCard>
                </Grid>
                <Grid item xs={12} lg={6}>
                  <ChartCard title="Hours by company">
                    {companyChartData.length === 0 ? <EmptyState dense /> : <HBarChart data={companyChartData} valueKey="value" valueFormatter={fmtHours} colorByIndex labelWidth={130} />}
                  </ChartCard>
                </Grid>
                {!compact && (
                  <Grid item xs={12} lg={materialChartData.length > 0 ? 6 : 12}>
                    <ChartCard title={`Activity trend — ${selectedDriver.name}`} height={300}>
                      {trend.length === 0
                        ? <EmptyState dense />
                        : <TrendChart data={trend} valueFormatter={fmtHours} series={[{ key: 'hours', name: 'Hours', color: HOURS }]} />}
                    </ChartCard>
                  </Grid>
                )}
                {materialChartData.length > 0 && (
                  <Grid item xs={12} lg={6}>
                    <ChartCard title="Hours by material">
                      <HBarChart data={materialChartData} valueKey="value" valueFormatter={fmtHours} color="#4A3AA7" labelWidth={130} />
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
