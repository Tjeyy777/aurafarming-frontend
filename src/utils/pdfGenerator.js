// src/utils/pdfGenerator.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Color Palette ───────────────────────────────────────────────────────────
const COLORS = {
  primary: [249, 115, 22],     // Orange
  primaryDark: [234, 88, 12],
  dark: [15, 23, 42],
  text: [30, 41, 59],
  textLight: [100, 116, 139],
  white: [255, 255, 255],
  bg: [248, 250, 252],
  border: [226, 232, 240],
  success: [34, 197, 94],
  warning: [245, 158, 11],
  headerBg: [241, 245, 249],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
// NOTE: jsPDF's built-in "helvetica" font has no glyph for ₹, which is why it
// was rendering as a broken "¹" character. Standard fonts can't show ₹ unless
// you embed a Unicode font (adds ~200KB+ to your bundle as base64). Using
// "Rs." is the safe, zero-dependency fix. If you'd rather have the real ₹
// glyph, say so and I'll wire up an embedded font instead.
const INR = (val) => `Rs. ${Number(val || 0).toLocaleString("en-IN")}`;
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const fmtDateTime = (d) => d ? new Date(d).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) : "—";
const fmtHours = (val) => Number(Number(val || 0).toFixed(3));

// Cost for a single log entry, computed fresh from hours × hourly rate.
// This is used everywhere cost totals are shown (cards + tables) instead of
// trusting the stored `cost` field, because trip entries were being saved
// with cost = 0 even though they consumed billable hours on the vehicle.
const calcEntryCost = (l) => Number(l.totalHours || 0) * Number(l.hourlyRate || 0);

// ─── Get date range based on period and custom date ──────────────────────────
export const getDateRange = (period, customDate) => {
  const base = customDate ? new Date(customDate) : new Date();
  const startOfDay = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  let start, end;

  switch (period) {
    case "daily":
      start = new Date(startOfDay);
      end = new Date(startOfDay);
      end.setHours(23, 59, 59, 999);
      break;
    case "weekly": {
      // Get the Monday of the week containing the base date
      const dayOfWeek = startOfDay.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0
      start = new Date(startOfDay);
      start.setDate(start.getDate() - diff);
      end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "monthly":
      start = new Date(base.getFullYear(), base.getMonth(), 1);
      end = new Date(base.getFullYear(), base.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    default:
      start = new Date(startOfDay);
      end = new Date(startOfDay);
      end.setHours(23, 59, 59, 999);
  }
  return { start, end };
};

// ─── Filter array by date range ──────────────────────────────────────────────
export const filterByDateRange = (arr, start, end, dateField = "createdAt") => {
  return (arr || []).filter((item) => {
    const d = new Date(item[dateField] || item.date || item.createdAt);
    return d >= start && d <= end;
  });
};

// ─── Draw the cover / header section ─────────────────────────────────────────
function drawHeader(doc, periodLabel, dateRangeStr) {
  const pageW = doc.internal.pageSize.getWidth();

  // Top accent bar
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageW, 4, "F");

  // Company branding
  doc.setFillColor(...COLORS.dark);
  doc.rect(0, 4, pageW, 36, "F");

  doc.setTextColor(...COLORS.white);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Aura Farming Solutions Pvt. Ltd.", 14, 22);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 200, 200);
  doc.text(`${periodLabel} Summary Report`, 14, 30);
  doc.text(dateRangeStr, 14, 36);

  // Generated on
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, pageW - 14, 30, { align: "right" });

  // Bottom accent line
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 40, pageW, 1.5, "F");

  return 48; // next Y position
}

// ─── Draw a section title ────────────────────────────────────────────────────
function drawSectionTitle(doc, title, y, subLabel) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Check if we need a new page
  if (y > pageH - 40) {
    doc.addPage();
    y = 14;
  }

  // Accent bar
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(14, y, 3, 10, 1.5, 1.5, "F");

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.dark);
  doc.text(title, 21, y + 7);

  if (subLabel) {
    const titleW = doc.getTextWidth(title);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.textLight);
    doc.text(`(${subLabel})`, 21 + titleW + 4, y + 7);
  }

  // Divider
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(14, y + 13, pageW - 14, y + 13);

  return y + 18;
}

// ─── Draw summary cards (auto-fits font size, wraps to multiple rows) ────────
function drawSummaryCards(doc, cards, y) {
  if (!cards || cards.length === 0) return y;

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const gap = 3;
  const availableW = pageW - margin * 2;
  const minCardW = 34;
  const maxCardW = 52;
  const cardH = 18;

  // How many cards fit per row without going below the minimum readable width
  let perRow = Math.floor((availableW + gap) / (minCardW + gap));
  perRow = Math.max(1, Math.min(perRow, cards.length));
  const cardW = Math.min(maxCardW, (availableW - (perRow - 1) * gap) / perRow);

  const rows = Math.ceil(cards.length / perRow);
  const neededH = rows * cardH + (rows - 1) * gap;

  if (y + neededH > pageH - 20) {
    doc.addPage();
    y = 14;
  }

  cards.forEach((card, i) => {
    const rowIdx = Math.floor(i / perRow);
    const colIdx = i % perRow;
    const x = margin + colIdx * (cardW + gap);
    const cy = y + rowIdx * (cardH + gap);

    // Card background
    doc.setFillColor(...COLORS.bg);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, cy, cardW, cardH, 2, 2, "FD");

    // Label — shrink to fit on one line, truncate with ellipsis if still too long
    let labelFontSize = 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(labelFontSize);
    let label = card.label.toUpperCase();
    const maxLabelW = cardW - 6;
    while (labelFontSize > 4.5 && doc.getTextWidth(label) > maxLabelW) {
      labelFontSize -= 0.5;
      doc.setFontSize(labelFontSize);
    }
    while (doc.getTextWidth(label) > maxLabelW && label.length > 3) {
      label = label.slice(0, -1);
    }
    if (label !== card.label.toUpperCase() && doc.getTextWidth(label + "…") <= maxLabelW) {
      label += "…";
    }
    doc.setTextColor(...COLORS.textLight);
    doc.text(label, x + 3, cy + 6);

    // Value — auto-fit font size so amounts never wrap to a second line
    let valueFontSize = 10;
    const valueStr = String(card.value);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(valueFontSize);
    const maxValueW = cardW - 6;
    while (valueFontSize > 6 && doc.getTextWidth(valueStr) > maxValueW) {
      valueFontSize -= 0.5;
      doc.setFontSize(valueFontSize);
    }
    doc.setTextColor(...COLORS.dark);
    doc.text(valueStr, x + 3, cy + 14);
  });

  return y + rows * cardH + (rows - 1) * gap + 6;
}

// ─── Draw a table using autoTable ────────────────────────────────────────────
function drawTable(doc, head, body, y, opts = {}) {
  const pageH = doc.internal.pageSize.getHeight();

  if (y > pageH - 30) {
    doc.addPage();
    y = 14;
  }

  const fontSize = opts.fontSize || 7;

  autoTable(doc, {
    startY: y,
    head: [head],
    body: body,
    margin: { left: 10, right: 10 },
    tableWidth: "auto",
    styles: {
      fontSize,
      cellPadding: 2.5,
      textColor: COLORS.text,
      lineColor: COLORS.border,
      lineWidth: 0.2,
      overflow: "linebreak",
      valign: "middle",
    },
    headStyles: {
      fillColor: COLORS.dark,
      textColor: COLORS.white,
      fontStyle: "bold",
      fontSize: Math.max(fontSize, 6.5),
      halign: "left",
      cellPadding: 2.5,
    },
    columnStyles: opts.columnStyles || {},
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didDrawPage: (data) => {
      // Draw top accent bar on new pages
      if (data.pageNumber > 1) {
        doc.setFillColor(...COLORS.primary);
        doc.rect(0, 0, doc.internal.pageSize.getWidth(), 2, "F");
      }
    },
  });

  return doc.lastAutoTable.finalY + 8;
}

// ─── Draw "no data" message ──────────────────────────────────────────────────
function drawNoData(doc, y, message = "No records found for this period.") {
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...COLORS.textLight);
  doc.text(message, 18, y);
  return y + 10;
}

// ─── Draw page footer ───────────────────────────────────────────────────────
function drawFooters(doc) {
  const totalPages = doc.internal.getNumberOfPages();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Footer line
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(14, pageH - 14, pageW - 14, pageH - 14);

    // Footer text
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.textLight);
    doc.text("Aura Farming Solutions Pvt. Ltd. — Auto-Generated Report", 14, pageH - 9);
    doc.text(`Page ${i} of ${totalPages}`, pageW - 14, pageH - 9, { align: "right" });

    // Bottom accent
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, pageH - 3, pageW, 3, "F");
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PDF GENERATOR
// ═════════════════════════════════════════════════════════════════════════════
export function generateQuarryPDF({
  period,
  customDate,
  employees = [],
  explosiveItems = [],
  consumableItems = [],
  expenses = [],
  dieselEntries = [],
  machines = [],
  weighbridgeEntries = [],
  attendanceRecords = [],
  rentedLogs = [],
}) {
  const { start, end } = getDateRange(period, customDate);
  const periodLabel =
    period === "daily" ? "Daily" : period === "weekly" ? "Weekly" : "Monthly";
  const dateRangeStr = `${fmtDate(start)} — ${fmtDate(end)}`;

  // Filter time-based data
  const filteredExpenses = filterByDateRange(expenses, start, end, "date");
  const filteredDiesel = filterByDateRange(dieselEntries, start, end, "date");
  const filteredWeighbridge = filterByDateRange(weighbridgeEntries, start, end, "entryTime");
  const filteredAttendance = filterByDateRange(attendanceRecords, start, end, "date");
  const filteredRentedLogs = filterByDateRange(rentedLogs, start, end, "date");

  // Computations
  const totalExplosiveValue = explosiveItems.reduce((s, i) => s + (i.currentStock || 0) * (i.unitCost || 0), 0);
  const totalConsumableValue = consumableItems.reduce((s, i) => s + (i.currentStock || 0) * (i.unitCost || 0), 0);
  const totalExpenseAmount = filteredExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const totalDieselCost = filteredDiesel.reduce((s, e) => s + Number(e.totalCost || 0), 0);
  const totalDieselLitres = filteredDiesel.reduce((s, e) => s + Number(e.litres || 0), 0);
  const totalWeighbridgeNetWeight = filteredWeighbridge.reduce((s, e) => s + Number(e.netWeight || 0), 0);
  const completedTrips = filteredWeighbridge.filter((e) => e.status === "completed").length;

  // PDF Setup
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = drawHeader(doc, periodLabel, dateRangeStr);

  // ═════════════════════════════════════════════════════════════════════════
  // 1. OVERVIEW SUMMARY
  // ═════════════════════════════════════════════════════════════════════════
  y = drawSectionTitle(doc, "Overview Summary", y);
  y = drawSummaryCards(doc, [
    { label: "Total Employees", value: employees.length },
    { label: "Period Expenses", value: INR(totalExpenseAmount) },
    { label: "Diesel Cost", value: INR(totalDieselCost) },
    { label: "Weighbridge Trips", value: completedTrips },
  ], y);

  // ═════════════════════════════════════════════════════════════════════════
  // 2. EMPLOYEES
  // ═════════════════════════════════════════════════════════════════════════
  y = drawSectionTitle(doc, `Employees (${employees.length} total)`, y);
  if (employees.length > 0) {
    const activeEmps = employees.filter((e) => e.isActive);
    const inactiveEmps = employees.filter((e) => !e.isActive);
    y = drawSummaryCards(doc, [
      { label: "Active", value: activeEmps.length },
      { label: "Inactive", value: inactiveEmps.length },
      { label: "Total", value: employees.length },
    ], y);
    y = drawTable(
      doc,
      ["#", "Name", "Role", "Daily Wage", "Phone", "Status"],
      employees.slice(0, 100).map((e, i) => [
        i + 1,
        e.name || "—",
        e.role?.title || e.subRole?.title || "—",
        INR(e.dailyWage),
        e.phone || "—",
        e.isActive ? "Active" : "Inactive",
      ]),
      y
    );
  } else {
    y = drawNoData(doc, y, "No employee records found.");
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 3. ATTENDANCE
  // ═════════════════════════════════════════════════════════════════════════
  y = drawSectionTitle(doc, `Attendance (${periodLabel})`, y);
  if (filteredAttendance.length > 0) {
    const presentCount = filteredAttendance.filter((a) => a.status === "present").length;
    const absentCount = filteredAttendance.filter((a) => a.status === "absent").length;
    const totalOT = filteredAttendance.reduce((s, a) => s + Number(a.overtimeHour || 0), 0);

    y = drawSummaryCards(doc, [
      { label: "Present", value: presentCount },
      { label: "Absent", value: absentCount },
      { label: "Total Records", value: filteredAttendance.length },
      { label: "OT Hours", value: fmtHours(totalOT) },
    ], y);
    y = drawTable(
      doc,
      ["#", "Date", "Employee", "Status", "OT Hours", "Per Hr Rate"],
      filteredAttendance.slice(0, 200).map((a, i) => [
        i + 1,
        fmtDate(a.date),
        a.employeeId?.name || "—",
        (a.status || "—").toUpperCase(),
        fmtHours(a.overtimeHour),
        INR(a.perHourRate),
      ]),
      y
    );
  } else {
    y = drawNoData(doc, y, "No attendance records for this period.");
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 4. WEIGHBRIDGE
  // ═════════════════════════════════════════════════════════════════════════
  y = drawSectionTitle(doc, `Weighbridge (${periodLabel})`, y);
  if (filteredWeighbridge.length > 0) {
    const uniqueVehicles = new Set(filteredWeighbridge.map(e => e.vehicleNumber)).size;
    const materialSummary = {};
    filteredWeighbridge.forEach(e => {
      if (e.status === "completed") {
        const mat = e.remarks ? e.remarks.trim() : "Other";
        if (!materialSummary[mat]) materialSummary[mat] = { trips: 0, weight: 0 };
        materialSummary[mat].trips += 1;
        materialSummary[mat].weight += Number(e.netWeight || 0);
      }
    });
    const materialCards = Object.keys(materialSummary).map(mat => ({
      label: mat.toUpperCase(),
      value: `${materialSummary[mat].trips} trips, ${materialSummary[mat].weight.toLocaleString("en-IN")} kg`
    }));

    y = drawSummaryCards(doc, [
      { label: "Total Entries", value: filteredWeighbridge.length },
      { label: "Completed", value: completedTrips },
      { label: "Net Weight", value: `${totalWeighbridgeNetWeight.toLocaleString("en-IN")} kg` },
      { label: "Unique Vehicles", value: uniqueVehicles },
      ...materialCards
    ], y);
    y = drawTable(
      doc,
      ["#", "Vehicle", "Driver", "Empty (kg)", "Loaded (kg)", "Net (kg)", "Remarks", "Status", "Entry Time"],
      filteredWeighbridge.slice(0, 200).map((e, i) => [
        i + 1,
        e.vehicleNumber || "—",
        e.driverName || "—",
        e.emptyWeight ?? "—",
        e.loadedWeight ?? "—",
        e.netWeight ?? "—",
        e.remarks || "—",
        (e.status || "—").toUpperCase(),
        fmtDateTime(e.entryTime),
      ]),
      y
    );
  } else {
    y = drawNoData(doc, y, "No weighbridge entries for this period.");
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 5. EXPLOSIVES INVENTORY
  // ═════════════════════════════════════════════════════════════════════════
  y = drawSectionTitle(doc, "Explosives Inventory (Current Stock)", y);
  if (explosiveItems.length > 0) {
    y = drawSummaryCards(doc, [
      { label: "Total Items", value: explosiveItems.length },
      { label: "Inventory Value", value: INR(totalExplosiveValue) },
    ], y);
    y = drawTable(
      doc,
      ["#", "Item Name", "Category", "Current Stock", "Unit", "Unit Cost", "Total Value"],
      explosiveItems.map((item, i) => [
        i + 1,
        item.name || "—",
        item.category || "—",
        item.currentStock ?? 0,
        item.unit || "—",
        INR(item.unitCost),
        INR((item.currentStock || 0) * (item.unitCost || 0)),
      ]),
      y
    );
  } else {
    y = drawNoData(doc, y, "No explosive inventory items found.");
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 6. CONSUMABLES INVENTORY
  // ═════════════════════════════════════════════════════════════════════════
  y = drawSectionTitle(doc, "Consumables Inventory (Current Stock)", y);
  if (consumableItems.length > 0) {
    y = drawSummaryCards(doc, [
      { label: "Total Items", value: consumableItems.length },
      { label: "Inventory Value", value: INR(totalConsumableValue) },
    ], y);
    y = drawTable(
      doc,
      ["#", "Item Name", "Category", "Current Stock", "Unit", "Unit Cost", "Total Value"],
      consumableItems.map((item, i) => [
        i + 1,
        item.name || "—",
        item.category || "—",
        item.currentStock ?? 0,
        item.unit || "—",
        INR(item.unitCost),
        INR((item.currentStock || 0) * (item.unitCost || 0)),
      ]),
      y
    );
  } else {
    y = drawNoData(doc, y, "No consumable inventory items found.");
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 7. MACHINERY
  // ═════════════════════════════════════════════════════════════════════════
  y = drawSectionTitle(doc, `Machinery (${machines.length} registered)`, y);
  if (machines.length > 0) {
    const activeMachines = machines.filter((m) => m.status === "active" || !m.status);
    y = drawSummaryCards(doc, [
      { label: "Total Machines", value: machines.length },
      { label: "Active", value: activeMachines.length },
    ], y);
    y = drawTable(
      doc,
      ["#", "Machine Name", "Type", "Machine Code", "Meter Reading", "Status"],
      machines.map((m, i) => [
        i + 1,
        m.machineName || m.name || "—",
        m.machineType || m.type || "—",
        m.machineCode || "—",
        m.currentMeterReading ?? "—",
        (m.status || "Active").toUpperCase(),
      ]),
      y
    );
  } else {
    y = drawNoData(doc, y, "No machinery registered.");
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 8. DIESEL
  // ═════════════════════════════════════════════════════════════════════════
  y = drawSectionTitle(doc, `Diesel Entries (${periodLabel})`, y);
  if (filteredDiesel.length > 0) {
    y = drawSummaryCards(doc, [
      { label: "Total Litres", value: totalDieselLitres.toLocaleString("en-IN") },
      { label: "Total Cost", value: INR(totalDieselCost) },
      { label: "Entries", value: filteredDiesel.length },
    ], y);
    y = drawTable(
      doc,
      ["#", "Date", "For", "Litres", "Rate/L", "Total Cost"],
      filteredDiesel.map((e, i) => [
        i + 1,
        fmtDate(e.date),
        e.dieselFor === "machine" ? (e.machineId?.machineName || "Machine") : (e.expenseName || "—"),
        e.litres ?? "—",
        INR(e.pricePerLitre),
        INR(e.totalCost),
      ]),
      y
    );
  } else {
    y = drawNoData(doc, y, "No diesel entries for this period.");
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 9. EXPENSES
  // ═════════════════════════════════════════════════════════════════════════
  y = drawSectionTitle(doc, `Expenses (${periodLabel})`, y);
  if (filteredExpenses.length > 0) {
    y = drawSummaryCards(doc, [
      { label: "Total Amount", value: INR(totalExpenseAmount) },
      { label: "Entries", value: filteredExpenses.length },
    ], y);
    y = drawTable(
      doc,
      ["#", "Date", "Expense Name", "Category", "Amount", "Notes"],
      filteredExpenses.map((e, i) => [
        i + 1,
        fmtDate(e.date),
        e.expenseName || "—",
        e.category || "—",
        INR(e.amount),
        e.notes || "—",
      ]),
      y
    );
  } else {
    y = drawNoData(doc, y, "No expense entries for this period.");
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 10. RENTED MACHINERY LOGS
  // ═════════════════════════════════════════════════════════════════════════
  y = drawSectionTitle(doc, `Rented Machinery Logs (${periodLabel})`, y);
  if (filteredRentedLogs.length > 0) {
    const sortedRentedLogs = [...filteredRentedLogs].reverse();
    const mainEntries = sortedRentedLogs.filter((l) => !l.isTrip);
    const tripEntries = sortedRentedLogs.filter((l) => l.isTrip);
    // Cost is recomputed from hours × hourly rate for every entry (main AND
    // trip) rather than trusting the stored `cost` field, so trip hours are
    // no longer silently dropped from the totals.
    const totalRentedCost = sortedRentedLogs.reduce((s, l) => s + calcEntryCost(l), 0);
    const totalHours = mainEntries.reduce((s, l) => s + Number(l.totalHours || 0), 0);
    const totalTripHours = tripEntries.reduce((s, l) => s + Number(l.totalHours || 0), 0);
    y = drawSummaryCards(doc, [
      { label: "Main Entries", value: mainEntries.length },
      { label: "Trips", value: tripEntries.length },
      { label: "Our Hours", value: fmtHours(totalHours) },
      { label: "Trip Hours", value: fmtHours(totalTripHours) },
      { label: "Total Cost", value: INR(totalRentedCost) },
    ], y);
    y = drawTable(
      doc,
      ["#", "Date", "Vehicle", "Type", "Driver", "Opening", "Closing", "Hours", "Rate/Hr", "Cost", "Trip?", "Remarks"],
      sortedRentedLogs.map((l, i) => [
        i + 1,
        fmtDate(l.date),
        l.vehicleId?.vehicleNumber || "—",
        l.vehicleId?.vehicleType || "—",
        l.driverName || "—",
        l.openingMeter ?? "—",
        l.closingMeter ?? "—",
        fmtHours(l.totalHours),
        INR(l.hourlyRate),
        INR(calcEntryCost(l)),
        l.isTrip ? "Yes" : "No",
        l.remarks || l.tripPurpose || "—",
      ]),
      y
    );
  } else {
    y = drawNoData(doc, y, "No rented machinery logs for this period.");
  }

  // ═════════════════════════════════════════════════════════════════════════
  // FOOTER ON ALL PAGES
  // ═════════════════════════════════════════════════════════════════════════
  drawFooters(doc);

  // ═════════════════════════════════════════════════════════════════════════
  // SAVE
  // ═════════════════════════════════════════════════════════════════════════
  const fileName = `QuarryProSuite_${periodLabel}_Report_${fmtDate(start).replace(/\s/g, "_")}.pdf`;
  doc.save(fileName);
}

// ═════════════════════════════════════════════════════════════════════════════
// PER-MODULE PDF GENERATORS
// ═════════════════════════════════════════════════════════════════════════════

function createModulePDF(moduleName, period, customDate, orientation = "portrait") {
  const { start, end } = getDateRange(period, customDate);
  const periodLabel = period === "daily" ? "Daily" : period === "weekly" ? "Weekly" : "Monthly";
  const dateRangeStr = `${fmtDate(start)} — ${fmtDate(end)}`;
  const doc = new jsPDF({ orientation, unit: "mm", format: "a4" });
  let y = drawHeader(doc, `${periodLabel} — ${moduleName}`, dateRangeStr);
  return { doc, y, start, end, periodLabel };
}

function finishModulePDF(doc, moduleName, periodLabel, start) {
  drawFooters(doc);
  doc.save(`${moduleName}_${periodLabel}_Report_${fmtDate(start).replace(/\s/g, "_")}.pdf`);
}

export function generateEmployeesPDF({ employees = [], period, customDate }) {
  const { doc, start, periodLabel } = createModulePDF("Employees", period, customDate);
  let y = 48;
  y = drawSectionTitle(doc, `Employees (${employees.length} total)`, y);
  if (employees.length > 0) {
    y = drawSummaryCards(doc, [
      { label: "Active", value: employees.filter(e => e.isActive).length },
      { label: "Inactive", value: employees.filter(e => !e.isActive).length },
      { label: "Total", value: employees.length },
    ], y);
    y = drawTable(doc, ["#", "Name", "Role", "Sub-Role", "Daily Wage", "Phone", "Status", "Aadhar"],
      employees.map((e, i) => [i + 1, e.name || "—", e.role?.title || "—", e.subRole?.title || "—",
        INR(e.dailyWage), e.phone || "—", e.isActive ? "Active" : "Inactive", e.aadharNumber || "—"]), y);
  } else { y = drawNoData(doc, y); }
  finishModulePDF(doc, "Employees", periodLabel, start);
}

export function generateAttendancePDF({ records = [], period, customDate }) {
  const { doc, start, periodLabel } = createModulePDF("Attendance", period, customDate);
  let y = 48;
  y = drawSectionTitle(doc, `Attendance (${periodLabel})`, y);
  if (records.length > 0) {
    const present = records.filter(a => a.status === "present").length;
    y = drawSummaryCards(doc, [
      { label: "Present", value: present },
      { label: "Absent", value: records.filter(a => a.status === "absent").length },
      { label: "Total", value: records.length },
      { label: "OT Hours", value: fmtHours(records.reduce((s, a) => s + Number(a.overtimeHour || 0), 0)) },
    ], y);
    y = drawTable(doc, ["#", "Date", "Employee", "Status", "OT Hours", "Per Hr Rate"],
      records.map((a, i) => [i + 1, fmtDate(a.date), a.employeeId?.name || "—",
        (a.status || "—").toUpperCase(), fmtHours(a.overtimeHour), INR(a.perHourRate)]), y);
  } else { y = drawNoData(doc, y, "No attendance records for this period."); }
  finishModulePDF(doc, "Attendance", periodLabel, start);
}

export function generateWeighbridgePDF({ entries = [], period, customDate }) {
  const { doc, start, end, periodLabel } = createModulePDF("Weighbridge", period, customDate);
  let y = 48;
  const filtered = filterByDateRange(entries, start, end, "entryTime");
  const totalNet = filtered.reduce((s, e) => s + Number(e.netWeight || 0), 0);
  const completed = filtered.filter(e => e.status === "completed").length;
  y = drawSectionTitle(doc, `Weighbridge (${periodLabel})`, y);
  if (filtered.length > 0) {
    const uniqueVehicles = new Set(filtered.map(e => e.vehicleNumber)).size;
    const materialSummary = {};
    filtered.forEach(e => {
      if (e.status === "completed") {
        const mat = e.remarks ? e.remarks.trim() : "Other";
        if (!materialSummary[mat]) materialSummary[mat] = { trips: 0, weight: 0 };
        materialSummary[mat].trips += 1;
        materialSummary[mat].weight += Number(e.netWeight || 0);
      }
    });
    const materialCards = Object.keys(materialSummary).map(mat => ({
      label: mat.toUpperCase(),
      value: `${materialSummary[mat].trips} trips, ${materialSummary[mat].weight.toLocaleString("en-IN")} kg`
    }));

    y = drawSummaryCards(doc, [
      { label: "Total Entries", value: filtered.length },
      { label: "Completed", value: completed },
      { label: "Net Weight", value: `${totalNet.toLocaleString("en-IN")} kg` },
      { label: "Unique Vehicles", value: uniqueVehicles },
      ...materialCards
    ], y);
    y = drawTable(doc, ["#", "Vehicle", "Driver", "Empty (kg)", "Loaded (kg)", "Net (kg)", "Remarks", "Status", "Entry Time"],
      filtered.map((e, i) => [i + 1, e.vehicleNumber || "—", e.driverName || "—", e.emptyWeight ?? "—",
        e.loadedWeight ?? "—", e.netWeight ?? "—", e.remarks || "—",
        (e.status || "—").toUpperCase(), fmtDateTime(e.entryTime)]), y);
  } else { y = drawNoData(doc, y, "No weighbridge entries for this period."); }
  finishModulePDF(doc, "Weighbridge", periodLabel, start);
}

export function generateExplosivesPDF({ items = [], period, customDate }) {
  const { doc, start, periodLabel } = createModulePDF("Explosives", period, customDate);
  let y = 48;
  const totalValue = items.reduce((s, i) => s + (i.currentStock || 0) * (i.unitCost || 0), 0);
  y = drawSectionTitle(doc, "Explosives Inventory", y);
  if (items.length > 0) {
    y = drawSummaryCards(doc, [
      { label: "Total Items", value: items.length },
      { label: "Inventory Value", value: INR(totalValue) },
    ], y);
    y = drawTable(doc, ["#", "Item", "Category", "Stock", "Unit", "Unit Cost", "Value"],
      items.map((item, i) => [i + 1, item.name || "—", item.category || "—", item.currentStock ?? 0,
        item.unit || "—", INR(item.unitCost), INR((item.currentStock || 0) * (item.unitCost || 0))]), y);
  } else { y = drawNoData(doc, y); }
  finishModulePDF(doc, "Explosives", periodLabel, start);
}

export function generateConsumablesPDF({ items = [], period, customDate }) {
  const { doc, start, periodLabel } = createModulePDF("Consumables", period, customDate);
  let y = 48;
  const totalValue = items.reduce((s, i) => s + (i.currentStock || 0) * (i.unitCost || 0), 0);
  y = drawSectionTitle(doc, "Consumables Inventory", y);
  if (items.length > 0) {
    y = drawSummaryCards(doc, [
      { label: "Total Items", value: items.length },
      { label: "Inventory Value", value: INR(totalValue) },
    ], y);
    y = drawTable(doc, ["#", "Item", "Category", "Stock", "Unit", "Unit Cost", "Value"],
      items.map((item, i) => [i + 1, item.name || "—", item.category || "—", item.currentStock ?? 0,
        item.unit || "—", INR(item.unitCost), INR((item.currentStock || 0) * (item.unitCost || 0))]), y);
  } else { y = drawNoData(doc, y); }
  finishModulePDF(doc, "Consumables", periodLabel, start);
}

export function generateMachineryPDF({ machines = [], period, customDate }) {
  const { doc, start, periodLabel } = createModulePDF("Machinery", period, customDate);
  let y = 48;
  y = drawSectionTitle(doc, `Machinery (${machines.length} registered)`, y);
  if (machines.length > 0) {
    y = drawSummaryCards(doc, [
      { label: "Total", value: machines.length },
      { label: "Active", value: machines.filter(m => m.status === "active" || !m.status).length },
    ], y);
    y = drawTable(doc, ["#", "Machine Name", "Type", "Machine Code", "Meter Reading", "Status"],
      machines.map((m, i) => [i + 1, m.machineName || m.name || "—", m.machineType || m.type || "—",
        m.machineCode || "—", m.currentMeterReading ?? "—", (m.status || "Active").toUpperCase()]), y);
  } else { y = drawNoData(doc, y); }
  finishModulePDF(doc, "Machinery", periodLabel, start);
}

export function generateDieselPDF({ entries = [], period, customDate }) {
  const { doc, start, end, periodLabel } = createModulePDF("Diesel", period, customDate);
  let y = 48;
  const filtered = filterByDateRange(entries, start, end, "date");
  const totalL = filtered.reduce((s, e) => s + Number(e.litres || 0), 0);
  const totalC = filtered.reduce((s, e) => s + Number(e.totalCost || 0), 0);
  y = drawSectionTitle(doc, `Diesel Entries (${periodLabel})`, y);
  if (filtered.length > 0) {
    y = drawSummaryCards(doc, [
      { label: "Total Litres", value: totalL.toLocaleString("en-IN") },
      { label: "Total Cost", value: INR(totalC) },
      { label: "Entries", value: filtered.length },
    ], y);
    y = drawTable(doc, ["#", "Date", "For", "Litres", "Rate/L", "Total Cost"],
      filtered.map((e, i) => [i + 1, fmtDate(e.date),
        e.dieselFor === "machine" ? (e.machineId?.machineName || "Machine") : (e.expenseName || "—"),
        e.litres ?? "—", INR(e.pricePerLitre), INR(e.totalCost)]), y);
  } else { y = drawNoData(doc, y, "No diesel entries for this period."); }
  finishModulePDF(doc, "Diesel", periodLabel, start);
}

export function generateExpensesPDF({ expenses = [], period, customDate }) {
  const { doc, start, end, periodLabel } = createModulePDF("Expenses", period, customDate);
  let y = 48;
  const filtered = filterByDateRange(expenses, start, end, "date");
  const total = filtered.reduce((s, e) => s + Number(e.amount || 0), 0);
  y = drawSectionTitle(doc, `Expenses (${periodLabel})`, y);
  if (filtered.length > 0) {
    y = drawSummaryCards(doc, [
      { label: "Total Amount", value: INR(total) },
      { label: "Entries", value: filtered.length },
    ], y);
    y = drawTable(doc, ["#", "Date", "Expense Name", "Category", "Amount", "Notes"],
      filtered.map((e, i) => [i + 1, fmtDate(e.date), e.expenseName || "—",
        e.category || "—", INR(e.amount), e.notes || "—"]), y);
  } else { y = drawNoData(doc, y, "No expense entries for this period."); }
  finishModulePDF(doc, "Expenses", periodLabel, start);
}

// ═════════════════════════════════════════════════════════════════════════════
// RENTED MACHINERY LOGS — landscape orientation (12+ columns need the room),
// with cost recomputed from hours × hourly rate everywhere it's shown.
// ═════════════════════════════════════════════════════════════════════════════
export function generateRentedLogsPDF({ logs = [], period, customDate, companyName }) {
  const { doc, start, end, periodLabel } = createModulePDF("RentedMachinery", period, customDate, "landscape");
  let y = 44;
  const filtered = filterByDateRange(logs, start, end, "date");
  const sortedLogs = [...filtered].reverse();
  const mainEntries = sortedLogs.filter((l) => !l.isTrip);
  const tripEntries = sortedLogs.filter((l) => l.isTrip);

  // Hours stay split (main vs trip) for the info cards, but cost is summed
  // across ALL entries — a vehicle's trip hours are still billable at its
  // hourly rate, they just weren't being counted before.
  const totalHours = mainEntries.reduce((s, l) => s + Number(l.totalHours || 0), 0);
  const totalTripHours = tripEntries.reduce((s, l) => s + Number(l.totalHours || 0), 0);
  const totalCost = sortedLogs.reduce((s, l) => s + calcEntryCost(l), 0);

  // Per-company total cost = sum, over every vehicle that company used, of
  // (that vehicle's total hours × its hourly rate) — i.e. every entry for
  // that company, main or trip, recomputed the same way.
  const companyCosts = {};
  sortedLogs.forEach(l => {
    const cName = l.companyId?.name || "Unassigned";
    if (!companyCosts[cName]) companyCosts[cName] = 0;
    companyCosts[cName] += calcEntryCost(l);
  });

  const costCards = Object.keys(companyCosts).map(cName => ({
    label: cName,
    value: INR(companyCosts[cName])
  }));

  y = drawSectionTitle(doc, companyName ? `Report for ${companyName}` : "Rented Machinery Logs", y, periodLabel);

  if (sortedLogs.length > 0) {
    y = drawSummaryCards(doc, [
      { label: "Main Entries", value: mainEntries.length },
      { label: "Trips", value: tripEntries.length },
      { label: "Our Hours", value: fmtHours(totalHours) },
      { label: "Trip Hours", value: fmtHours(totalTripHours) },
      { label: "Total Cost", value: INR(totalCost) },
      ...costCards
    ], y);

    y = drawTable(
      doc,
      ["#", "Date", "Vehicle", "Company", "Type", "Driver", "Rate/Hr", "Opening", "Closing", "Hours", "Cost", "Trip?", "Remarks"],
      sortedLogs.map((l, i) => [
        i + 1,
        fmtDate(l.date),
        l.vehicleId?.vehicleNumber || "—",
        l.companyId?.name || "—",
        l.vehicleId?.vehicleType || "—",
        l.driverName || "—",
        INR(l.hourlyRate),
        l.openingMeter ?? "—",
        l.closingMeter ?? "—",
        fmtHours(l.totalHours),
        INR(calcEntryCost(l)),
        l.isTrip ? "Yes" : "No",
        l.remarks || l.tripPurpose || "—",
      ]),
      y,
      {
        fontSize: 7.2,
        columnStyles: {
          0: { cellWidth: 7, halign: "center" },
          1: { cellWidth: 18 },
          2: { cellWidth: 24 },
          3: { cellWidth: 22 },
          4: { cellWidth: 16 },
          5: { cellWidth: 20 },
          6: { cellWidth: 16, halign: "right" },
          7: { cellWidth: 16, halign: "right" },
          8: { cellWidth: 16, halign: "right" },
          9: { cellWidth: 14, halign: "right" },
          10: { cellWidth: 20, halign: "right" },
          11: { cellWidth: 12, halign: "center" },
          // 12 "Remarks" left to auto-fill remaining width
        },
      }
    );

    // Daily Report Section
    const dateGroups = {};
    mainEntries.forEach(l => {
      const d = l.date ? l.date.split("T")[0] : null;
      if (!d) return;
      if (!dateGroups[d]) dateGroups[d] = [];
      dateGroups[d].push(l);
    });

    const dates = Object.keys(dateGroups).sort();
    if (dates.length > 0) {
      y = drawSectionTitle(doc, "Daily Report", y);

      dates.forEach(dateStr => {
        const dayLogs = dateGroups[dateStr];
        const dayCompanies = {};
        dayLogs.forEach(l => {
          const cName = l.companyId?.name || "Unassigned";
          if (!dayCompanies[cName]) dayCompanies[cName] = true;
        });
        const companyList = Object.keys(dayCompanies).sort();

        const vehicleGroups = {};
        dayLogs.forEach(l => {
          const vName = l.vehicleId?.vehicleNumber || "Unknown";
          if (!vehicleGroups[vName]) {
            vehicleGroups[vName] = { totalHours: 0, companies: {} };
            companyList.forEach(c => vehicleGroups[vName].companies[c] = { hours: 0, cost: 0 });
          }
          vehicleGroups[vName].totalHours += Number(l.totalHours || 0);
          const cName = l.companyId?.name || "Unassigned";
          vehicleGroups[vName].companies[cName].hours += Number(l.totalHours || 0);
          vehicleGroups[vName].companies[cName].cost += calcEntryCost(l);
        });

        const headers = ["Vehicle", "Total Hrs", ...companyList];
        const dataRows = Object.keys(vehicleGroups).map(vName => {
          const vg = vehicleGroups[vName];
          return [
            vName,
            fmtHours(vg.totalHours),
            ...companyList.map(cName => {
              const cData = vg.companies[cName];
              return cData.hours > 0 ? `${fmtHours(cData.hours)}h (${INR(cData.cost)})` : "—";
            })
          ];
        });

        // Auto-shrink font size as more company columns are added, so the
        // table never overflows the page width regardless of company count.
        const totalCols = headers.length;
        const dayFontSize = totalCols > 10 ? 6 : totalCols > 6 ? 6.8 : 7.5;

        const pageH = doc.internal.pageSize.getHeight();
        if (y + 14 > pageH - 20) { doc.addPage(); y = 20; }

        doc.setFontSize(9.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLORS.primaryDark);
        doc.text(fmtDate(dateStr), 14, y + 4);
        y += 8;

        y = drawTable(doc, headers, dataRows, y, {
          fontSize: dayFontSize,
          columnStyles: {
            0: { cellWidth: 32 },
            1: { cellWidth: 20, halign: "right" },
          },
        });
      });
    }

  } else {
    y = drawNoData(doc, y, "No rented machinery logs for this period.");
  }
  finishModulePDF(doc, "RentedMachinery", periodLabel, start);
}