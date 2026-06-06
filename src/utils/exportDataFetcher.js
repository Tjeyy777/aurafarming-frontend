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
