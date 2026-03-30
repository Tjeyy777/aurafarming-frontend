import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, Box, IconButton, Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const Label = ({ children }) => (
  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
    {children}
  </Typography>
);

export default function DailyMeterForm({ open, machine, existingLog, onSave, onCancel, loading }) {
  const isEdit = !!existingLog;
  const openingMeter = isEdit
    ? existingLog.openingMeterReading
    : (machine?.currentMeterReading || 0);

  const [date, setDate] = useState('');
  const [closingMeter, setClosingMeter] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      if (existingLog?.date) {
        setDate(new Date(existingLog.date).toISOString().split('T')[0]);
      } else {
        const d = new Date();
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        setDate(d.toISOString().split('T')[0]);
      }
      setClosingMeter(existingLog?.closingMeterReading?.toString() || '');
      setNotes(existingLog?.notes || '');
    }
  }, [open, machine, existingLog]);

  const closingVal   = parseFloat(closingMeter) || 0;
  const hoursWorked  = closingVal > openingMeter ? closingVal - openingMeter : 0;
  const isRented     = machine?.ownershipType === 'rented';
  const operatingCost = isRented && machine?.hourlyRate ? hoursWorked * machine.hourlyRate : 0;
  const hasError     = closingMeter !== '' && closingVal < openingMeter;
  const isValid      = closingMeter && closingVal >= openingMeter;

  const handleSubmit = () => {
    if (!isValid) return;
    onSave({
      machineId: machine?._id,
      date,
      closingMeterReading: closingVal,
      notes: notes.trim(),
      ...(isEdit ? { openingMeterReading: openingMeter } : {}),
    });
  };

  return (
    <Dialog open={open} onClose={onCancel} fullWidth maxWidth="xs">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Typography variant="h6">{isEdit ? 'Edit Meter Log' : 'Add Daily Meter Update'}</Typography>
        <IconButton size="small" onClick={onCancel}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {machine && (
          <Paper sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.04)' }}>
            <Typography variant="caption" color="text.secondary">Machine</Typography>
            <Typography variant="body2" fontWeight={600}>
              {machine.machineName}{' '}
              <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                ({machine.machineCode})
              </Box>
            </Typography>
          </Paper>
        )}

        <Box>
          <Label>Date</Label>
          <TextField fullWidth type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Box>

        <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.04)' }}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Previous Meter Reading
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', mt: 0.5 }}>
            {openingMeter.toLocaleString()}{' '}
            <Box component="span" sx={{ fontSize: '0.85rem', color: 'text.secondary', fontWeight: 400 }}>hrs</Box>
          </Typography>
        </Paper>

        <Box>
          <Label>New Current Meter Reading</Label>
          <TextField
            fullWidth
            type="number"
            inputProps={{ step: '0.1' }}
            value={closingMeter}
            onChange={(e) => setClosingMeter(e.target.value)}
            placeholder={openingMeter.toString()}
            error={hasError}
            helperText={hasError ? `New reading must be ≥ previous reading (${openingMeter})` : ''}
            autoFocus
            sx={{
              '& .MuiOutlinedInput-root input': {
                fontSize: '1.6rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums',
              },
            }}
          />
        </Box>

        {closingMeter && !hasError && hoursWorked > 0 && (
          <Paper sx={{ p: 2, bgcolor: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.25)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="success.main" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                Hours Worked
              </Typography>
              <Typography variant="h6" sx={{ color: 'success.main', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {hoursWorked.toFixed(1)} hrs
              </Typography>
            </Box>
            {isRented && operatingCost > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, pt: 1, borderTop: '1px solid rgba(16,185,129,0.2)' }}>
                <Typography variant="caption" color="success.main" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                  Operating Cost
                </Typography>
                <Typography variant="h6" sx={{ color: 'success.main', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                  ₹{operatingCost.toLocaleString()}
                </Typography>
              </Box>
            )}
          </Paper>
        )}

        <Box>
          <Label>Notes</Label>
          <TextField fullWidth value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional..." />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button variant="outlined" onClick={onCancel} sx={{ flex: 1 }}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!isValid || loading} sx={{ flex: 1 }}>
          {loading ? 'Saving...' : isEdit ? 'Update Log' : 'Save Daily Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}