import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axiosConfig';

export const useEmployees = () => {
  const queryClient = useQueryClient();

  // 🔹 GET Employees
  const employeesQuery = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await api.get('/employees');
      return res.data.data;
    },
  });

  // 🔹 GET Roles
  const rolesQuery = useQuery({
    queryKey: ['employee-roles'],
    queryFn: async () => {
      const res = await api.get('/employees/roles');
      return res.data.data;
    },
  });

  // 🔹 SYNC BIOMETRIC
  const syncBiometricMutation = useMutation({
    mutationFn: async ({ fromDate, toDate }) => {
      const res = await api.post(
        `/attendance/sync-biometric?fromDate=${fromDate}&toDate=${toDate}`
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['employees']);
    },
  });

  // 🔹 ROLE MUTATIONS
  const addRoleMutation = useMutation({
    mutationFn: (data) => api.post('/employees/roles', data),
    onSuccess: () => queryClient.invalidateQueries(['employee-roles']),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, updatedData }) =>
      api.patch(`/employees/roles/${id}`, updatedData),
    onSuccess: () => queryClient.invalidateQueries(['employee-roles']),
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id) => api.delete(`/employees/roles/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['employee-roles']),
  });

  // 🔹 EMPLOYEE MUTATIONS
  const addEmployeeMutation = useMutation({
    mutationFn: (data) => api.post('/employees', data),
    onSuccess: () => queryClient.invalidateQueries(['employees']),
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: ({ id, updatedData }) =>
      api.patch(`/employees/${id}`, updatedData),
    onSuccess: () => queryClient.invalidateQueries(['employees']),
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: (id) => api.delete(`/employees/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['employees']),
  });

  const reactivateEmployeeMutation = useMutation({
    mutationFn: (id) => api.patch(`/employees/${id}`, { isActive: true }),
    onSuccess: () => queryClient.invalidateQueries(['employees']),
  });

  return {
    employees: employeesQuery.data || [],
    roles: rolesQuery.data || [],
    isLoading: employeesQuery.isLoading,
    isLoadingRoles: rolesQuery.isLoading,

    // actions
    addEmployee: addEmployeeMutation.mutate,
    updateEmployee: updateEmployeeMutation.mutate,
    deleteEmployee: deleteEmployeeMutation.mutate,
    deactivateEmployee: deleteEmployeeMutation.mutate,
    reactivateEmployee: reactivateEmployeeMutation.mutate,

    addRole: addRoleMutation.mutateAsync,
    updateRole: updateRoleMutation.mutate,
    deleteRole: deleteRoleMutation.mutate,

    syncBiometric: syncBiometricMutation.mutateAsync,
    isSyncing: syncBiometricMutation.isPending,
  };
};