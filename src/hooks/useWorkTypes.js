import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axiosConfig';
import { useSnackbar } from 'notistack';

export const useWorkTypes = () => {
  return useQuery({
    queryKey: ['workTypes'],
    queryFn: async () => {
      const { data } = await api.get('/work-types');
      return data.data;
    },
  });
};

export const useCreateWorkType = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/work-types', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['workTypes']);
    },
    onError: (error) => {
      enqueueSnackbar(error.response?.data?.message || 'Error creating work type', { variant: 'error' });
    },
  });
};

export const useDeleteWorkType = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/work-types/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['workTypes']);
    },
    onError: (error) => {
      enqueueSnackbar(error.response?.data?.message || 'Error deleting work type', { variant: 'error' });
    },
  });
};
