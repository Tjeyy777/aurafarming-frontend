import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Grid, Typography,
  Box, IconButton, Paper, Switch,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { MACHINE_TYPES, FUEL_TYPES, STATUS_TYPES } from './machinaryutils';

const Label = ({ children }) => (
  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
    {children}
  </Typography>
);

export default function MachineForm({ open, machine, onSave, onCancel, loading }) {
  const isEdit = !!machine;
  const [form, setForm] = useState({
    machineName:            '',
    machineCode:            '',
    machineType:            'excavator',
    fuelType:               'diesel',
    currentMeterReading:    '',
    status:                 'active',
    notes:                  '',
    serviceReminderEnabled: false,
    serviceIntervalHours:   '250',
    lastServiceMeterReading: '',
  });

  useEffect(() => {
    if (open) {
      setForm({
        machineName:            machine?.machineName || '',
        machineCode:            machine?.machineCode || '',
        machineType:            machine?.machineType || 'excavator',
        fuelType:               machine?.fuelType || 'diesel',
        currentMeterReading:    machine?.currentMeterReading?.toString() || '',
        status:                 machine?.status || 'active',
        notes:                  machine?.notes || '',
        serviceReminderEnabled: machine?.serviceReminderEnabled ?? false,
        serviceIntervalHours:   machine?.serviceIntervalHours?.toString() || '250',
        lastServiceMeterReading:machine?.lastServiceMeterReading?.toString() || '',
      });
    }
  }, [open, machine]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const nextServiceDue =
    form.serviceReminderEnabled && form.lastServiceMeterReading && form.serviceIntervalHours
      ? parseFloat(form.lastServiceMeterReading) + parseFloat(form.serviceIntervalHours)
      : null;

  const valid = form.machineName.trim() && form.machineCode.trim() && form.currentMeterReading;

  const handleSubmit = () => {
    if (!valid) return;
    onSave({
      machineName:             form.machineName.trim(),
      machineCode:             form.machineCode.trim(),
      machineType:             form.machineType,
      fuelType:                form.fuelType,
      currentMeterReading:     parseFloat(form.currentMeterReading) || 0,
      status:                  form.status,
      notes:                   form.notes.trim(),
      serviceReminderEnabled:  form.serviceReminderEnabled,
      serviceIntervalHours:    form.serviceReminderEnabled ? parseFloat(form.serviceIntervalHours) || 0 : 0,
      lastServiceMeterReading: form.serviceReminderEnabled ? parseFloat(form.lastServiceMeterReading) || 0 : 0,
    });
  };

  return (
    <Dialog open={open} onClose={onCancel} fullWidth maxWidth="sm" scroll="paper">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Typography variant="h6">{isEdit ? 'Edit Machine' : 'Add Machine'}</Typography>
        <IconButton size="small" onClick={onCancel}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Label>Machine Name</Label>
            <TextField fullWidth value={form.machineName} onChange={(e) => set('machineName', e.target.value)} placeholder="CAT 320" />
          </Grid>
          <Grid item xs={6}>
            <Label>Machine Code</Label>
            <TextField fullWidth value={form.machineCode} onChange={(e) => set('machineCode', e.target.value)} placeholder="EXC-042" />
          </Grid>
          <Grid item xs={6}>
            <Label>Machine Type</Label>
            <TextField fullWidth select value={form.machineType} onChange={(e) => set('machineType', e.target.value)}>
              {MACHINE_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <Label>Fuel Type</Label>
            <TextField fullWidth select value={form.fuelType} onChange={(e) => set('fuelType', e.target.value)}>
              {FUEL_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <Label>Status</Label>
            <TextField fullWidth select value={form.status} onChange={(e) => set('status', e.target.value)}>
              {STATUS_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <Label>Current Meter Reading (hrs)</Label>
            <TextField
              fullWidth type="number"
              inputProps={{ step: '0.1', min: 0 }}
              value={form.currentMeterReading}
              onChange={(e) => set('currentMeterReading', e.target.value)}
              placeholder="0"
            />
            <Typography variant="caption" color="text.secondary">Cumulative hours on the machine meter</Typography>
          </Grid>
          <Grid item xs={12}>
            <Label>Notes</Label>
            <TextField fullWidth multiline rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Optional notes..." />
          </Grid>

          {/* Service section */}
          <Grid item xs={12}>
            <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>Service Reminder</Typography>
                  <Typography variant="caption" color="text.secondary">Track service intervals by run hours</Typography>
                </Box>
                <Switch
                  checked={form.serviceReminderEnabled}
                  onChange={(e) => set('serviceReminderEnabled', e.target.checked)}
                  color="primary"
                />
              </Box>
              {form.serviceReminderEnabled && (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Label>Interval (hrs)</Label>
                    <TextField
                      fullWidth type="number"
                      value={form.serviceIntervalHours}
                      onChange={(e) => set('serviceIntervalHours', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Label>Last Service Meter</Label>
                    <TextField
                      fullWidth type="number"
                      inputProps={{ step: '0.1' }}
                      value={form.lastServiceMeterReading}
                      onChange={(e) => set('lastServiceMeterReading', e.target.value)}
                    />
                  </Grid>
                  {nextServiceDue > 0 && (
                    <Grid item xs={12}>
                      <Paper sx={{ p: 1.5, bgcolor: 'rgba(249,115,22,0.08)', borderColor: 'rgba(249,115,22,0.2)' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Next Service Due At
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                          {nextServiceDue.toLocaleString()} hrs
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button variant="outlined" onClick={onCancel} sx={{ flex: 1 }}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!valid || loading} sx={{ flex: 1 }}>
          {loading ? 'Saving...' : isEdit ? 'Update Machine' : 'Save Machine'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}