import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Button, IconButton, AppBar, Toolbar,
  TextField, MenuItem, Table, TableHead, TableRow, TableCell,
  TableBody, CircularProgress, Grid,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';

import { useMachines, useLogs } from './useMchinary';
import { getServiceStatus } from './machinaryutils';
import StatsCards from './Statuscard';

export default function MachineryReports({ onBack }) {
  const navigate = useNavigate();
  const [machineFilter,   setMachineFilter]   = useState('All');
  const [ownershipFilter, setOwnershipFilter] = useState('All');
  const [dateFrom,        setDateFrom]        = useState('');
  const [dateTo,          setDateTo]          = useState('');

  const { data: machines = [] }               = useMachines();
  const { data: allLogs = [], isLoading }     = useLogs();

  const filtered = useMemo(() => {
    return allLogs.filter((l) => {
      const machine = l.machineId;
      if (!machine) return false;
      if (machineFilter   !== 'All' && machine._id        !== machineFilter)              return false;
      if (ownershipFilter !== 'All' && machine.ownershipType !== ownershipFilter)         return false;
      const logDate = new Date(l.date).toISOString().split('T')[0];
      if (dateFrom && logDate < dateFrom) return false;
      if (dateTo   && logDate > dateTo)   return false;
      return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [allLogs, machineFilter, ownershipFilter, dateFrom, dateTo]);

  const totalHours = filtered.reduce((s, l) => s + (l.totalHoursWorked || 0), 0);
  const totalCost  = filtered.reduce((s, l) => s + (l.operatingCost    || 0), 0);

  const reportStats = {
    total:        machines.length,
    active:       machines.filter((m) => m.status === 'active').length,
    dueForService:machines.filter((m) => ['service_due', 'due_soon'].includes(getServiceStatus(m))).length,
    overdue:      machines.filter((m) => getServiceStatus(m) === 'overdue').length,
    owned:        machines.filter((m) => m.ownershipType === 'owned').length,
    rented:       machines.filter((m) => m.ownershipType === 'rented').length,
  };

  const exportCSV = () => {
    const header = 'Machine,Date,Opening,Closing,Hours,Cost\n';
    const rows = filtered.map((l) => {
      const m = l.machineId;
      return `${m?.machineName || ''},${new Date(l.date).toLocaleDateString('en-IN')},${l.openingMeterReading},${l.closingMeterReading},${l.totalHoursWorked},${l.operatingCost}`;
    }).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `machinery-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" sx={{ bgcolor: 'background.paper' }}>
        <Toolbar sx={{ maxWidth: 1100, width: '100%', mx: 'auto', px: { xs: 2, sm: 3 }, gap: 1.5, minHeight: '60px !important' }}>
          <IconButton size="small" onClick={() => onBack ? onBack() : navigate('/machinery')}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Typography variant="body1" fontWeight={700} sx={{ flex: 1 }}>Machinery Reports</Typography>
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={exportCSV}>
            Export CSV
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 2, sm: 3 }, py: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <TextField select size="small" value={machineFilter} onChange={(e) => setMachineFilter(e.target.value)} sx={{ minWidth: 160 }}>
            <MenuItem value="All">All Machines</MenuItem>
            {machines.map((m) => <MenuItem key={m._id} value={m._id}>{m.machineName}</MenuItem>)}
          </TextField>
          <TextField select size="small" value={ownershipFilter} onChange={(e) => setOwnershipFilter(e.target.value)} sx={{ minWidth: 130 }}>
            <MenuItem value="All">All Ownership</MenuItem>
            <MenuItem value="owned">Owned</MenuItem>
            <MenuItem value="rented">Rented</MenuItem>
          </TextField>
          <TextField type="date" size="small" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} label="From" InputLabelProps={{ shrink: true }} />
          <TextField type="date" size="small" value={dateTo}   onChange={(e) => setDateTo(e.target.value)}   label="To"   InputLabelProps={{ shrink: true }} />
        </Box>

        <StatsCards stats={reportStats} />

        {/* Log-level summary (changes with filters) */}
        <Grid container spacing={1.5}>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary"
                sx={{ fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: 10 }}>
                Total Hours
              </Typography>
              <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5, fontVariantNumeric: 'tabular-nums' }}>
                {totalHours.toFixed(1)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary"
                sx={{ fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: 10 }}>
                Total Cost
              </Typography>
              <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5, fontVariantNumeric: 'tabular-nums' }}>
                ₹{totalCost.toLocaleString()}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary"
                sx={{ fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: 10 }}>
                Log Entries
              </Typography>
              <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5, fontVariantNumeric: 'tabular-nums' }}>
                {filtered.length}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Table */}
        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Machine</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Open</TableCell>
                  <TableCell align="right">Close</TableCell>
                  <TableCell align="right">Hours</TableCell>
                  <TableCell align="right">Cost</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                      No logs match the selected filters
                    </TableCell>
                  </TableRow>
                ) : filtered.map((log) => {
                  const m = log.machineId;
                  return (
                    <TableRow key={log._id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{m?.machineName || 'Unknown'}</TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>
                        {new Date(log.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{log.openingMeterReading?.toLocaleString()}</TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{log.closingMeterReading?.toLocaleString()}</TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{log.totalHoursWorked?.toFixed(1)}</TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {log.operatingCost > 0 ? `₹${log.operatingCost?.toLocaleString()}` : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}