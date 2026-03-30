import axios from "axios";
import { useEffect, useState } from "react";

export const useMachines = () => {
  const [machines, setMachines] = useState([]);
  const [logs, setLogs] = useState([]);
  const [serviceAlerts, setServiceAlerts] = useState({
    dueSoon: [],
    serviceDue: [],
    overdue: [],
  });
  const [machineSummary, setMachineSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMachines = async (params = {}) => {
    setIsLoading(true);
    try {
      const res = await axios.get("/api/machines", { params });
      setMachines(res.data?.data || []);
      return res.data;
    } catch (err) {
      console.error("Fetch machines failed", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSingleMachine = async (id) => {
    try {
      const res = await axios.get(`/api/machines/${id}`);
      return res.data;
    } catch (err) {
      console.error("Fetch single machine failed", err);
      return null;
    }
  };

  const fetchMachineLogs = async (params = {}) => {
    try {
      const res = await axios.get("/api/machines/logs", { params });
      setLogs(res.data?.data || []);
      return res.data;
    } catch (err) {
      console.error("Fetch machine logs failed", err);
      return null;
    }
  };

  const fetchMachineLogHistory = async (machineId) => {
    try {
      const res = await axios.get(`/api/machines/logs/history/${machineId}`);
      setLogs(res.data?.data || []);
      return res.data;
    } catch (err) {
      console.error("Fetch machine log history failed", err);
      return null;
    }
  };

  const fetchMachineSummary = async (machineId) => {
    try {
      const res = await axios.get(`/api/machines/summary/${machineId}`);
      setMachineSummary(res.data?.data || null);
      return res.data;
    } catch (err) {
      console.error("Fetch machine summary failed", err);
      return null;
    }
  };

  const fetchServiceAlerts = async () => {
    try {
      const res = await axios.get("/api/machines/service-alerts");
      setServiceAlerts(
        res.data?.data || {
          dueSoon: [],
          serviceDue: [],
          overdue: [],
        },
      );
      return res.data;
    } catch (err) {
      console.error("Fetch service alerts failed", err);
      return null;
    }
  };

  const addMachine = async (payload) => {
    try {
      const res = await axios.post("/api/machines", payload);
      await fetchMachines();
      await fetchServiceAlerts();
      return res.data;
    } catch (err) {
      console.error("Add machine failed", err);
      return {
        status: "error",
        message: err.response?.data?.message || "Failed to add machine",
      };
    }
  };

  const updateMachine = async (id, payload) => {
    try {
      const res = await axios.patch(`/api/machines/${id}`, payload);
      await fetchMachines();
      await fetchServiceAlerts();
      return res.data;
    } catch (err) {
      console.error("Update machine failed", err);
      return {
        status: "error",
        message: err.response?.data?.message || "Failed to update machine",
      };
    }
  };

  const deleteMachine = async (id) => {
    try {
      const res = await axios.delete(`/api/machines/${id}`);
      await fetchMachines();
      await fetchServiceAlerts();
      return res.data;
    } catch (err) {
      console.error("Delete machine failed", err);
      return {
        status: "error",
        message: err.response?.data?.message || "Failed to delete machine",
      };
    }
  };

  const addMachineLog = async (payload) => {
    try {
      const res = await axios.post("/api/machines/logs", payload);
      await fetchMachines();
      await fetchServiceAlerts();
      if (payload.machineId) {
        await fetchMachineLogHistory(payload.machineId);
        await fetchMachineSummary(payload.machineId);
      }
      return res.data;
    } catch (err) {
      console.error("Add machine log failed", err);
      return {
        status: "error",
        message: err.response?.data?.message || "Failed to save daily update",
      };
    }
  };

  const updateMachineLog = async (id, payload, machineId) => {
    try {
      const res = await axios.patch(`/api/machines/logs/${id}`, payload);
      await fetchMachines();
      await fetchServiceAlerts();
      if (machineId) {
        await fetchMachineLogHistory(machineId);
        await fetchMachineSummary(machineId);
      }
      return res.data;
    } catch (err) {
      console.error("Update machine log failed", err);
      return {
        status: "error",
        message: err.response?.data?.message || "Failed to update log",
      };
    }
  };

  const deleteMachineLog = async (id, machineId) => {
    try {
      const res = await axios.delete(`/api/machines/logs/${id}`);
      await fetchMachines();
      await fetchServiceAlerts();
      if (machineId) {
        await fetchMachineLogHistory(machineId);
        await fetchMachineSummary(machineId);
      }
      return res.data;
    } catch (err) {
      console.error("Delete machine log failed", err);
      return {
        status: "error",
        message: err.response?.data?.message || "Failed to delete log",
      };
    }
  };

  const markServiceDone = async (id) => {
    try {
      const res = await axios.post(`/api/machines/${id}/mark-service-done`);
      await fetchMachines();
      await fetchServiceAlerts();
      return res.data;
    } catch (err) {
      console.error("Mark service done failed", err);
      return {
        status: "error",
        message: err.response?.data?.message || "Failed to mark service done",
      };
    }
  };

  useEffect(() => {
    fetchMachines();
    fetchServiceAlerts();
  }, []);

  return {
    machines,
    logs,
    serviceAlerts,
    machineSummary,
    isLoading,
    fetchMachines,
    fetchSingleMachine,
    fetchMachineLogs,
    fetchMachineLogHistory,
    fetchMachineSummary,
    fetchServiceAlerts,
    addMachine,
    updateMachine,
    deleteMachine,
    addMachineLog,
    updateMachineLog,
    deleteMachineLog,
    markServiceDone,
  };
};
