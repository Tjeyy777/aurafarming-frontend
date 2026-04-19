import { useState } from 'react';
import {
  Box, Typography, Button, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, Paper, IconButton, Chip, Stack,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { useSnackbar } from 'notistack';

import {
  useRentedVehicles,
  useCreateRentedVehicle,
  useUpdateRentedVehicle,
  useDeleteRentedVehicle,
} from '/src/hooks/useRentedMachinery';

const VEHICLE_TYPES = [
  { value: 'excavator', label: 'Excavator' },
  { value: 'loader', label: 'Loader' },
  { value: 'tipper', label: 'Tipper' },
  { value: 'dozer', label: 'Dozer' },
  { value: 'grader', label: 'Grader' },
  { value: 'other', label: 'Other' },
];

export default function RentedVehicleMasterPage() {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [form, setForm] = useState({
    vehicleNumber: '',
    vehicleType: 'excavator',
    hourlyRate: '',
    ownerName: '',
    ownerContact: '',
    notes: '',
  });

  const { data: vehicles = [], isLoading } = useRentedVehicles();
  const createVehicle = useCreateRentedVehicle();
  const updateVehicle = useUpdateRentedVehicle();
  const deleteVehicle = useDeleteRentedVehicle();

  const resetForm = () => {
    setForm({
      vehicleNumber: '',
      vehicleType: 'excavator',
      hourlyRate: '',
      ownerName: '',
      ownerContact: '',
      notes: '',
    });
    setEditingVehicle(null);
  };

  const openDialog = (vehicle = null) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setForm({
        vehicleNumber: vehicle.vehicleNumber,
        vehicleType: vehicle.vehicleType,
        hourlyRate: vehicle.hourlyRate.toString(),
        ownerName: vehicle.ownerName,
        ownerContact: vehicle.ownerContact || '',
        notes: vehicle.notes || '',
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  const handleSave = async () => {
    if (!form.vehicleNumber || !form.hourlyRate || !form.ownerName) {
      enqueueSnackbar('Please fill required fields', { variant: 'error' });
      return;
    }

    const payload = {
      vehicleNumber: form.vehicleNumber.toUpperCase(),
      vehicleType: form.vehicleType,
      hourlyRate: Number(form.hourlyRate),
      ownerName: form.ownerName,
      ownerContact: form.ownerContact,
      notes: form.notes,
    };

    try {
      if (editingVehicle) {
        await updateVehicle.mutateAsync({ id: editingVehicle._id, payload });
        enqueueSnackbar('Vehicle updated', { variant: 'success' });
      } else {
        await createVehicle.mutateAsync(payload);
        enqueueSnackbar('Vehicle added', { variant: 'success' });
      }
      closeDialog();
    } catch (error) {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to save vehicle', { variant: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this vehicle? This cannot be undone.')) return;

    try {
      await deleteVehicle.mutateAsync(id);
      enqueueSnackbar('Vehicle deleted', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to delete vehicle', { variant: 'error' });
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ bgcolor: 'primary.main', borderRadius: 2, p: 0.9, display: 'flex' }}>
              <LocalShippingIcon sx={{ fontSize: 22, color: '#fff' }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>Rented Vehicle Master</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ pl: '46px', mt: 0.5 }}>
            Manage rented vehicle database
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => openDialog()}
          sx={{ fontWeight: 700, borderRadius: 2 }}
        >
          Add Vehicle
        </Button>
      </Box>

      {/* FIX: Vehicle Grid — Grid v2 syntax */}
      <Grid container spacing={2}>
        {vehicles.map((vehicle) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={vehicle._id}>
            <Paper sx={{ p: 2.5, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {vehicle.vehicleNumber}
                  </Typography>
                  <Chip
                    label={vehicle.vehicleType}
                    size="small"
                    sx={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'capitalize' }}
                  />
                </Box>
                <Stack direction="row" spacing={0.5}>
                  <IconButton size="small" onClick={() => openDialog(vehicle)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(vehicle._id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Box>

              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
                    Hourly Rate
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                    ₹{vehicle.hourlyRate.toLocaleString()}/hr
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
                    Owner
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {vehicle.ownerName}
                  </Typography>
                  {vehicle.ownerContact && (
                    <Typography variant="caption" color="text.secondary">
                      {vehicle.ownerContact}
                    </Typography>
                  )}
                </Box>
                {vehicle.notes && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                    {vehicle.notes}
                  </Typography>
                )}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
        </DialogTitle>
        <DialogContent>
          {/* FIX: Dialog form Grid — Grid v2 syntax */}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Vehicle Number *"
                value={form.vehicleNumber}
                onChange={(e) => setForm(p => ({ ...p, vehicleNumber: e.target.value.toUpperCase() }))}
                placeholder="KL-01-1234"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                select
                label="Vehicle Type *"
                value={form.vehicleType}
                onChange={(e) => setForm(p => ({ ...p, vehicleType: e.target.value }))}
                SelectProps={{ native: true }}
              >
                {VEHICLE_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Hourly Rate (₹) *"
                value={form.hourlyRate}
                onChange={(e) => setForm(p => ({ ...p, hourlyRate: e.target.value }))}
                placeholder="1500"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Owner Name *"
                value={form.ownerName}
                onChange={(e) => setForm(p => ({ ...p, ownerName: e.target.value }))}
                placeholder="ABC Rentals"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Owner Contact"
                value={form.ownerContact}
                onChange={(e) => setForm(p => ({ ...p, ownerContact: e.target.value }))}
                placeholder="+91 9876543210"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Notes"
                value={form.notes}
                onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Optional notes..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={closeDialog} sx={{ fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={createVehicle.isPending || updateVehicle.isPending}
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            {editingVehicle ? 'Update' : 'Add Vehicle'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}