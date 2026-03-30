import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axiosConfig';

export const useEmployees = () => {
  const queryClient = useQueryClient();

  // Fetching Employees
  const employeesQuery = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await api.get('/employees');
      // Accessing .data.data because of your Express controller structure
      return response.data.data; 
    },
  });

  // Creating Employee
  const addEmployeeMutation = useMutation({
    mutationFn: async (newEmp) => {
      const response = await api.post('/employees', newEmp);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['employees']);
    }
  });
  // DELETE: Remove from MongoDB
  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/employees/${id}`);
    },
    onSuccess: () => {
      // Refresh the list immediately after deleting
      queryClient.invalidateQueries(['employees']);
    }
  });

  const updateEmployeeMutation = useMutation({
  mutationFn: async ({ id, updatedData }) => {
    const response = await api.patch(`/employees/${id}`, updatedData);
    return response.data.data;
  },
  onSuccess: () => queryClient.invalidateQueries(['employees']),
});

  return { 
    ...employeesQuery, 
    addEmployee: addEmployeeMutation.mutate,
    updateEmployee: updateEmployeeMutation.mutate,
    deleteEmployee: deleteEmployeeMutation.mutate,
    isAdding: addEmployeeMutation.isPending 
  };
};