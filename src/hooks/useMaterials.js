import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axiosConfig';
import { useSnackbar } from 'notistack';

export const useMaterials = () => {
  return useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const { data } = await api.get('/materials');
      return data.data;
    },
  });
};

export const useCreateMaterial = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/materials', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['materials']);
    },
    onError: (error) => {
      enqueueSnackbar(error.response?.data?.message || 'Error creating material', { variant: 'error' });
    },
  });
};

export const useUpdateMaterial = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await api.patch(`/materials/${id}`, payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['materials']);
    },
    onError: (error) => {
      enqueueSnackbar(error.response?.data?.message || 'Error updating material', { variant: 'error' });
    },
  });
};

export const useDeleteMaterial = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/materials/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['materials']);
    },
    onError: (error) => {
      enqueueSnackbar(error.response?.data?.message || 'Error deleting material', { variant: 'error' });
    },
  });
};
