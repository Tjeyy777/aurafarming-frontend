import api from "../api/axiosConfig";
import { useState } from "react";

export const useAttendance = () => {
  const [loading, setLoading] = useState(false);

  // POST /attendance  — matches router.post("/", ...)
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

  // GET /attendance?date=2024-06-10  — matches router.get("/", ...)
  const getAttendanceByDate = async (date) => {
    try {
      const res = await api.get("/attendance", { params: { date } });
      return res.data; // { status, results, data: [...] }
    } catch (err) {
      console.error("Fetch by date failed", err);
      return null;
    }
  };

  // GET /attendance/report/monthly?employeeId=X&year=Y&month=M
  const getMonthlyAttendance = async (employeeId, year, month) => {
    try {
      const res = await api.get("/attendance/report/monthly", {
        params: { employeeId, year, month },
      });
      return res.data; // { status, data: { presentDays, absentDays, dailyRecords, ... } }
    } catch (err) {
      console.error("Monthly report fetch failed", err);
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

  // Add to return object:
  return {
    loading,
    markAttendance,
    getAttendanceByDate,
    getMonthlyAttendance,
    getWeeklyReport, 
    getDailyReport, 
  };
};
