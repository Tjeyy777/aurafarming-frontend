import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Button, IconButton,
  AppBar, Toolbar, Grid, CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { useSnackbar } from 'notistack';

import { useServiceAlerts, useMarkServiceDone } from './useMchinary';
import StatusChip from './Statuschip';
import { ServiceDoneModal } from './Modals';

const GROUP_CONFIG = [
  { key: 'overdue',    label: 'Overdue',      statusKey: 'overdue' },
  { key: 'serviceDue', label: 'Service Due',  statusKey: 'service_due' },
  { key: 'dueSoon',    label: 'Due Soon',     statusKey: 'due_soon' },
];

export default function ServiceAlerts({ onBack, onViewDetail }) {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [serviceTarget, setServiceTarget] = useState(null);

  const { data: alertData, isLoading } = useServiceAlerts();
  const markServiceDone = useMarkServiceDone();

  const handleMarkService = async () => {
    try {
      await markServiceDone.mutateAsync(serviceTarget._id);
      enqueueSnackbar('Service marked as complete', { variant: 'success' });
      setServiceTarget(null);
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || 'Failed to mark service complete', { variant: 'error' });
    }
  };

  const totalAlerts = alertData
    ? (alertData.overdue?.length || 0) + (alertData.serviceDue?.length || 0) + (alertData.dueSoon?.length || 0)
    : 0;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" sx={{ bgcolor: 'background.paper' }}>
        <Toolbar sx={{ maxWidth: 860, width: '100%', mx: 'auto', px: { xs: 2, sm: 3 }, gap: 1.5, minHeight: '60px !important' }}>
          <IconButton size="small" onClick={() => onBack ? onBack() : navigate('/machinery')}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Box>
            <Typography variant="body1" fontWeight={700}>Service Alerts</Typography>
            <Typography variant="caption" color="text.secondary">
              {totalAlerts} machine{totalAlerts !== 1 ? 's' : ''} need attention
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 860, mx: 'auto', px: { xs: 2, sm: 3 }, py: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : totalAlerts === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <CheckCircleRoundedIcon sx={{ fontSize: 52, color: 'success.main', mb: 1.5 }} />
            <Typography fontWeight={600}>All machines are healthy</Typography>
            <Typography variant="body2" color="text.secondary">No service alerts at this time</Typography>
          </Box>
        ) : GROUP_CONFIG.map((group) => {
          const items = alertData?.[group.key] || [];
          if (!items.length) return null;
          return (
            <Box key={group.key}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <StatusChip status={group.statusKey} size="medium" />
                <Typography variant="caption" color="text.secondary">({items.length})</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {items.map((m) => {
                  const remaining = m.nextServiceDueAt - m.currentMeterReading;
                  return (
                    <Paper key={m._id} sx={{ p: 2.5, borderRadius: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                        <Box>
                          <Typography variant="body2" fontWeight={700}>{m.machineName}</Typography>
                          <Typography variant="caption" color="text.secondary">{m.machineCode} · {m.ownershipType}</Typography>
                        </Box>
                        <StatusChip status={m.status} type="machine" />
                      </Box>
                      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Current Meter</Typography>
                          <Typography variant="body2" fontWeight={600} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                            {m.currentMeterReading?.toLocaleString()} hrs
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Next Service At</Typography>
                          <Typography variant="body2" fontWeight={600} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                            {m.nextServiceDueAt?.toLocaleString()} hrs
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="caption" color="text.secondary">{remaining > 0 ? 'Remaining' : 'Overdue By'}</Typography>
                          <Typography variant="body2" fontWeight={600}
                            color={remaining <= 0 ? 'error.main' : 'text.primary'}
                            sx={{ fontVariantNumeric: 'tabular-nums' }}>
                            {Math.abs(remaining).toLocaleString()} hrs
                          </Typography>
                        </Grid>
                      </Grid>
                      <Box sx={{ display: 'flex', gap: 1, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Button size="small" variant="outlined" startIcon={<VisibilityOutlinedIcon />}
                          onClick={() => onViewDetail ? onViewDetail(m._id) : navigate(`/machinery/${m._id}`)}>
                          View
                        </Button>
                        <Button size="small" variant="contained" startIcon={<CheckCircleOutlineRoundedIcon />}
                          onClick={() => setServiceTarget(m)}
                          sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}>
                          Service Done
                        </Button>
                      </Box>
                    </Paper>
                  );
                })}
              </Box>
            </Box>
          );
        })}
      </Box>

      <ServiceDoneModal
        open={!!serviceTarget}
        machine={serviceTarget}
        onConfirm={handleMarkService}
        onCancel={() => setServiceTarget(null)}
        loading={markServiceDone.isPending}
      />
    </Box>
  );
}