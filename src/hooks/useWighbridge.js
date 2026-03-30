import api from "../api/axiosConfig";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const getErrorMessage = (err, fallback) =>
  err?.response?.data?.message || fallback;

export const useWeighbridge = ({
  todayPage = 1,
  todayLimit = 50,
  historyPage = 1,
  historyLimit = 10,
  selectedDate = "",
  selectedDayPage = 1,
  selectedDayLimit = 30,
} = {}) => {
  const queryClient = useQueryClient();

  // TODAY ENTRIES
  const todayQuery = useQuery({
    queryKey: ["weighbridge", "today", todayPage, todayLimit],
    queryFn: async () => {
      const res = await api.get(
        `/weighbridge/today?page=${todayPage}&limit=${todayLimit}`
      );
      return res.data;
    },
    keepPreviousData: true,
  });

  // PRODUCTION SUMMARY
  const productionSummaryQuery = useQuery({
    queryKey: ["weighbridge", "production-summary"],
    queryFn: async () => {
      const res = await api.get("/weighbridge/summary/production");
      return res.data;
    },
  });

  // HISTORY SUMMARY
  const historyQuery = useQuery({
    queryKey: ["weighbridge", "history-summary", historyPage, historyLimit],
    queryFn: async () => {
      const res = await api.get(
        `/weighbridge/history/daily-summary?page=${historyPage}&limit=${historyLimit}`
      );
      return res.data;
    },
    keepPreviousData: true,
  });

  // SELECTED DAY ENTRIES
  const selectedDayQuery = useQuery({
    queryKey: [
      "weighbridge",
      "day",
      selectedDate,
      selectedDayPage,
      selectedDayLimit,
    ],
    queryFn: async () => {
      const res = await api.get(
        `/weighbridge/day/${selectedDate}?page=${selectedDayPage}&limit=${selectedDayLimit}`
      );
      return res.data;
    },
    enabled: !!selectedDate,
    keepPreviousData: true,
  });

  // PREVIOUS VEHICLE WEIGHT
  const fetchPreviousWeight = async (vehicleNumber) => {
    if (!vehicleNumber || vehicleNumber.trim().length < 4) return null;

    try {
      const res = await api.get(
        `/weighbridge/vehicle/${encodeURIComponent(
          vehicleNumber.trim().toUpperCase()
        )}/previous-weight`
      );
      return res.data;
    } catch (err) {
      return null;
    }
  };

  // CREATE
  const createEntryMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/weighbridge", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weighbridge", "today"] });
      queryClient.invalidateQueries({
        queryKey: ["weighbridge", "production-summary"],
      });
      queryClient.invalidateQueries({
        queryKey: ["weighbridge", "history-summary"],
      });
    },
  });

  // COMPLETE
  const completeEntryMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await api.patch(`/weighbridge/${id}/complete`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weighbridge", "today"] });
      queryClient.invalidateQueries({
        queryKey: ["weighbridge", "production-summary"],
      });
      queryClient.invalidateQueries({
        queryKey: ["weighbridge", "history-summary"],
      });
      queryClient.invalidateQueries({ queryKey: ["weighbridge", "day"] });
    },
  });

  // UPDATE
  const updateEntryMutation = useMutation({
    mutationFn: async ({ id, updatedData }) => {
      const res = await api.patch(`/weighbridge/${id}`, updatedData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weighbridge", "today"] });
      queryClient.invalidateQueries({
        queryKey: ["weighbridge", "production-summary"],
      });
      queryClient.invalidateQueries({
        queryKey: ["weighbridge", "history-summary"],
      });
      queryClient.invalidateQueries({ queryKey: ["weighbridge", "day"] });
    },
  });

  // DELETE
  const deleteEntryMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/weighbridge/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weighbridge", "today"] });
      queryClient.invalidateQueries({
        queryKey: ["weighbridge", "production-summary"],
      });
      queryClient.invalidateQueries({
        queryKey: ["weighbridge", "history-summary"],
      });
      queryClient.invalidateQueries({ queryKey: ["weighbridge", "day"] });
    },
  });

  return {
    todayEntries: todayQuery.data?.data || [],
    todayPagination: todayQuery.data?.pagination || null,
    todayLoading: todayQuery.isLoading,
    todayError: todayQuery.error,

    productionSummary: productionSummaryQuery.data?.data || {
      daily: { totalNetWeight: 0, totalTrips: 0 },
      weekly: { totalNetWeight: 0, totalTrips: 0 },
      monthly: { totalNetWeight: 0, totalTrips: 0 },
    },
    productionLoading: productionSummaryQuery.isLoading,

    historySummary: historyQuery.data?.data || [],
    historyPagination: historyQuery.data?.pagination || null,
    historyLoading: historyQuery.isLoading,

    selectedDayEntries: selectedDayQuery.data?.data || [],
    selectedDayPagination: selectedDayQuery.data?.pagination || null,
    selectedDaySummary: selectedDayQuery.data?.summary || {
      totalNetWeight: 0,
      totalTrips: 0,
    },
    selectedDayLoading: selectedDayQuery.isLoading,

    createEntry: async (payload) => {
      try {
        return await createEntryMutation.mutateAsync(payload);
      } catch (err) {
        return {
          status: "error",
          message: getErrorMessage(err, "Failed to create entry"),
        };
      }
    },

    completeEntry: async ({ id, payload }) => {
      try {
        return await completeEntryMutation.mutateAsync({ id, payload });
      } catch (err) {
        return {
          status: "error",
          message: getErrorMessage(err, "Failed to complete entry"),
        };
      }
    },

    updateEntry: async ({ id, updatedData }) => {
      try {
        return await updateEntryMutation.mutateAsync({ id, updatedData });
      } catch (err) {
        return {
          status: "error",
          message: getErrorMessage(err, "Failed to update entry"),
        };
      }
    },

    deleteEntry: async (id) => {
      try {
        return await deleteEntryMutation.mutateAsync(id);
      } catch (err) {
        return {
          status: "error",
          message: getErrorMessage(err, "Failed to delete entry"),
        };
      }
    },

    fetchPreviousWeight,

    refetchToday: todayQuery.refetch,
    refetchHistory: historyQuery.refetch,
    refetchSelectedDay: selectedDayQuery.refetch,
  };
};