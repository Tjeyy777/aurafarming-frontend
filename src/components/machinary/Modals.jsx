import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, IconButton, Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';

// ─── Delete Confirm Modal ────────────────────────────────────────────────────

export function DeleteConfirmModal({ open, title, message, details = [], confirmLabel, onConfirm, onCancel, loading }) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 38, height: 38, borderRadius: '50%', bgcolor: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <WarningAmberRoundedIcon sx={{ color: 'error.main', fontSize: 20 }} />
          </Box>
          <Typography variant="h6">{title}</Typography>
        </Box>
        <IconButton size="small" onClick={onCancel}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{message}</Typography>
        {details.length > 0 && (
          <Paper sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.04)' }}>
            {details.map((d, i) => (
              <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <Typography variant="body2" color="text.secondary">{d.label}</Typography>
                <Typography variant="body2" fontWeight={600}>{d.value}</Typography>
              </Box>
            ))}
          </Paper>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button variant="outlined" onClick={onCancel} sx={{ flex: 1 }}>Cancel</Button>
        <Button variant="contained" color="error" onClick={onConfirm} disabled={loading} sx={{ flex: 1 }}>
          {loading ? 'Deleting...' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Service Done Modal ──────────────────────────────────────────────────────

export function ServiceDoneModal({ open, machine, onConfirm, onCancel, loading }) {
  if (!machine) return null;
  const newNext = parseFloat(machine.currentMeterReading || 0) + parseFloat(machine.serviceIntervalHours || 0);

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 38, height: 38, borderRadius: '50%', bgcolor: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircleOutlineRoundedIcon sx={{ color: 'success.main', fontSize: 20 }} />
          </Box>
          <Typography variant="h6">Mark Service Done</Typography>
        </Box>
        <IconButton size="small" onClick={onCancel}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Confirm that service has been completed for <strong>{machine.machineName}</strong>.
        </Typography>
        <Paper sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.04)', mb: 1.5 }}>
          {[
            { label: 'Current Meter',      value: `${machine.currentMeterReading?.toLocaleString()} hrs` },
            { label: 'Last Service Meter', value: `${machine.lastServiceMeterReading?.toLocaleString()} hrs` },
            { label: 'Service Interval',   value: `${machine.serviceIntervalHours?.toLocaleString()} hrs` },
          ].map((d, i) => (
            <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
              <Typography variant="body2" color="text.secondary">{d.label}</Typography>
              <Typography variant="body2" fontWeight={600}>{d.value}</Typography>
            </Box>
          ))}
        </Paper>
        <Paper sx={{ p: 1.5, bgcolor: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.25)' }}>
          <Typography variant="caption" color="success.main" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
            After Confirmation
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="body2" color="success.main">New next service due at</Typography>
            <Typography variant="body2" fontWeight={700} color="success.main" sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {newNext.toLocaleString()} hrs
            </Typography>
          </Box>
        </Paper>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button variant="outlined" onClick={onCancel} sx={{ flex: 1 }}>Cancel</Button>
        <Button variant="contained" onClick={onConfirm} disabled={loading}
          sx={{ flex: 1, bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}>
          {loading ? 'Saving...' : 'Confirm Service Done'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}