import api from "../api/axiosConfig";
import { useEffect, useState } from "react";

export const useInventory = () => {
  const [items, setItems] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/inventory/items");
      setItems(res.data?.data || []);
    } catch (err) {
      console.error("Fetch items failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLowStockItems = async () => {
    try {
      const res = await api.get("/inventory/items/low-stock");
      setLowStockItems(res.data?.data || []);
      return res.data;
    } catch (err) {
      console.error("Fetch low stock failed", err);
      return null;
    }
  };

  const fetchItemTransactions = async (itemId) => {
    try {
      const res = await api.get(`/inventory/transactions/${itemId}`);
      setTransactions(res.data?.data || []);
      return res.data;
    } catch (err) {
      console.error("Fetch transactions failed", err);
      return null;
    }
  };

  const addItem = async (payload) => {
    try {
      const res = await api.post("/inventory/items", payload);
      await fetchItems();
      await fetchLowStockItems();
      return res.data;
    } catch (err) {
      console.error("Add item failed", err);
      return {
        status: "error",
        message: err.response?.data?.message || "Failed to add item",
      };
    }
  };

  const updateItem = async (id, updatedData) => {
    try {
      const res = await api.patch(`/inventory/items/${id}`, updatedData);
      await fetchItems();
      await fetchLowStockItems();
      return res.data;
    } catch (err) {
      console.error("Update item failed", err);
      return {
        status: "error",
        message: err.response?.data?.message || "Failed to update item",
      };
    }
  };

  const addTransaction = async (payload) => {
    try {
      const res = await api.post("/inventory/transactions", payload);
      await fetchItems();
      await fetchLowStockItems();
      if (payload.itemId) {
        await fetchItemTransactions(payload.itemId);
      }
      return res.data;
    } catch (err) {
      console.error("Add transaction failed", err);
      return {
        status: "error",
        message: err.response?.data?.message || "Failed to add transaction",
      };
    }
  };

  useEffect(() => {
    fetchItems();
    fetchLowStockItems();
  }, []);

  return {
    items,
    lowStockItems,
    transactions,
    isLoading,
    fetchItems,
    fetchLowStockItems,
    fetchItemTransactions,
    addItem,
    updateItem,
    addTransaction,
  };
};