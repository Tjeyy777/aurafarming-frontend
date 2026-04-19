import api from "../api/axiosConfig";
import { useEffect, useState } from "react";

export const useInventory = () => {
  const [items, setItems] = useState([]);
  const [sellers, setSellers] = useState([]); // New state for dropdown
  const [lowStockItems, setLowStockItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // ==========================
  // SELLER ACTIONS
  // ==========================

  const fetchSellers = async () => {
    try {
      const res = await api.get("/inventory/sellers");
      setSellers(res.data?.data || []);
    } catch (err) {
      console.error("Fetch sellers failed", err);
    }
  };

  const addSeller = async (payload) => {
    try {
      const res = await api.post("/inventory/sellers", payload);
      await fetchSellers(); // Refresh list
      return res.data;
    } catch (err) {
      return { status: "error", message: err.response?.data?.message || "Failed to add seller" };
    }
  };

  const deleteSeller = async (id) => {
    try {
      await api.delete(`/inventory/sellers/${id}`);
      await fetchSellers();
      return { status: "success" };
    } catch (err) {
      return { status: "error", message: "Failed to delete seller" };
    }
  };

  // ==========================
  // ITEM ACTIONS
  // ==========================

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

  const addItem = async (payload) => {
    try {
      // payload should now include sellerId: "ID_FROM_DROPDOWN"
      const res = await api.post("/inventory/items", payload);
      await fetchItems();
      await fetchLowStockItems();
      return res.data;
    } catch (err) {
      return { status: "error", message: err.response?.data?.message || "Failed to add item" };
    }
  };

  const deleteItem = async (id) => {
    try {
      await api.delete(`/inventory/items/${id}`);
      await fetchItems();
      await fetchLowStockItems();
      return { status: "success" };
    } catch (err) {
      return { status: "error", message: "Failed to delete item" };
    }
  };

  // ==========================
  // TRANSACTION ACTIONS
  // ==========================

  const addTransaction = async (payload) => {
    try {
      const res = await api.post("/inventory/transactions", payload);
      await fetchItems();
      await fetchLowStockItems();
      if (payload.itemId) await fetchItemTransactions(payload.itemId);
      return res.data;
    } catch (err) {
      return { status: "error", message: err.response?.data?.message || "Failed to add transaction" };
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

  // Initial Load
  useEffect(() => {
    fetchItems();
    fetchSellers(); // Load sellers for the dropdown immediately
    fetchLowStockItems();
  }, []);

  return {
    items,
    sellers, // Export this to use in your <select>
    lowStockItems,
    transactions,
    isLoading,
    fetchSellers,
    addSeller,
    deleteSeller,
    fetchItems,
    addItem,
    deleteItem,
    updateItem: async (id, data) => {
       const res = await api.patch(`/inventory/items/${id}`, data);
       fetchItems();
       return res.data;
    },
    addTransaction,
    fetchItemTransactions
  };
};