import api from "../api/axiosConfig";
import { useEffect, useState } from "react";

export const useConsumables = () => {
  const [items, setItems] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/consumables/items");
      setItems(res.data?.data || []);
      return res.data;
    } catch (err) {
      console.error("Fetch consumable items failed", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLowStockItems = async () => {
    try {
      const res = await api.get("/consumables/items/low-stock");
      setLowStockItems(res.data?.data || []);
      return res.data;
    } catch (err) {
      console.error("Fetch low stock consumables failed", err);
      return null;
    }
  };

  const fetchItemTransactions = async (itemId) => {
    try {
      const res = await api.get(`/consumables/transactions/${itemId}`);
      setTransactions(res.data?.data || []);
      return res.data;
    } catch (err) {
      console.error("Fetch consumable transactions failed", err);
      return null;
    }
  };

  const addItem = async (payload) => {
    try {
      const res = await api.post("/consumables/items", payload);
      await fetchItems();
      await fetchLowStockItems();
      return res.data;
    } catch (err) {
      console.error("Add consumable item failed", err);
      return {
        status: "error",
        message: err.response?.data?.message || "Failed to add consumable item",
      };
    }
  };

  const updateItem = async (id, updatedData) => {
    try {
      const res = await api.patch(`/consumables/items/${id}`, updatedData);
      await fetchItems();
      await fetchLowStockItems();
      return res.data;
    } catch (err) {
      console.error("Update consumable item failed", err);
      return {
        status: "error",
        message: err.response?.data?.message || "Failed to update consumable item",
      };
    }
  };

  const addTransaction = async (payload) => {
    try {
      const res = await api.post("/consumables/transactions", payload);
      await fetchItems();
      await fetchLowStockItems();
      if (payload.itemId) {
        await fetchItemTransactions(payload.itemId);
      }
      return res.data;
    } catch (err) {
      console.error("Add consumable transaction failed", err);
      return {
        status: "error",
        message: err.response?.data?.message || "Failed to save transaction",
      };
    }
  };

  const deleteItem = async (id) => {
    try {
      await api.delete(`/consumables/items/${id}`);
      await fetchItems();
      await fetchLowStockItems();
      return { status: "success" };
    } catch (err) {
      return { status: "error", message: "Failed to delete item" };
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
    deleteItem,
    addTransaction,
  };
};