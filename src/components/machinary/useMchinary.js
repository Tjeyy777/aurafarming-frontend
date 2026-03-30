import api from '../../api/axiosConfig'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ─── API helpers ─────────────────────────────────────────────────────────────

const machineApi = {
  getAll:          (params)          => api.get('/machines', { params }).then(r => r.data.data),
  getOne:          (id)              => api.get(`/machines/${id}`).then(r => r.data.data),
  create:          (payload)         => api.post('/machines', payload).then(r => r.data.data),
  update:          (id, payload)     => api.patch(`/machines/${id}`, payload).then(r => r.data.data),
  delete:          (id)              => api.delete(`/machines/${id}`).then(r => r.data),
  markServiceDone: (id)              => api.post(`/machines/${id}/mark-service-done`).then(r => r.data.data),

  getServiceAlerts: ()               => api.get('/machines/service-alerts').then(r => r.data.data),
  getSummary:       (machineId)      => api.get(`/machines/summary/${machineId}`).then(r => r.data.data),

  getLogs:          (params)         => api.get('/machines/logs', { params }).then(r => r.data.data),
  getLogHistory:    (machineId)      => api.get(`/machines/logs/history/${machineId}`).then(r => r.data.data),
  createLog:        (payload)        => api.post('/machines/logs', payload).then(r => r.data.data),
  updateLog:        (id, payload)    => api.patch(`/machines/logs/${id}`, payload).then(r => r.data.data),
  deleteLog:        (id)             => api.delete(`/machines/logs/${id}`).then(r => r.data),
};

// ─── Query keys ──────────────────────────────────────────────────────────────

export const KEYS = {
  machines:     (params) => ['machines', params],
  machine:      (id)     => ['machine', id],
  serviceAlerts:()       => ['serviceAlerts'],
  summary:      (id)     => ['machineSummary', id],
  logs:         (params) => ['logs', params],
  logHistory:   (id)     => ['logHistory', id],
};

// ─── Machine queries ──────────────────────────────────────────────────────────

export const useMachines = (params = {}) =>
  useQuery({
    queryKey: KEYS.machines(params),
    queryFn:  async () => {
      const res = await machineApi.getAll(params);
      console.log('🔍 machines response:', res);
      return res;
    },
    staleTime: 30_000,
  });

export const useMachine = (id) =>
  useQuery({
    queryKey: KEYS.machine(id),
    queryFn:  () => machineApi.getOne(id),
    enabled:  !!id,
    staleTime: 30_000,
  });

export const useServiceAlerts = () =>
  useQuery({
    queryKey: KEYS.serviceAlerts(),
    queryFn:  machineApi.getServiceAlerts,
    staleTime: 30_000,
  });

export const useMachineSummary = (machineId) =>
  useQuery({
    queryKey: KEYS.summary(machineId),
    queryFn:  () => machineApi.getSummary(machineId),
    enabled:  !!machineId,
    staleTime: 30_000,
  });

// ─── Machine mutations ────────────────────────────────────────────────────────

export const useCreateMachine = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => machineApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['machines'] });
      qc.invalidateQueries({ queryKey: KEYS.serviceAlerts() });
    },
  });
};

export const useUpdateMachine = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => machineApi.update(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['machines'] });
      qc.invalidateQueries({ queryKey: KEYS.machine(id) });
      qc.invalidateQueries({ queryKey: KEYS.serviceAlerts() });
    },
  });
};

export const useDeleteMachine = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => machineApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['machines'] });
      qc.invalidateQueries({ queryKey: KEYS.serviceAlerts() });
    },
  });
};

export const useMarkServiceDone = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => machineApi.markServiceDone(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['machines'] });
      qc.invalidateQueries({ queryKey: KEYS.machine(id) });
      qc.invalidateQueries({ queryKey: KEYS.serviceAlerts() });
    },
  });
};

// ─── Log queries ──────────────────────────────────────────────────────────────

export const useLogs = (params = {}) =>
  useQuery({
    queryKey: KEYS.logs(params),
    queryFn:  () => machineApi.getLogs(params),
    staleTime: 30_000,
  });

export const useLogHistory = (machineId) =>
  useQuery({
    queryKey: KEYS.logHistory(machineId),
    queryFn:  () => machineApi.getLogHistory(machineId),
    enabled:  !!machineId,
    staleTime: 30_000,
  });

// ─── Log mutations ────────────────────────────────────────────────────────────

export const useCreateLog = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => machineApi.createLog(payload),
    onSuccess: (_, payload) => {
      qc.invalidateQueries({ queryKey: ['machines'] });
      qc.invalidateQueries({ queryKey: KEYS.machine(payload.machineId) });
      qc.invalidateQueries({ queryKey: KEYS.logHistory(payload.machineId) });
      qc.invalidateQueries({ queryKey: KEYS.summary(payload.machineId) });
      qc.invalidateQueries({ queryKey: KEYS.serviceAlerts() });
    },
  });
};

export const useUpdateLog = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => machineApi.updateLog(id, payload),
    onSuccess: (_, { machineId }) => {
      qc.invalidateQueries({ queryKey: ['machines'] });
      if (machineId) {
        qc.invalidateQueries({ queryKey: KEYS.machine(machineId) });
        qc.invalidateQueries({ queryKey: KEYS.logHistory(machineId) });
        qc.invalidateQueries({ queryKey: KEYS.summary(machineId) });
      }
    },
  });
};

export const useDeleteLog = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => machineApi.deleteLog(id),
    onSuccess: (_, { machineId }) => {
      qc.invalidateQueries({ queryKey: ['machines'] });
      if (machineId) {
        qc.invalidateQueries({ queryKey: KEYS.machine(machineId) });
        qc.invalidateQueries({ queryKey: KEYS.logHistory(machineId) });
        qc.invalidateQueries({ queryKey: KEYS.summary(machineId) });
      }
    },
  });
};