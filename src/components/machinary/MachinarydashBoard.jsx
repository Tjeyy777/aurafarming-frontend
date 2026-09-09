import { useState, useMemo } from 'react';
import {
  Box, Typography, Button, Grid, Fab, CircularProgress,Stack, Alert, Paper, useTheme,
  TablePagination,
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
import ExportDialog, { ExportButton } from '../ExportDialog';
import { generateMachineryPDF } from '../../utils/pdfGenerator';
import { generateMachineryExcel } from '../../utils/excelGenerator';
import { fetchAllMachines } from '../../utils/exportDataFetcher';

function MachineryDashboardView({ onNavigate }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { enqueueSnackbar } = useSnackbar();

  // Filter States
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [serviceFilter, setServiceFilter] = useState('All');

  // Modal States
  const [showAddMachine, setShowAddMachine] = useState(false);
  const [editMachine, setEditMachine] = useState(null);
  const [addLogMachine, setAddLogMachine] = useState(null);
  const [deleteMachineTarget, setDeleteMachineTarget] = useState(null);
  const [serviceMachineTarget, setServiceMachineTarget] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);

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
    if (typeFilter !== 'All' && m.machineType !== typeFilter) return false;
    if (statusFilter !== 'All' && m.status !== statusFilter) return false;
    if (serviceFilter !== 'All' && getServiceStatus(m) !== serviceFilter) return false;
    return true;
  }), [machines, search, typeFilter, statusFilter, serviceFilter]);

  const stats = useMemo(() => ({
    total: machines.length,
    active: machines.filter((m) => m.status === 'active').length,
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
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: "1600px", mx: "auto", pb: 10, width: "100%" }}>
      {/* Dynamic Sub-header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            width: 34, height: 34, borderRadius: '8px',
            bgcolor: 'surface2', color: 'text.secondary',
            border: (t) => `1px solid ${t.palette.divider}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <SettingsIcon sx={{ fontSize: 19 }} />
          </Box>
          <Box>
            <Typography variant="h1" sx={{ fontSize: '1.375rem' }}>
              Machinery
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Fleet status and service tracking
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
          <ExportButton onClick={() => setExportOpen(true)} />
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
          onFilterService={setServiceFilter}
        />

        {/* Action Center - Themed Alert Box */}
        {actionItems.length > 0 && (
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '10px' }}>
            <Typography variant="overline" sx={{ color: 'text.secondary', mb: 2, display: 'block' }}>
              Needs attention
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
                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'text.primary' }}>
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
          <Paper variant="outlined" sx={{ textAlign: 'center', py: 10, borderRadius: '10px', borderStyle: 'dashed' }}>
            <Typography variant="h4">No machines match these filters</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360, mx: 'auto', mt: 1 }}>
              Try clearing the search or filters to see the full fleet.
            </Typography>
            <Button
                variant="text"
                sx={{ mt: 2 }}
                onClick={() => { setSearch(''); setStatusFilter('All'); setServiceFilter('All'); setTypeFilter('All'); }}
            >
              Clear filters
            </Button>
          </Paper>
        ) : (
          <>
          <Grid container spacing={3}>
            {filtered
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((m) => (
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

          {/* Pagination */}
          {filtered.length > rowsPerPage && (
            <TablePagination
              component="div"
              count={filtered.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[6, 12, 24, 48]}
              sx={{ mt: 2 }}
            />
          )}
        </>
        )}
      </Stack>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        onClick={() => setShowAddMachine(true)}
        sx={{ position: 'fixed', bottom: 28, right: 28, borderRadius: '14px' }}
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
        message="This archives the machine from active logs. Its history is kept."
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

      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        moduleName="Machinery"
        onExportPDF={async (period, customDate) => {
          const allMachines = await fetchAllMachines();
          generateMachineryPDF({ machines: allMachines, period, customDate });
        }}
        onExportExcel={async (period, customDate) => {
          const allMachines = await fetchAllMachines();
          generateMachineryExcel({ machines: allMachines, period, customDate });
        }}
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
