// Pure analytics aggregation — one source of truth for the dashboard screens
// and the PDF report. No React, no rendering. Everything takes ISO date strings.

import {
  calcEntryCost, filterLogsByRange, buildTrend, bucketKeyOf, weekColumns,
  normalizeDriver, driverKey,
} from './dashboardUtils';

const inRange = (d, s, e) => d >= s && d <= e;

// ── Profit summary (weighbridge revenue vs rented cost) ─────────────────────
export function profitSummary(weighbridge, rentedLogs, startDate, endDate) {
  const start = new Date(startDate); start.setHours(0, 0, 0, 0);
  const end = new Date(endDate); end.setHours(23, 59, 59, 999);
  const spanMs = end - start;
  const prevStart = new Date(start.getTime() - spanMs - 1);
  const prevEnd = new Date(start.getTime() - 1);

  let revenue = 0; let cost = 0; let tonnes = 0;
  let prevRevenue = 0; let prevCost = 0;
  const matRev = new Map();
  const matCost = new Map();

  (weighbridge || []).forEach((e) => {
    if (e.status !== 'completed' || !e.netWeight || !e.materialRate) return;
    const d = new Date(e.entryTime || e.exitTime || e.createdAt);
    const rev = (e.netWeight / 1000) * e.materialRate;
    if (inRange(d, start, end)) {
      revenue += rev;
      tonnes += e.netWeight / 1000;
      const m = e.materialId?.name || 'Unspecified';
      const row = matRev.get(m) || { name: m, revenue: 0, trips: 0, weight: 0 };
      row.revenue += rev; row.trips += 1; row.weight += e.netWeight;
      matRev.set(m, row);
    } else if (inRange(d, prevStart, prevEnd)) {
      prevRevenue += rev;
    }
  });

  (rentedLogs || []).forEach((l) => {
    if (l.isTrip) return;
    const d = new Date(l.date);
    const c = Number(l.cost || 0);
    if (inRange(d, start, end)) {
      cost += c;
      const m = l.materialId?.name || 'Unspecified';
      const row = matCost.get(m) || { name: m, cost: 0, hours: 0 };
      row.cost += c; row.hours += Number(l.totalHours || 0);
      matCost.set(m, row);
    } else if (inRange(d, prevStart, prevEnd)) {
      prevCost += c;
    }
  });

  return {
    revenue, cost, tonnes,
    profit: revenue - cost,
    margin: revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0,
    costPerTonne: tonnes > 0 ? cost / tonnes : 0,
    prevRevenue, prevCost, prevProfit: prevRevenue - prevCost,
    materialRevenue: [...matRev.values()].sort((a, b) => b.revenue - a.revenue),
    materialCost: [...matCost.values()].sort((a, b) => b.cost - a.cost),
  };
}

// ── Company breakdown ──────────────────────────────────────────────────────
export function companyRows(rentedLogs, startDate, endDate) {
  const periodLogs = filterLogsByRange(rentedLogs, startDate, endDate);
  const map = new Map();
  periodLogs.forEach((l) => {
    const id = l.companyId?._id || '__UNASSIGNED__';
    const name = l.companyId?.name || 'Unassigned';
    const row = map.get(id) || {
      id, name, cost: 0, hours: 0, workHours: 0, tripHours: 0, trips: 0, entries: 0,
      vehicles: new Set(), drivers: new Set(),
    };
    const h = Number(l.totalHours || 0);
    row.cost += calcEntryCost(l);
    row.hours += h;
    if (l.isTrip) { row.tripHours += h; row.trips += 1; } else { row.workHours += h; row.entries += 1; }
    if (l.vehicleId?._id) row.vehicles.add(l.vehicleId._id);
    const dn = (l.driverName || '').trim().toLowerCase();
    if (dn) row.drivers.add(dn);
    map.set(id, row);
  });
  const rows = [...map.values()].map((r) => ({
    ...r,
    vehicles: r.vehicles.size,
    drivers: r.drivers.size,
  })).sort((a, b) => b.cost - a.cost);
  const grandTotalCost = rows.reduce((s, r) => s + r.cost, 0);
  rows.forEach((r) => { r.share = grandTotalCost > 0 ? (r.cost / grandTotalCost) * 100 : 0; });
  return { rows, grandTotalCost, periodLogs };
}

export function companyDetail(logsForCompany, startDate, endDate) {
  const byVehMap = new Map();
  const byTypeMap = new Map();
  const byMatMap = new Map();
  logsForCompany.forEach((l) => {
    const vk = l.vehicleId?.vehicleNumber || 'Unknown';
    const v = byVehMap.get(vk) || {
      vehicle: vk, type: l.vehicleId?.vehicleType || '—', owner: l.vehicleId?.ownerName || '—',
      hours: 0, cost: 0, trips: 0,
    };
    v.hours += Number(l.totalHours || 0);
    v.cost += calcEntryCost(l);
    if (l.isTrip) v.trips += 1;
    byVehMap.set(vk, v);

    const tk = l.vehicleId?.vehicleType || 'Unspecified';
    byTypeMap.set(tk, (byTypeMap.get(tk) || 0) + calcEntryCost(l));

    const mk = l.materialId?.name || 'Unspecified';
    byMatMap.set(mk, (byMatMap.get(mk) || 0) + calcEntryCost(l));
  });
  return {
    byVehicle: [...byVehMap.values()].sort((a, b) => b.cost - a.cost),
    byType: [...byTypeMap.entries()]
      .map(([k, v]) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: v }))
      .filter((r) => r.value > 0).sort((a, b) => b.value - a.value),
    byMaterial: [...byMatMap.entries()]
      .map(([k, v]) => ({ name: k, value: v }))
      .filter((r) => r.value > 0).sort((a, b) => b.value - a.value),
    trend: buildTrend(logsForCompany, startDate, endDate),
  };
}

// ── Driver stats ───────────────────────────────────────────────────────────
export function driverRows(rentedLogs, startDate, endDate) {
  const periodLogs = filterLogsByRange(rentedLogs, startDate, endDate)
    .filter((l) => normalizeDriver(l.driverName));
  const map = new Map();
  periodLogs.forEach((l) => {
    const key = driverKey(l.driverName);
    const d = map.get(key) || {
      key, name: normalizeDriver(l.driverName),
      hours: 0, workHours: 0, tripHours: 0, trips: 0, entries: 0, cost: 0,
      days: new Set(), vehicles: new Set(), companies: new Set(),
    };
    const h = Number(l.totalHours || 0);
    d.hours += h;
    if (l.isTrip) { d.tripHours += h; d.trips += 1; } else { d.workHours += h; d.entries += 1; }
    d.cost += calcEntryCost(l);
    if (l.date) d.days.add(new Date(l.date).toISOString().split('T')[0]);
    if (l.vehicleId?._id) d.vehicles.add(l.vehicleId._id);
    if (l.companyId?._id) d.companies.add(l.companyId._id);
    map.set(key, d);
  });
  const rows = [...map.values()].map((d) => ({
    ...d,
    daysCount: d.days.size,
    vehiclesCount: d.vehicles.size,
    companiesCount: d.companies.size,
    avgPerDay: d.days.size > 0 ? d.hours / d.days.size : 0,
  })).sort((a, b) => b.hours - a.hours);
  return { rows, periodLogs };
}

// ── Utilisation grid (rows × week → hours) ──────────────────────────────────
export function utilisationGrid(periodLogs, startDate, endDate, keyOf, labelOf, limit = 40) {
  const cols = weekColumns(startDate, endDate);
  const rowMap = new Map();
  const cell = new Map();
  periodLogs.forEach((l) => {
    const rk = keyOf(l);
    if (!rk) return;
    if (!rowMap.has(rk)) rowMap.set(rk, { key: rk, label: labelOf(l), hours: 0 });
    const wk = bucketKeyOf(l.date, 'week');
    const ck = `${rk}|${wk}`;
    const h = Number(l.totalHours || 0);
    cell.set(ck, (cell.get(ck) || 0) + h);
    rowMap.get(rk).hours += h;
  });
  const rows = [...rowMap.values()].sort((a, b) => b.hours - a.hours).slice(0, limit);
  return { cols, rows, get: (r, c) => cell.get(`${r.key}|${c.weekKey}`) || 0 };
}
