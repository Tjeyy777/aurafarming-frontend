// Shared helpers for the analytics dashboard sections (Company Breakdown,
// Driver Performance). All aggregation is done client-side from the rented
// machinery logs, same pattern as ProfitDashboard.

export const CHART_COLORS = [
  '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#a855f7',
];

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
