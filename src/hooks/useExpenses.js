import api from "../api/axiosConfig";
import { useEffect, useState } from "react";

export const useExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({
    overview: {
      totalExpenseAmount: 0,
      totalExpenseEntries: 0,
    },
    byCategory: [],
  });
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchExpenses = async (params = {}) => {
    setIsLoading(true);
    try {
      const res = await api.get("/expenses", { params });
      setExpenses(res.data?.data || []);
      return res.data;
    } catch (err) {
      console.error("Fetch expenses failed", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSingleExpense = async (id) => {
    try {
      const res = await api.get(`/expenses/${id}`);
      setSelectedExpense(res.data?.data || null);
      return res.data;
    } catch (err) {
      console.error("Fetch single expense failed", err);
      return null;
    }
  };

  const fetchExpenseSummary = async (params = {}) => {
    try {
      const res = await api.get("/expenses/summary", { params });
      setSummary(
        res.data?.data || {
          overview: {
            totalExpenseAmount: 0,
            totalExpenseEntries: 0,
          },
          byCategory: [],
        }
      );
      return res.data;
    } catch (err) {
      console.error("Fetch expense summary failed", err);
      return null;
    }
  };

  const addExpense = async (payload) => {
    try {
      const res = await api.post("/expenses", payload);
      await fetchExpenses();
      await fetchExpenseSummary();
      return res.data;
    } catch (err) {
      console.error("Add expense failed", err.response?.data || err);
      return {
        status: "error",
        message: err.response?.data?.message || "Failed to add expense",
      };
    }
  };

  const updateExpense = async (id, payload) => {
    try {
      const res = await api.patch(`/expenses/${id}`, payload);
      await fetchExpenses();
      await fetchExpenseSummary();
      return res.data;
    } catch (err) {
      console.error("Update expense failed", err.response?.data || err);
      return {
        status: "error",
        message: err.response?.data?.message || "Failed to update expense",
      };
    }
  };

  const deleteExpense = async (id) => {
    try {
      const res = await api.delete(`/expenses/${id}`);
      await fetchExpenses();
      await fetchExpenseSummary();
      return res.data;
    } catch (err) {
      console.error("Delete expense failed", err.response?.data || err);
      return {
        status: "error",
        message: err.response?.data?.message || "Failed to delete expense",
      };
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchExpenseSummary();
  }, []);

  return {
    expenses,
    summary,
    selectedExpense,
    isLoading,
    fetchExpenses,
    fetchSingleExpense,
    fetchExpenseSummary,
    addExpense,
    updateExpense,
    deleteExpense,
    setSelectedExpense,
  };
};