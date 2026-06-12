// src/utils/exportDataFetcher.js
// Fetches ALL data (bypassing pagination/filters) for PDF/Excel exports.
// This ensures that when a user selects a previous date range,
// the export generators have the complete dataset to filter from.

import api from "../api/axiosConfig";

/**
 * Fetch ALL weighbridge entries (no date filter, high limit to bypass pagination).
 */
export async function fetchAllWeighbridgeEntries() {
  const res = await api.get("/weighbridge", { params: { page: 1, limit: 99999 } });
  return res.data?.data || [];
}

/**
 * Fetch ALL diesel entries (no filters).
 */
export async function fetchAllDieselEntries() {
  const res = await api.get("/diesel");
  return res.data?.data || [];
}

/**
 * Fetch ALL expenses (no filters).
 */
export async function fetchAllExpenses() {
  const res = await api.get("/expenses");
  return res.data?.data || [];
}

/**
 * Fetch ALL rented machine logs (no filters).
 */
export async function fetchAllRentedLogs() {
  const res = await api.get("/rented-machines/logs");
  return res.data?.data || [];
}

/**
 * Fetch ALL machines.
 */
export async function fetchAllMachines() {
  const res = await api.get("/machines");
  return res.data?.data || [];
}

/**
 * Fetch ALL explosives (inventory items).
 */
export async function fetchAllExplosives() {
  const res = await api.get("/inventory/items");
  return res.data?.data || [];
}

/**
 * Fetch ALL consumables.
 */
export async function fetchAllConsumables() {
  const res = await api.get("/consumables/items");
  return res.data?.data || [];
}

/**
 * Fetch ALL employees (bypassing react-query cache).
 */
export async function fetchAllEmployees() {
  const res = await api.get("/employees");
  return res.data?.data || [];
}

/**
 * Fetch ALL attendance records for a specific date range.
 * Loops through each day and accumulates the results.
 */
export async function fetchAllAttendanceForRange(startDate, endDate) {
  const days = [];
  const cur = new Date(startDate);
  const end = new Date(endDate);
  
  while (cur <= end) {
    days.push(cur.toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + 1);
  }
  
  const results = await Promise.all(
    days.map((d) => api.get(`/attendance?date=${d}`))
  );
  
  const records = [];
  results.forEach((r) => {
    if (r?.data?.data) {
      records.push(...r.data.data);
    }
  });
  
  return records;
}
