import { useState, useMemo } from 'react';
import {
  Box, Typography, Button, Grid, Fab, CircularProgress,Stack, Alert, Paper, useTheme
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import { useSnackbar } from 'notistack';

import {
  useMachines, useCreateMachine, useUpdateMachine,
  useDeleteMachine, useMarkServiceDone, useCreateLog,
} from './useMchinary';
import { getServiceStatus } from './machinaryutils';
import StatsCards from './Statuscard';
import MachineFilters from './Machinefilter';
import MachineCard from './Machinecard';
import MachineForm from './MachineForm';
import DailyMeterForm from './DilymeterForm';
import { DeleteConfirmModal, ServiceDoneModal } from './Modals';
import MachineDetail from './Machinedetail';
import ServiceAlerts from './Servicealerts';
import MachineryReports from './Machinaryreports';

function MachineryDashboardView({ onNavigate }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { enqueueSnackbar } = useSnackbar();

  // Filter States
  const [search, setSearch] = useState('');
  const [ownershipFilter, setOwnershipFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [serviceFilter, setServiceFilter] = useState('All');

  // Modal States
  const [showAddMachine, setShowAddMachine] = useState(false);
  const [editMachine, setEditMachine] = useState(null);
  const [addLogMachine, setAddLogMachine] = useState(null);
  const [deleteMachineTarget, setDeleteMachineTarget] = useState(null);
  const [serviceMachineTarget, setServiceMachineTarget] = useState(null);

  const { data: machines = [], isLoading, error } = useMachines();
  const createMachine = useCreateMachine();
  const updateMachine = useUpdateMachine();
  const deleteMachine = useDeleteMachine();
  const markServiceDone = useMarkServiceDone();
  const createLog = useCreateLog();

  const filtered = useMemo(() => machines.filter((m) => {
    if (search) {
      const q = search.toLowerCase();
      if (!m.machineName?.toLowerCase().includes(q) && !m.machineCode?.toLowerCase().includes(q)) return false;
    }
    if (ownershipFilter !== 'All' && m.ownershipType !== ownershipFilter) return false;
    if (typeFilter !== 'All' && m.machineType !== typeFilter) return false;
    if (statusFilter !== 'All' && m.status !== statusFilter) return false;
    if (serviceFilter !== 'All' && getServiceStatus(m) !== serviceFilter) return false;
    return true;
  }), [machines, search, ownershipFilter, typeFilter, statusFilter, serviceFilter]);

  const stats = useMemo(() => ({
    total: machines.length,
    active: machines.filter((m) => m.status === 'active').length,
    owned: machines.filter((m) => m.ownershipType === 'owned').length,
    rented: machines.filter((m) => m.ownershipType === 'rented').length,
    dueForService: machines.filter((m) => ['service_due', 'due_soon'].includes(getServiceStatus(m))).length,
    overdue: machines.filter((m) => getServiceStatus(m) === 'overdue').length,
  }), [machines]);

  const actionItems = useMemo(() => {
    const items = [];
    const overdue = machines.filter(m => getServiceStatus(m) === 'overdue');
    const dueSoon = machines.filter(m => getServiceStatus(m) === 'service_due');
    
    if (overdue.length > 0) {
      items.push({ 
        icon: <ErrorOutlineRoundedIcon fontSize="small" />, 
        color: 'error.main', 
        bgcolor: isDark ? 'rgba(211, 47, 47, 0.1)' : '#fdeded',
        text: `${overdue.length} CRITICAL OVERDUE`, 
        action: () => setServiceFilter('overdue') 
      });
    }
    if (dueSoon.length > 0) {
      items.push({ 
        icon: <WarningAmberRoundedIcon fontSize="small" />, 
        color: 'warning.main', 
        bgcolor: isDark ? 'rgba(237, 108, 2, 0.1)' : '#fff4e5',
        text: `${dueSoon.length} SERVICE REQUIRED`, 
        action: () => setServiceFilter('service_due') 
      });
    }
    return items;
  }, [machines, isDark]);

  const handleSaveMachine = async (payload) => {
    try {
      if (editMachine) {
        await updateMachine.mutateAsync({ id: editMachine._id, payload });
        enqueueSnackbar('Machine updated', { variant: 'success' });
        setEditMachine(null);
      } else {
        await createMachine.mutateAsync(payload);
        enqueueSnackbar('Machine added', { variant: 'success' });
        setShowAddMachine(false);
      }
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || 'Failed to save machine', { variant: 'error' });
    }
  };

  const handleDeleteMachine = async () => {
    try {
      await deleteMachine.mutateAsync(deleteMachineTarget._id);
      enqueueSnackbar('Machine deleted', { variant: 'success' });
      setDeleteMachineTarget(null);
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || 'Failed to delete machine', { variant: 'error' });
    }
  };

  const handleMarkServiceDone = async () => {
    try {
      await markServiceDone.mutateAsync(serviceMachineTarget._id);
      enqueueSnackbar('Service marked as complete', { variant: 'success' });
      setServiceMachineTarget(null);
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || 'Failed to mark service done', { variant: 'error' });
    }
  };

  const handleSaveLog = async (payload) => {
    try {
      await createLog.mutateAsync(payload);
      enqueueSnackbar('Daily meter update saved', { variant: 'success' });
      setAddLogMachine(null);
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || 'Failed to save daily log', { variant: 'error' });
    }
  };

  return (
    <Box sx={{ maxWidth: 1400, margin: 'auto' }}>
      {/* Dynamic Sub-header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ 
            width: 42, height: 42, borderRadius: '10px', 
            bgcolor: 'primary.main', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: isDark ? '0 0 15px rgba(249, 115, 22, 0.3)' : 'none'
          }}>
            <SettingsIcon sx={{ color: '#fff', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={900} sx={{ color: 'text.primary', letterSpacing: '-0.02em' }}>
              Machinery Fleet
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: '0.1em' }}>
              {isDark ? '// FLEET_OPERATIONS' : 'Operational Assets'}
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button 
            variant="outlined" 
            startIcon={<WarningAmberRoundedIcon />}
            onClick={() => onNavigate?.('MachineryAlerts')}
            sx={{ fontWeight: 700, borderRadius: '8px' }}
          >
            Alerts
          </Button>
          <Button 
            variant="contained" 
            disableElevation
            onClick={() => onNavigate?.('MachineryReports')}
            sx={{ fontWeight: 700, borderRadius: '8px' }}
          >
            Reports
          </Button>
        </Stack>
      </Box>

      <Stack spacing={4}>
        {/* Global Stats Section */}
        <StatsCards 
          stats={stats} 
          onFilterStatus={setStatusFilter}
          onFilterOwnership={setOwnershipFilter}
          onFilterService={setServiceFilter}
        />

        {/* Action Center - Themed Alert Box */}
        {actionItems.length > 0 && (
          <Paper sx={{ 
            p: 2.5, borderRadius: 4, 
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: isDark ? 'rgba(13, 16, 23, 0.6)' : 'background.paper',
            backdropFilter: isDark ? 'blur(10px)' : 'none'
          }}>
            <Typography variant="overline" sx={{ fontWeight: 900, color: 'text.secondary', mb: 2, display: 'block' }}>
              ⚡ Immediate Action Items
            </Typography>
            <Grid container spacing={2}>
              {actionItems.map((item, i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Box 
                    onClick={item.action}
                    sx={{ 
                      display: 'flex', alignItems: 'center', gap: 2, p: 2, 
                      bgcolor: item.bgcolor, 
                      borderRadius: 3, cursor: 'pointer',
                      border: '1px solid transparent',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': { 
                        transform: 'scale(1.02)',
                        borderColor: item.color,
                        boxShadow: `0 4px 20px ${item.color}20` 
                      }
                    }}>
                    <Box sx={{ color: item.color, display: 'flex' }}>{item.icon}</Box>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ color: 'text.primary' }}>
                      {item.text}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}

        {/* Filters Section */}
        <MachineFilters
          search={search}                   setSearch={setSearch}
          ownershipFilter={ownershipFilter} setOwnershipFilter={setOwnershipFilter}
          typeFilter={typeFilter}           setTypeFilter={setTypeFilter}
          statusFilter={statusFilter}       setStatusFilter={setStatusFilter}
          serviceFilter={serviceFilter}     setServiceFilter={setServiceFilter}
        />

        {/* Machine Grid */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
        ) : error ? (
          <Alert severity="error" variant="filled">Critical error loading machinery data.</Alert>
        ) : filtered.length === 0 ? (
          <Paper variant="outlined" sx={{ textAlign: 'center', py: 12, borderRadius: 4, borderStyle: 'dashed' }}>
            <Typography variant="h2" sx={{ mb: 2 }}>🛠️</Typography>
            <Typography variant="h5" fontWeight={800}>Fleet Status: Zero Matches</Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 400, mx: 'auto', mt: 1 }}>
              Adjust your filters or code search to find specific machinery.
            </Typography>
            <Button 
                variant="text" 
                sx={{ mt: 3, fontWeight: 800 }} 
                onClick={() => { setSearch(''); setStatusFilter('All'); setServiceFilter('All'); setTypeFilter('All'); setOwnershipFilter('All'); }}
            >
              Reset Terminal View
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {filtered.map((m) => (
              <Grid item xs={12} lg={6} key={m._id}>
                <MachineCard
                  machine={m}
                  onView={(id) => onNavigate?.('MachineryDetail', id)}
                  onAddLog={setAddLogMachine}
                  onServiceDone={setServiceMachineTarget}
                  onEdit={setEditMachine}
                  onDelete={setDeleteMachineTarget}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Stack>

      {/* Floating Action Button */}
      <Fab 
        color="primary" 
        onClick={() => setShowAddMachine(true)}
        sx={{ 
          position: 'fixed', bottom: 32, right: 32, 
          borderRadius: '16px',
          boxShadow: isDark ? '0 8px 32px rgba(249, 115, 22, 0.4)' : '0 8px 32px rgba(0,0,0,0.2)'
        }}
      >
        <AddIcon />
      </Fab>

      {/* Forms & Modals */}
      <MachineForm
        open={showAddMachine || !!editMachine}
        machine={editMachine}
        onSave={handleSaveMachine}
        onCancel={() => { setShowAddMachine(false); setEditMachine(null); }}
        loading={createMachine.isPending || updateMachine.isPending}
      />
      <DailyMeterForm
        open={!!addLogMachine}
        machine={addLogMachine}
        onSave={handleSaveLog}
        onCancel={() => setAddLogMachine(null)}
        loading={createLog.isPending}
      />
      <DeleteConfirmModal
        open={!!deleteMachineTarget}
        title="Remove Asset"
        message="This will archive the machine from active logs. History remains encrypted."
        onConfirm={handleDeleteMachine}
        onCancel={() => setDeleteMachineTarget(null)}
        loading={deleteMachine.isPending}
      />
      <ServiceDoneModal
        open={!!serviceMachineTarget}
        machine={serviceMachineTarget}
        onConfirm={handleMarkServiceDone}
        onCancel={() => setServiceMachineTarget(null)}
        loading={markServiceDone.isPending}
      />
    </Box>
  );
}

export default function MachineryDashboardContainer() {
  const [view, setView] = useState({ page: 'MachineryDashboard', id: null });
  const navigate = (page, id) => setView({ page, id });
  const goBack = () => setView({ page: 'MachineryDashboard', id: null });

  switch (view.page) {
    case 'MachineryDetail': return <MachineDetail machineId={view.id} onBack={goBack} />;
    case 'MachineryAlerts': return <ServiceAlerts onBack={goBack} onViewDetail={(id) => navigate('MachineryDetail', id)} />;
    case 'MachineryReports': return <MachineryReports onBack={goBack} />;
    default: return <MachineryDashboardView onNavigate={navigate} />;
  }
}