import api from '../api/axiosConfig';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ─── API helpers ─────────────────────────────────────────────────────────────

const rentedApi = {
  // Vehicles
  getAllVehicles: (params) => api.get('/rented-machines/vehicles', { params }).then(r => r.data.data),
  getVehicle: (id) => api.get(`/rented-machines/vehicles/${id}`).then(r => r.data.data),
  createVehicle: (payload) => api.post('/rented-machines/vehicles', payload).then(r => r.data.data),
  updateVehicle: (id, payload) => api.patch(`/rented-machines/vehicles/${id}`, payload).then(r => r.data.data),
  deleteVehicle: (id) => api.delete(`/rented-machines/vehicles/${id}`).then(r => r.data),

  // Logs
  getLogs: (params) => api.get('/rented-machines/logs', { params }).then(r => r.data.data),
  createLog: (payload) => api.post('/rented-machines/logs', payload).then(r => r.data.data),
  updateLog: (id, payload) => api.patch(`/rented-machines/logs/${id}`, payload).then(r => r.data.data),
  deleteLog: (id) => api.delete(`/rented-machines/logs/${id}`).then(r => r.data),

  // Trips
  createTrip: (payload) => api.post('/rented-machines/logs/create-trip', payload).then(r => r.data.data),

  // Summary
  getSummary: (params) => api.get('/rented-machines/summary', { params }).then(r => r.data.data),
};

// ─── Query keys ──────────────────────────────────────────────────────────────

const KEYS = {
  vehicles: (params) => ['rentedVehicles', params],
  vehicle: (id) => ['rentedVehicle', id],
  logs: (params) => ['rentedLogs', params],
  summary: (params) => ['rentedSummary', params],
};

// ─── Vehicle queries ─────────────────────────────────────────────────────────

export const useRentedVehicles = (params = {}) =>
  useQuery({
    queryKey: KEYS.vehicles(params),
    queryFn: () => rentedApi.getAllVehicles(params),
    staleTime: 30_000,
  });

export const useRentedVehicle = (id) =>
  useQuery({
    queryKey: KEYS.vehicle(id),
    queryFn: () => rentedApi.getVehicle(id),
    enabled: !!id,
    staleTime: 30_000,
  });

// ─── Vehicle mutations ───────────────────────────────────────────────────────

export const useCreateRentedVehicle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => rentedApi.createVehicle(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rentedVehicles'] });
    },
  });
};

export const useUpdateRentedVehicle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => rentedApi.updateVehicle(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['rentedVehicles'] });
      qc.invalidateQueries({ queryKey: KEYS.vehicle(id) });
    },
  });
};

export const useDeleteRentedVehicle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => rentedApi.deleteVehicle(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rentedVehicles'] });
    },
  });
};

// ─── Log queries ─────────────────────────────────────────────────────────────

export const useRentedLogs = (params = {}) =>
  useQuery({
    queryKey: KEYS.logs(params),
    queryFn: () => rentedApi.getLogs(params),
    staleTime: 30_000,
  });

// ─── Log mutations ───────────────────────────────────────────────────────────

export const useCreateRentedLog = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => rentedApi.createLog(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rentedLogs'] });
      qc.invalidateQueries({ queryKey: ['rentedSummary'] });
    },
  });
};

export const useUpdateRentedLog = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => rentedApi.updateLog(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rentedLogs'] });
      qc.invalidateQueries({ queryKey: ['rentedSummary'] });
    },
  });
};

export const useDeleteRentedLog = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => rentedApi.deleteLog(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rentedLogs'] });
      qc.invalidateQueries({ queryKey: ['rentedSummary'] });
    },
  });
};

// ─── Trip mutations ──────────────────────────────────────────────────────────

export const useCreateTrip = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => rentedApi.createTrip(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rentedLogs'] });
      qc.invalidateQueries({ queryKey: ['rentedSummary'] });
    },
  });
};

// ─── Summary queries ─────────────────────────────────────────────────────────

export const useRentedSummary = (params = {}) =>
  useQuery({
    queryKey: KEYS.summary(params),
    queryFn: () => rentedApi.getSummary(params),
    staleTime: 30_000,
  });