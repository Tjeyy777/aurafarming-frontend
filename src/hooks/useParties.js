import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axiosConfig';
import { useSnackbar } from 'notistack';

export const useParties = () => {
  return useQuery({
    queryKey: ['parties'],
    queryFn: async () => {
      const { data } = await api.get('/parties');
      return data.data;
    },
  });
};

export const useCreateParty = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/parties', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['parties']);
    },
    onError: (error) => {
      enqueueSnackbar(error.response?.data?.message || 'Error creating party', { variant: 'error' });
    },
  });
};

export const useUpdateParty = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const { data } = await api.patch(`/parties/${id}`, payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['parties']);
    },
    onError: (error) => {
      enqueueSnackbar(error.response?.data?.message || 'Error updating party', { variant: 'error' });
    },
  });
};

export const useDeleteParty = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/parties/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['parties']);
    },
    onError: (error) => {
      enqueueSnackbar(error.response?.data?.message || 'Error deleting party', { variant: 'error' });
    },
  });
};
