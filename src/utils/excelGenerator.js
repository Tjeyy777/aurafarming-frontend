// src/utils/excelGenerator.js
import * as XLSX from "xlsx";
import { filterByDateRange, getDateRange } from "./pdfGenerator";

const INR = (val) => Number(val || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtDateTime = (d) => d ? new Date(d).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) : "—";
const fmtHours = (val) => Number(Number(val || 0).toFixed(3));

// ─── Helper: Create styled workbook with a sheet ─────────────────────────────
function createWorkbook() {
  return XLSX.utils.book_new();
}

function addSheet(wb, name, data, headers) {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  // Set column widths
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 4, 14) }));
  XLSX.utils.book_append_sheet(wb, ws, name.substring(0, 31)); // Excel sheet name max 31 chars
}

function saveWorkbook(wb, fileName) {
  XLSX.writeFile(wb, fileName);
}

// ═════════════════════════════════════════════════════════════════════════════
// PER-MODULE EXCEL GENERATORS
// ═════════════════════════════════════════════════════════════════════════════

export function generateEmployeesExcel({ employees = [], period, customDate }) {
  const wb = createWorkbook();
  const { start, end } = getDateRange(period, customDate);

  addSheet(wb, "Employees", employees.map((e, i) => [
    i + 1, e.name || "—", e.role?.title || "—", e.subRole?.title || "—",
    e.dailyWage || 0, e.phone || "—", e.isActive ? "Active" : "Inactive",
    e.aadharNumber || "—",
  ]), ["#", "Name", "Role", "Sub-Role", "Daily Wage (₹)", "Phone", "Status", "Aadhar"]);

  saveWorkbook(wb, `Employees_Report_${fmtDate(start)}.xlsx`);
}

export function generateAttendanceExcel({ records = [], period, customDate }) {
  const wb = createWorkbook();
  const { start, end } = getDateRange(period, customDate);

  const present = records.filter((a) => a.status === "present").length;
  const absent = records.filter((a) => a.status === "absent").length;

  // Summary sheet
  addSheet(wb, "Summary", [
    ["Present", present],
    ["Absent", absent],
    ["Total Records", records.length],
    ["OT Hours", fmtHours(records.reduce((s, a) => s + Number(a.overtimeHour || 0), 0))],
  ], ["Metric", "Value"]);

  // Detail sheet
  addSheet(wb, "Attendance Records", records.map((a, i) => [
    i + 1, fmtDate(a.date), a.employeeId?.name || "—",
    (a.status || "—").toUpperCase(), fmtHours(a.overtimeHour), a.perHourRate || 0,
  ]), ["#", "Date", "Employee", "Status", "OT Hours", "Per Hr Rate (₹)"]);

  saveWorkbook(wb, `Attendance_Report_${fmtDate(start)}.xlsx`);
}

export function generateWeighbridgeExcel({ entries = [], period, customDate }) {
  const wb = createWorkbook();
  const { start, end } = getDateRange(period, customDate);
  const filtered = filterByDateRange(entries, start, end, "entryTime");

  const totalNet = filtered.reduce((s, e) => s + Number(e.netWeight || 0), 0);
  const completed = filtered.filter((e) => e.status === "completed").length;

  addSheet(wb, "Summary", [
    ["Total Entries", filtered.length],
    ["Completed", completed],
    ["Total Net Weight (kg)", totalNet],
  ], ["Metric", "Value"]);

  addSheet(wb, "Weighbridge Entries", filtered.map((e, i) => [
    i + 1, e.vehicleNumber || "—", e.driverName || "—",
    e.emptyWeight ?? "—", e.loadedWeight ?? "—", e.netWeight ?? "—",
    e.remarks || "—", (e.status || "—").toUpperCase(), fmtDateTime(e.entryTime), fmtDateTime(e.exitTime),
  ]), ["#", "Vehicle", "Driver", "Empty (kg)", "Loaded (kg)", "Net (kg)", "Remarks", "Status", "Entry Time", "Exit Time"]);

  saveWorkbook(wb, `Weighbridge_Report_${fmtDate(start)}.xlsx`);
}

export function generateExplosivesExcel({ items = [], period, customDate }) {
  const wb = createWorkbook();
  const { start } = getDateRange(period, customDate);
  const totalValue = items.reduce((s, i) => s + (i.currentStock || 0) * (i.unitCost || 0), 0);

  addSheet(wb, "Summary", [
    ["Total Items", items.length],
    ["Total Inventory Value (₹)", totalValue],
  ], ["Metric", "Value"]);

  addSheet(wb, "Explosives Inventory", items.map((item, i) => [
    i + 1, item.name || "—", item.category || "—", item.currentStock ?? 0,
    item.unit || "—", item.unitCost || 0, (item.currentStock || 0) * (item.unitCost || 0),
  ]), ["#", "Item Name", "Category", "Stock", "Unit", "Unit Cost (₹)", "Total Value (₹)"]);

  saveWorkbook(wb, `Explosives_Report_${fmtDate(start)}.xlsx`);
}

export function generateConsumablesExcel({ items = [], period, customDate }) {
  const wb = createWorkbook();
  const { start } = getDateRange(period, customDate);
  const totalValue = items.reduce((s, i) => s + (i.currentStock || 0) * (i.unitCost || 0), 0);

  addSheet(wb, "Summary", [
    ["Total Items", items.length],
    ["Total Inventory Value (₹)", totalValue],
  ], ["Metric", "Value"]);

  addSheet(wb, "Consumables Inventory", items.map((item, i) => [
    i + 1, item.name || "—", item.category || "—", item.currentStock ?? 0,
    item.unit || "—", item.unitCost || 0, (item.currentStock || 0) * (item.unitCost || 0),
  ]), ["#", "Item Name", "Category", "Stock", "Unit", "Unit Cost (₹)", "Total Value (₹)"]);

  saveWorkbook(wb, `Consumables_Report_${fmtDate(start)}.xlsx`);
}

export function generateMachineryExcel({ machines = [], period, customDate }) {
  const wb = createWorkbook();
  const { start } = getDateRange(period, customDate);

  addSheet(wb, "Summary", [
    ["Total Machines", machines.length],
    ["Active", machines.filter((m) => m.status === "active" || !m.status).length],
  ], ["Metric", "Value"]);

  addSheet(wb, "Machinery", machines.map((m, i) => [
    i + 1, m.machineName || m.name || "—", m.machineType || m.type || "—",
    m.machineCode || "—", m.currentMeterReading ?? "—", (m.status || "Active").toUpperCase(),
  ]), ["#", "Machine Name", "Type", "Machine Code", "Meter Reading", "Status"]);

  saveWorkbook(wb, `Machinery_Report_${fmtDate(start)}.xlsx`);
}

export function generateDieselExcel({ entries = [], period, customDate }) {
  const wb = createWorkbook();
  const { start, end } = getDateRange(period, customDate);
  const filtered = filterByDateRange(entries, start, end, "date");

  const totalLitres = filtered.reduce((s, e) => s + Number(e.litres || 0), 0);
  const totalCost = filtered.reduce((s, e) => s + Number(e.totalCost || 0), 0);

  addSheet(wb, "Summary", [
    ["Total Litres", totalLitres],
    ["Total Cost (₹)", totalCost],
    ["Entries", filtered.length],
  ], ["Metric", "Value"]);

  addSheet(wb, "Diesel Entries", filtered.map((e, i) => [
    i + 1, fmtDate(e.date),
    e.dieselFor === "machine" ? (e.machineId?.machineName || "Machine") : (e.expenseName || "—"),
    e.litres ?? "—", e.pricePerLitre || 0, e.totalCost || 0,
  ]), ["#", "Date", "For", "Litres", "Rate/L (₹)", "Total Cost (₹)"]);

  saveWorkbook(wb, `Diesel_Report_${fmtDate(start)}.xlsx`);
}

export function generateExpensesExcel({ expenses = [], period, customDate }) {
  const wb = createWorkbook();
  const { start, end } = getDateRange(period, customDate);
  const filtered = filterByDateRange(expenses, start, end, "date");

  const totalAmount = filtered.reduce((s, e) => s + Number(e.amount || 0), 0);

  addSheet(wb, "Summary", [
    ["Total Amount (₹)", totalAmount],
    ["Entries", filtered.length],
  ], ["Metric", "Value"]);

  addSheet(wb, "Expenses", filtered.map((e, i) => [
    i + 1, fmtDate(e.date), e.expenseName || "—", e.category || "—",
    e.amount || 0, e.notes || "—",
  ]), ["#", "Date", "Expense Name", "Category", "Amount (₹)", "Notes"]);

  saveWorkbook(wb, `Expenses_Report_${fmtDate(start)}.xlsx`);
}

export function generateRentedLogsExcel({ logs = [], period, customDate, companyName }) {
  const wb = createWorkbook();
  const { start, end } = getDateRange(period, customDate);
  const filtered = filterByDateRange(logs, start, end, "date");

  const sortedLogs = [...filtered].reverse();

  const mainEntries = sortedLogs.filter((l) => !l.isTrip);
  const tripEntries = sortedLogs.filter((l) => l.isTrip);
  const totalCost = mainEntries.reduce((s, l) => s + Number(l.cost || 0), 0);
  const totalHours = fmtHours(mainEntries.reduce((s, l) => s + Number(l.totalHours || 0), 0));
  const totalTripHours = fmtHours(tripEntries.reduce((s, l) => s + Number(l.totalHours || 0), 0));

  const companyHeader = companyName ? `Report for ${companyName}` : "Rented Logs Report";

  addSheet(wb, "Summary", [
    [companyHeader],
    ["Main Entries", mainEntries.length],
    ["Trips", tripEntries.length],
    ["Our Hours", totalHours],
    ["Trip Hours", totalTripHours],
    ["Total Cost (₹)", totalCost],
  ], ["Metric", "Value"]);

  addSheet(wb, "Rented Logs", sortedLogs.map((l, i) => [
    i + 1, fmtDate(l.date), l.vehicleId?.vehicleNumber || "—",
    l.companyId?.name || "—", l.vehicleId?.vehicleType || "—", l.driverName || "—",
    l.openingMeter ?? "—", l.closingMeter ?? "—", fmtHours(l.totalHours),
    l.hourlyRate || 0, l.cost || 0,
    l.isTrip ? "Yes" : "No", l.remarks || l.tripPurpose || "—",
  ]), ["#", "Date", "Vehicle", "Company", "Type", "Driver", "Opening", "Closing", "Hours", "Rate/Hr (₹)", "Cost (₹)", "Trip?", "Remarks"]);

  saveWorkbook(wb, `RentedMachinery_Report_${fmtDate(start)}.xlsx`);
}

// ═════════════════════════════════════════════════════════════════════════════
// FULL REPORT (ALL MODULES)
// ═════════════════════════════════════════════════════════════════════════════
export function generateFullExcel({
  period, customDate, employees = [], explosiveItems = [], consumableItems = [],
  expenses = [], dieselEntries = [], machines = [], weighbridgeEntries = [],
  attendanceRecords = [], rentedLogs = [],
}) {
  const wb = createWorkbook();
  const { start, end } = getDateRange(period, customDate);

  const filteredExpenses = filterByDateRange(expenses, start, end, "date");
  const filteredDiesel = filterByDateRange(dieselEntries, start, end, "date");
  const filteredWB = filterByDateRange(weighbridgeEntries, start, end, "entryTime");
  const filteredAttendance = filterByDateRange(attendanceRecords, start, end, "date");
  const filteredRented = filterByDateRange(rentedLogs, start, end, "date");

  // Overview
  addSheet(wb, "Overview", [
    ["Employees", employees.length],
    ["Period Expenses (₹)", filteredExpenses.reduce((s, e) => s + Number(e.amount || 0), 0)],
    ["Diesel Cost (₹)", filteredDiesel.reduce((s, e) => s + Number(e.totalCost || 0), 0)],
    ["Weighbridge Trips", filteredWB.filter((e) => e.status === "completed").length],
    ["Attendance Records", filteredAttendance.length],
  ], ["Metric", "Value"]);

  // Employees
  addSheet(wb, "Employees", employees.map((e, i) => [
    i + 1, e.name || "—", e.role?.title || "—", e.dailyWage || 0, e.phone || "—", e.isActive ? "Active" : "Inactive",
  ]), ["#", "Name", "Role", "Daily Wage (₹)", "Phone", "Status"]);

  // Attendance
  if (filteredAttendance.length > 0) {
    addSheet(wb, "Attendance", filteredAttendance.map((a, i) => [
      i + 1, fmtDate(a.date), a.employeeId?.name || "—", (a.status || "—").toUpperCase(), fmtHours(a.overtimeHour),
    ]), ["#", "Date", "Employee", "Status", "OT Hours"]);
  }

  // Weighbridge
  if (filteredWB.length > 0) {
    addSheet(wb, "Weighbridge", filteredWB.map((e, i) => [
      i + 1, e.vehicleNumber || "—", e.emptyWeight ?? "—", e.loadedWeight ?? "—",
      e.netWeight ?? "—", e.remarks || "—", (e.status || "—").toUpperCase(), fmtDateTime(e.entryTime),
    ]), ["#", "Vehicle", "Empty (kg)", "Loaded (kg)", "Net (kg)", "Remarks", "Status", "Entry Time"]);
  }

  // Explosives
  addSheet(wb, "Explosives", explosiveItems.map((item, i) => [
    i + 1, item.name || "—", item.category || "—", item.currentStock ?? 0, item.unit || "—",
    item.unitCost || 0, (item.currentStock || 0) * (item.unitCost || 0),
  ]), ["#", "Item", "Category", "Stock", "Unit", "Unit Cost (₹)", "Value (₹)"]);

  // Consumables
  addSheet(wb, "Consumables", consumableItems.map((item, i) => [
    i + 1, item.name || "—", item.category || "—", item.currentStock ?? 0, item.unit || "—",
    item.unitCost || 0, (item.currentStock || 0) * (item.unitCost || 0),
  ]), ["#", "Item", "Category", "Stock", "Unit", "Unit Cost (₹)", "Value (₹)"]);

  // Machinery
  addSheet(wb, "Machinery", machines.map((m, i) => [
    i + 1, m.machineName || m.name || "—", m.machineType || m.type || "—",
    m.currentMeterReading ?? "—", (m.status || "Active").toUpperCase(),
  ]), ["#", "Name", "Type", "Meter Reading", "Status"]);

  // Diesel
  if (filteredDiesel.length > 0) {
    addSheet(wb, "Diesel", filteredDiesel.map((e, i) => [
      i + 1, fmtDate(e.date), e.litres ?? "—", e.pricePerLitre || 0, e.totalCost || 0,
    ]), ["#", "Date", "Litres", "Rate/L (₹)", "Total (₹)"]);
  }

  // Expenses
  if (filteredExpenses.length > 0) {
    addSheet(wb, "Expenses", filteredExpenses.map((e, i) => [
      i + 1, fmtDate(e.date), e.expenseName || "—", e.category || "—", e.amount || 0, e.notes || "—",
    ]), ["#", "Date", "Expense", "Category", "Amount (₹)", "Notes"]);
  }

  // Rented
  if (filteredRented.length > 0) {
    const sortedRented = [...filteredRented].reverse();
    addSheet(wb, "Rented Machinery", sortedRented.map((l, i) => [
      i + 1, fmtDate(l.date), l.vehicleId?.vehicleNumber || "—",
      l.vehicleId?.vehicleType || "—", l.driverName || "—",
      l.openingMeter ?? "—", l.closingMeter ?? "—", fmtHours(l.totalHours),
      l.hourlyRate || 0, l.cost || 0,
      l.isTrip ? "Yes" : "No", l.remarks || l.tripPurpose || "—",
    ]), ["#", "Date", "Vehicle", "Type", "Driver", "Opening", "Closing", "Hours", "Rate/Hr (₹)", "Cost (₹)", "Trip?", "Remarks"]);
  }

  const periodLabel = period === "daily" ? "Daily" : period === "weekly" ? "Weekly" : "Monthly";
  saveWorkbook(wb, `QuarryProSuite_${periodLabel}_Report_${fmtDate(start)}.xlsx`);
}
