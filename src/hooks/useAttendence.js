import api from "../api/axiosConfig";
import { useState } from "react";

export const useAttendance = () => {
  const [loading, setLoading] = useState(false);

  // ─── POST /attendance — mark or update attendance ───
  const markAttendance = async (payload) => {
    setLoading(true);
    try {
      const res = await api.post("/attendance", payload);
      return res.data;
    } catch (err) {
      console.error("Mark attendance failed", err);
      return {
        status: "error",
        message: err.response?.data?.message || "Error",
      };
    } finally {
      setLoading(false);
    }
  };

  // ─── GET /attendance?date=YYYY-MM-DD — fetch daily records ───
  const getAttendanceByDate = async (date) => {
    try {
      const res = await api.get("/attendance", { params: { date } });
      return res.data;
    } catch (err) {
      console.error("Fetch by date failed", err);
      return null;
    }
  };

  // ─── GET /attendance/employee/:id — full history for one employee ───
  const getEmployeeHistory = async (employeeId) => {
    try {
      const res = await api.get(`/attendance/employee/${employeeId}`);
      return res.data;
    } catch (err) {
      console.error("Employee history failed", err);
      return null;
    }
  };

  // ─── REPORTS ───
  const getMonthlyReport = async (employeeId, year, month) => {
    try {
      const res = await api.get("/attendance/report/monthly", {
        params: { employeeId, year, month },
      });
      return res.data;
    } catch (err) {
      console.error("Monthly report failed", err);
      return null;
    }
  };

  const getWeeklyReport = async (employeeId, date) => {
    try {
      const res = await api.get("/attendance/report/weekly", {
        params: { employeeId, date },
      });
      return res.data;
    } catch (err) {
      console.error("Weekly report failed", err);
      return null;
    }
  };

  const getDailyReport = async (employeeId, date) => {
    try {
      const res = await api.get("/attendance/report/daily", {
        params: { employeeId, date },
      });
      return res.data;
    } catch (err) {
      console.error("Daily report failed", err);
      return null;
    }
  };

  return {
    loading,
    markAttendance,
    getAttendanceByDate,
    getEmployeeHistory,
    getMonthlyReport,
    getWeeklyReport,
    getDailyReport,
  };
};
