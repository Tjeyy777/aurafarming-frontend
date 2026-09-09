// Shared helpers for the analytics dashboard sections (Company Breakdown,
// Driver Performance). All aggregation is done client-side from the rented
// machinery logs, same pattern as ProfitDashboard.

import { CHART_SERIES } from '../../theme';

// Categorical palette for the analytics charts — sourced from the design system.
export const CHART_COLORS = CHART_SERIES;

export const fmtCurrency = (val) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(val || 0);

export const fmtCompactCurrency = (val) => {
  const n = Number(val || 0);
  if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`;
  if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(2)}L`;
  if (Math.abs(n) >= 1e3) return `₹${(n / 1e3).toFixed(1)}k`;
  return `₹${n.toFixed(0)}`;
};

export const fmtHours = (val) =>
  `${Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 1 })} h`;

export const fmtNumber = (val, digits = 1) =>
  Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: digits });

// Cost of a single rented log, recomputed from hours × hourly rate so that
// trip entries (saved with cost = 0 by the backend) still contribute their
// billable hours — the same convention the Rented Machinery PDF uses.
export const calcEntryCost = (log) => {
  const rate = Number(log?.hourlyRate ?? log?.vehicleId?.hourlyRate ?? 0);
  return Number(log?.totalHours || 0) * rate;
};

export const normalizeDriver = (name) => (name || '').trim().replace(/\s+/g, ' ');
export const driverKey = (name) => normalizeDriver(name).toLowerCase();

// Inclusive [start, end] day-boundary filter on log.date.
export const filterLogsByRange = (logs, startDate, endDate) => {
  const start = new Date(startDate); start.setHours(0, 0, 0, 0);
  const end = new Date(endDate); end.setHours(23, 59, 59, 999);
  return (logs || []).filter((l) => {
    const d = new Date(l.date);
    return d >= start && d <= end;
  });
};

// Pick a time bucket from the width of the selected range.
export const pickBucket = (startDate, endDate) => {
  const days = (new Date(endDate) - new Date(startDate)) / 86400000;
  if (days > 92) return 'month';
  if (days > 31) return 'week';
  return 'day';
};

const startOfWeek = (d) => {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday start
  x.setDate(x.getDate() - diff);
  x.setHours(0, 0, 0, 0);
  return x;
};

export const bucketKeyOf = (dateStr, bucket) => {
  const d = new Date(dateStr);
  if (bucket === 'month') {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  if (bucket === 'week') {
    const s = startOfWeek(d);
    return `${s.getFullYear()}-${String(s.getMonth() + 1).padStart(2, '0')}-${String(s.getDate()).padStart(2, '0')}`;
  }
  return d.toISOString().split('T')[0];
};

export const bucketLabelOf = (key, bucket) => {
  if (bucket === 'month') {
    const [y, m] = key.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
  }
  const d = new Date(key);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

// Keep the top `n` rows by `valueKey`; fold the rest into a single "Other" row
// so a chart never has to render 20+ categories. `rows` must be pre-sorted desc.
export const topNplusOther = (rows, valueKey, n = 8, labelKey = 'name') => {
  if (!rows || rows.length <= n + 1) return rows || [];
  const head = rows.slice(0, n);
  const tail = rows.slice(n);
  const other = { [labelKey]: `Other (${tail.length})`, __other: true };
  tail.forEach((r) => {
    Object.keys(r).forEach((k) => {
      if (typeof r[k] === 'number') other[k] = (other[k] || 0) + r[k];
    });
  });
  return [...head, other];
};

// Cost / hours / trips per time bucket, sorted chronologically.
export const buildTrend = (logs, startDate, endDate) => {
  const bucket = pickBucket(startDate, endDate);
  const map = new Map();
  (logs || []).forEach((l) => {
    const key = bucketKeyOf(l.date, bucket);
    if (!map.has(key)) map.set(key, { key, cost: 0, hours: 0, trips: 0 });
    const row = map.get(key);
    row.cost += calcEntryCost(l);
    row.hours += Number(l.totalHours || 0);
    if (l.isTrip) row.trips += 1;
  });
  return [...map.values()]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((r) => ({ ...r, label: bucketLabelOf(r.key, bucket) }));
};

// Revenue (weighbridge) vs cost (rented) per time bucket, on one ₹ axis.
export const buildRevenueCostTrend = (weighbridge, rentedLogs, startDate, endDate) => {
  const bucket = pickBucket(startDate, endDate);
  const start = new Date(startDate); start.setHours(0, 0, 0, 0);
  const end = new Date(endDate); end.setHours(23, 59, 59, 999);
  const map = new Map();
  const touch = (key) => {
    if (!map.has(key)) map.set(key, { key, revenue: 0, cost: 0 });
    return map.get(key);
  };

  (weighbridge || []).forEach((e) => {
    if (e.status !== 'completed' || !e.netWeight || !e.materialRate) return;
    const d = new Date(e.entryTime || e.exitTime || e.createdAt);
    if (d < start || d > end) return;
    touch(bucketKeyOf(d, bucket)).revenue += (e.netWeight / 1000) * e.materialRate;
  });
  (rentedLogs || []).forEach((l) => {
    if (l.isTrip) return;
    const d = new Date(l.date);
    if (d < start || d > end) return;
    touch(bucketKeyOf(l.date, bucket)).cost += calcEntryCost(l);
  });

  return [...map.values()]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((r) => ({ ...r, profit: r.revenue - r.cost, label: bucketLabelOf(r.key, bucket) }));
};

// Series of ISO-week buckets spanning [startDate, endDate] for heatmap columns.
export const weekColumns = (startDate, endDate) => {
  const cur = startOfWeek(startDate);
  const end = new Date(endDate);
  const cols = [];
  let guard = 0;
  while (cur <= end && guard < 80) {
    const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
    cols.push({
      key,
      label: cur.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      short: `${cur.getDate()}/${cur.getMonth() + 1}`,
      weekKey: key,
    });
    cur.setDate(cur.getDate() + 7);
    guard += 1;
  }
  return cols;
};

// Map of `${rowKey}|${weekKey}` -> summed hours, for heatmap lookups.
export const hoursByRowWeek = (logs, rowKeyOf) => {
  const map = new Map();
  (logs || []).forEach((l) => {
    const rk = rowKeyOf(l);
    if (!rk) return;
    const wk = bucketKeyOf(l.date, 'week');
    const k = `${rk}|${wk}`;
    map.set(k, (map.get(k) || 0) + Number(l.totalHours || 0));
  });
  return map;
};

// 12-bucket sparkline series (numbers) for a stat tile, from any log list.
export const sparkSeries = (logs, startDate, endDate, valueOf) => {
  const trend = buildTrend(logs, startDate, endDate);
  const vals = trend.map(valueOf);
  return vals.length > 24 ? vals.slice(-24) : vals;
};
