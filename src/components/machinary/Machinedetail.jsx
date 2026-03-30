import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, IconButton, AppBar, Toolbar, Paper,
  Grid, Tab, Tabs, LinearProgress, CircularProgress, Divider, Tooltip, alpha
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import SpeedIcon from '@mui/icons-material/Speed';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import EditNoteIcon from '@mui/icons-material/EditNote';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSnackbar } from 'notistack';

import {
  useMachine, useLogHistory, useMachineSummary,
  useUpdateMachine, useDeleteMachine, useMarkServiceDone,
  useCreateLog, useUpdateLog, useDeleteLog,
} from './useMchinary';
import { getServiceStatus, getRemainingHours, getServiceProgressColor, formatMachineType } from './machinaryutils';
import StatusChip from './Statuschip';
import MachineForm from './MachineForm';
import DailyMeterForm from './DilymeterForm';
import { DeleteConfirmModal, ServiceDoneModal } from './Modals';

const InfoRow = ({ label, value }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={600} sx={{ mt: 0.25 }}>{value}</Typography>
  </Box>
);

export default function MachineDetail({ machineId, onBack }) {
  const params = useParams();
  const id = machineId || params.id;
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [tab,              setTab]              = useState(0);
  const [showAddLog,       setShowAddLog]       = useState(false);
  const [editLog,          setEditLog]          = useState(null);
  const [deleteLogTarget,  setDeleteLogTarget]  = useState(null);
  const [showEdit,         setShowEdit]         = useState(false);
  const [showDelete,       setShowDelete]       = useState(false);
  const [showServiceDone,  setShowServiceDone]  = useState(false);

  const { data: machine,     isLoading } = useMachine(id);
  const { data: logs = [] }              = useLogHistory(id);
  const { data: summaryData }            = useMachineSummary(id);

  const updateMachine  = useUpdateMachine();
  const deleteMachine  = useDeleteMachine();
  const markServiceDone= useMarkServiceDone();
  const createLog      = useCreateLog();
  const updateLog      = useUpdateLog();
  const deleteLog      = useDeleteLog();

  if (isLoading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <CircularProgress />
    </Box>
  );

  if (!machine) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column', gap: 2 }}>
      <Typography color="text.secondary">Machine not found</Typography>
      <Button variant="outlined" onClick={() => onBack ? onBack() : navigate('/machinery')}>Back to Dashboard</Button>
    </Box>
  );

  const serviceStatus  = getServiceStatus(machine);
  const remaining      = getRemainingHours(machine);
  const serviceProgress = machine.serviceReminderEnabled
    ? Math.min(100, Math.max(0, ((machine.currentMeterReading - (machine.lastServiceMeterReading || (machine.currentMeterReading - machine.serviceIntervalHours))) / machine.serviceIntervalHours) * 100))
    : 0;
  const progressColor = machine.serviceReminderEnabled 
    ? getServiceProgressColor(serviceStatus) 
    : 'gray';
  const summary = summaryData?.summary || {};

  const handleUpdateMachine = async (payload) => {
    try {
      await updateMachine.mutateAsync({ id, payload });
      enqueueSnackbar('Machine updated', { variant: 'success' });
      setShowEdit(false);
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || 'Failed to update machine', { variant: 'error' });
    }
  };
  const handleDeleteMachine = async () => {
    try {
      await deleteMachine.mutateAsync(id);
      enqueueSnackbar('Machine deleted', { variant: 'success' });
      if (onBack) onBack(); else navigate('/machinery');
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || 'Failed to delete machine', { variant: 'error' });
    }
  };
  const handleMarkService = async () => {
    try {
      await markServiceDone.mutateAsync(id);
      enqueueSnackbar('Service marked complete', { variant: 'success' });
      setShowServiceDone(false);
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || 'Failed to mark service complete', { variant: 'error' });
    }
  };
  const handleSaveLog = async (payload) => {
    try {
      await createLog.mutateAsync(payload);
      enqueueSnackbar('Meter update saved', { variant: 'success' });
      setShowAddLog(false);
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || 'Failed to save meter update', { variant: 'error' });
    }
  };
  const handleUpdateLog = async (payload) => {
    try {
      if (!editLog?._id) return;
      await updateLog.mutateAsync({ id: editLog._id, payload, machineId: id });
      enqueueSnackbar('Log updated', { variant: 'success' });
      setEditLog(null);
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || 'Failed to update log', { variant: 'error' });
    }
  };
  const handleDeleteLog = async () => {
    try {
      if (!deleteLogTarget?._id) return;
      await deleteLog.mutateAsync({ id: deleteLogTarget._id, machineId: id });
      enqueueSnackbar('Log deleted', { variant: 'success' });
      setDeleteLogTarget(null);
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || 'Failed to delete log', { variant: 'error' });
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" sx={{ bgcolor: 'background.paper' }}>
        <Toolbar sx={{ maxWidth: 860, width: '100%', mx: 'auto', px: { xs: 2, sm: 3 }, gap: 1.5, minHeight: '60px !important' }}>
          <IconButton size="small" onClick={() => onBack ? onBack() : navigate('/machinery')}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body1" fontWeight={700} noWrap>{machine.machineName}</Typography>
            <Typography variant="caption" color="text.secondary">{machine.machineCode}</Typography>
          </Box>
          <StatusChip status={machine.status} type="machine" />
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 860, mx: 'auto', px: { xs: 2, sm: 3 }, py: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Summary Card */}
        <Paper sx={{ p: 2.5, borderRadius: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}><InfoRow label="Type"      value={formatMachineType(machine.machineType)} /></Grid>
            <Grid item xs={6} sm={3}><InfoRow label="Ownership" value={machine.ownershipType === 'rented' ? 'Rented' : 'Owned'} /></Grid>
            <Grid item xs={6} sm={3}><InfoRow label="Fuel"      value={machine.fuelType} /></Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Meter Reading
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mt: 0.25 }}>
                <Typography variant="h5" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {machine.currentMeterReading?.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">hrs</Typography>
              </Box>
            </Grid>
            {machine.ownershipType === 'rented' && machine.hourlyRate > 0 && (
              <Grid item xs={6} sm={3}><InfoRow label="Hourly Rate" value={`₹${machine.hourlyRate}/hr`} /></Grid>
            )}
            {machine.serviceReminderEnabled && (
              <Grid item xs={12} sm={3} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Tooltip title={remaining > 0 ? `${remaining.toLocaleString()} hrs remaining` : `Overdue by ${Math.abs(remaining).toLocaleString()} hrs`} arrow placement="top">
                  <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                    <CircularProgress
                      variant="determinate"
                      value={100}
                      size={86}
                      thickness={4.5}
                      sx={{ color: alpha(progressColor, 0.15), position: 'absolute' }}
                    />
                    <CircularProgress
                      variant="determinate"
                      value={serviceProgress}
                      size={86}
                      thickness={4.5}
                      sx={{ color: progressColor, strokeLinecap: 'round' }}
                    />
                    <Box
                      sx={{
                        top: 0, left: 0, bottom: 0, right: 0,
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column'
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 700, color: progressColor, lineHeight: 1 }}>
                        {Math.round(serviceProgress)}%
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                        Used
                      </Typography>
                    </Box>
                  </Box>
                </Tooltip>
              </Grid>
            )}
          </Grid>
          {machine.notes && (
            <Typography variant="body2" color="text.secondary"
              sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              {machine.notes}
            </Typography>
          )}
        </Paper>

        {/* Action buttons */}
        <Grid container spacing={1.5}>
          <Grid item xs={6} sm={3}>
            <Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={() => setShowAddLog(true)} sx={{ height: 44 }}>
              Meter Update
            </Button>
          </Grid>
          {machine.serviceReminderEnabled && (
            <Grid item xs={6} sm={3}>
              <Button fullWidth variant="outlined" startIcon={<CheckCircleOutlineRoundedIcon />}
                onClick={() => setShowServiceDone(true)}
                sx={{ height: 44, color: 'success.main', borderColor: 'rgba(16,185,129,0.4)', '&:hover': { bgcolor: 'rgba(16,185,129,0.08)', borderColor: 'success.main' } }}>
                Service Done
              </Button>
            </Grid>
          )}
          <Grid item xs={6} sm={3}>
            <Button fullWidth variant="outlined" startIcon={<EditOutlinedIcon />} onClick={() => setShowEdit(true)} sx={{ height: 44 }}>
              Edit
            </Button>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button fullWidth variant="outlined" color="error" startIcon={<DeleteOutlineRoundedIcon />} onClick={() => setShowDelete(true)} sx={{ height: 44 }}>
              Delete
            </Button>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Box>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
            <Tab label="Logs" />
            <Tab label="Service" />
            <Tab label="Summary" />
          </Tabs>

          {/* Logs */}
          {tab === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {logs.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <SpeedIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">No daily logs yet</Typography>
                </Box>
              ) : logs.map((log) => (
                <Paper key={log._id} sx={{ p: 2, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {new Date(log.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2.5, mt: 0.75 }}>
                        <Typography variant="caption" color="text.secondary">
                          Open: <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>{log.openingMeterReading?.toLocaleString()}</Box>
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Close: <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>{log.closingMeterReading?.toLocaleString()}</Box>
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h6" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                        {log.totalHoursWorked?.toFixed(1)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">hrs worked</Typography>
                    </Box>
                  </Box>
                  {log.operatingCost > 0 && (
                    <Typography variant="body2" fontWeight={600} color="primary.main" sx={{ mt: 1 }}>
                      ₹{log.operatingCost?.toLocaleString()}
                    </Typography>
                  )}
                  {log.notes && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      {log.notes}
                    </Typography>
                  )}
                  <Divider sx={{ my: 1.5 }} />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" startIcon={<EditNoteIcon fontSize="small" />} onClick={() => setEditLog(log)} sx={{ fontSize: '0.72rem' }}>
                      Edit
                    </Button>
                    <Button size="small" color="error" startIcon={<DeleteIcon fontSize="small" />} onClick={() => setDeleteLogTarget(log)} sx={{ fontSize: '0.72rem' }}>
                      Delete
                    </Button>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}

          {/* Service */}
          {tab === 1 && (
            <Box>
              {!machine.serviceReminderEnabled ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <BuildOutlinedIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">Service reminders are disabled</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={6}><InfoRow label="Last Service"  value={`${machine.lastServiceMeterReading?.toLocaleString()} hrs`} /></Grid>
                      <Grid item xs={6}><InfoRow label="Interval"      value={`${machine.serviceIntervalHours?.toLocaleString()} hrs`} /></Grid>
                      <Grid item xs={6}><InfoRow label="Next Due At"   value={`${machine.nextServiceDueAt?.toLocaleString()} hrs`} /></Grid>
                      <Grid item xs={6}><InfoRow label="Current Meter" value={`${machine.currentMeterReading?.toLocaleString()} hrs`} /></Grid>
                    </Grid>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <StatusChip status={serviceStatus} size="medium" />
                      <Typography variant="body2" fontWeight={600} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {remaining > 0
                          ? `${remaining.toLocaleString()} hrs remaining`
                          : `${Math.abs(remaining).toLocaleString()} hrs overdue`}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(serviceProgress, 100)}
                      sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.08)', '& .MuiLinearProgress-bar': { bgcolor: getServiceProgressColor(serviceStatus) } }}
                    />
                  </Paper>
                  <Button fullWidth variant="contained" startIcon={<CheckCircleOutlineRoundedIcon />}
                    onClick={() => setShowServiceDone(true)}
                    sx={{ height: 48, bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}>
                    Mark Service Done
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {/* Summary */}
          {tab === 2 && (
            <Grid container spacing={1.5}>
              {[
                { label: 'Total Hours',  value: `${(summary.totalHoursWorked || 0).toFixed(1)}` },
                { label: 'Total Logs',   value: summary.totalLogs || 0 },
                { label: 'Current Meter',value: `${machine.currentMeterReading?.toLocaleString()}` },
                ...(machine.ownershipType === 'rented'
                  ? [{ label: 'Total Cost', value: `₹${(summary.totalOperatingCost || 0).toLocaleString()}` }]
                  : []),
              ].map((s) => (
                <Grid item xs={6} key={s.label}>
                  <Paper sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {s.label}
                    </Typography>
                    <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5, fontVariantNumeric: 'tabular-nums' }}>
                      {s.value}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Box>

      {/* Modals */}
      <MachineForm    open={showEdit}    machine={machine} onSave={handleUpdateMachine} onCancel={() => setShowEdit(false)}       loading={updateMachine.isPending} />
      <DailyMeterForm open={showAddLog}  machine={machine} onSave={handleSaveLog}       onCancel={() => setShowAddLog(false)}     loading={createLog.isPending} />
      <DailyMeterForm open={!!editLog}   machine={machine} existingLog={editLog}        onSave={handleUpdateLog}  onCancel={() => setEditLog(null)}       loading={updateLog.isPending} />
      <ServiceDoneModal open={showServiceDone} machine={machine} onConfirm={handleMarkService} onCancel={() => setShowServiceDone(false)} loading={markServiceDone.isPending} />
      <DeleteConfirmModal
        open={!!deleteLogTarget}
        title="Delete Daily Meter Log"
        message="Are you sure you want to delete this log? This action cannot be undone."
        details={deleteLogTarget ? [
          { label: 'Date',    value: new Date(deleteLogTarget.date).toLocaleDateString('en-IN') },
          { label: 'Opening', value: `${deleteLogTarget.openingMeterReading?.toLocaleString()} hrs` },
          { label: 'Closing', value: `${deleteLogTarget.closingMeterReading?.toLocaleString()} hrs` },
          { label: 'Hours',   value: `${deleteLogTarget.totalHoursWorked?.toFixed(1)} hrs` },
        ] : []}
        confirmLabel="Delete Log"
        onConfirm={handleDeleteLog}
        onCancel={() => setDeleteLogTarget(null)}
        loading={deleteLog.isPending}
      />
      <DeleteConfirmModal
        open={showDelete}
        title="Delete Machine"
        message="This machine will be removed from active view. Historical logs will remain protected."
        details={[
          { label: 'Machine',       value: machine.machineName },
          { label: 'Code',          value: machine.machineCode },
          { label: 'Ownership',     value: machine.ownershipType },
          { label: 'Current Meter', value: `${machine.currentMeterReading?.toLocaleString()} hrs` },
        ]}
        confirmLabel="Delete Machine"
        onConfirm={handleDeleteMachine}
        onCancel={() => setShowDelete(false)}
        loading={deleteMachine.isPending}
      />
    </Box>
  );
}