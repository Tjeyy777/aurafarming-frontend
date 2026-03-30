// src/hooks/useDiesel.js
import api from "../api/axiosConfig";
import { useEffect, useState } from "react";

export const useDiesel = () => {
  const [entries, setEntries] = useState([]);
  const [ownedMachines, setOwnedMachines] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDieselEntries = async (params = {}) => {
    setIsLoading(true);
    try {
      const res = await api.get("/diesel", { params });
      setEntries(res.data?.data || []);
      return res.data;
    } catch (err) {
      console.error("Fetch diesel entries failed", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOwnedMachines = async () => {
    try {
      const res = await api.get("/diesel/owned-machines");
      setOwnedMachines(res.data?.data || []);
      return res.data;
    } catch (err) {
      console.error("Fetch owned machines failed", err);
      return null;
    }
  };

  const fetchSingleDieselEntry = async (id) => {
    try {
      const res = await api.get(`/diesel/${id}`);
      setSelectedEntry(res.data?.data || null);
      return res.data;
    } catch (err) {
      console.error("Fetch single diesel entry failed", err);
      return null;
    }
  };

  const addDieselEntry = async (payload) => {
    try {
      const res = await api.post("/diesel", payload);
      await fetchDieselEntries();
      return res.data;
    } catch (err) {
      console.error("Add diesel entry failed", err.response?.data || err);
      return {
        status: "error",
        message: err.response?.data?.message || "Failed to add diesel entry",
      };
    }
  };

  const updateDieselEntry = async (id, payload) => {
    try {
      const res = await api.patch(`/diesel/${id}`, payload);
      await fetchDieselEntries();
      return res.data;
    } catch (err) {
      console.error("Update diesel entry failed", err.response?.data || err);
      return {
        status: "error",
        message: err.response?.data?.message || "Failed to update diesel entry",
      };
    }
  };

  const deleteDieselEntry = async (id) => {
    try {
      const res = await api.delete(`/diesel/${id}`);
      await fetchDieselEntries();
      return res.data;
    } catch (err) {
      console.error("Delete diesel entry failed", err.response?.data || err);
      return {
        status: "error",
        message: err.response?.data?.message || "Failed to delete diesel entry",
      };
    }
  };

  useEffect(() => {
    fetchDieselEntries();
    fetchOwnedMachines();
  }, []);

  return {
    entries,
    ownedMachines,
    selectedEntry,
    isLoading,
    fetchDieselEntries,
    fetchOwnedMachines,
    fetchSingleDieselEntry,
    addDieselEntry,
    updateDieselEntry,
    deleteDieselEntry,
    setSelectedEntry,
  };
};