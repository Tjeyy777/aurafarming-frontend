// Lightweight period helpers for the analytics period selector.
// (pdfGenerator.js has its own daily/weekly/monthly variant for the ops report;
//  this one uses day/week/month and stays free of the jsPDF import.)

export const toISODate = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

export const getDateRange = (period, anchorDate) => {
  const base = anchorDate ? new Date(anchorDate) : new Date();
  const d0 = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  let start;
  let end;

  switch (period) {
    case 'day':
      start = new Date(d0);
      end = new Date(d0);
      break;
    case 'week': {
      const dow = d0.getDay();
      const diff = dow === 0 ? 6 : dow - 1; // Monday start
      start = new Date(d0);
      start.setDate(start.getDate() - diff);
      end = new Date(start);
      end.setDate(end.getDate() + 6);
      break;
    }
    case 'month':
    default:
      start = new Date(base.getFullYear(), base.getMonth(), 1);
      end = new Date(base.getFullYear(), base.getMonth() + 1, 0);
  }
  return { start, end };
};

export const shiftAnchor = (period, anchorDate, dir) => {
  const d = new Date(anchorDate);
  if (period === 'day') d.setDate(d.getDate() + dir);
  else if (period === 'week') d.setDate(d.getDate() + dir * 7);
  else d.setMonth(d.getMonth() + dir);
  return d;
};

const fmt = (d, opts) => new Date(d).toLocaleDateString('en-IN', opts);

export const periodLabel = (period, anchorDate) => {
  const { start, end } = getDateRange(period, anchorDate);
  if (period === 'day') return fmt(start, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  if (period === 'month') return fmt(start, { month: 'long', year: 'numeric' });
  return `${fmt(start, { day: '2-digit', month: 'short' })} – ${fmt(end, { day: '2-digit', month: 'short', year: 'numeric' })}`;
};

export const rangeLabel = (startDate, endDate) =>
  `${fmt(startDate, { day: '2-digit', month: 'short', year: 'numeric' })} – ${fmt(endDate, { day: '2-digit', month: 'short', year: 'numeric' })}`;

// Is the anchor's period the current one (disable "next")?
export const isCurrentPeriod = (period, anchorDate) => {
  const { start } = getDateRange(period, anchorDate);
  const { start: nowStart } = getDateRange(period, new Date());
  return start.getTime() === nowStart.getTime();
};
