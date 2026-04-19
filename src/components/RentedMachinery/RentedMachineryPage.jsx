import { useState, useMemo } from 'react';
import {
  Box, Typography, Button, TextField, MenuItem, Paper, Checkbox,
  CircularProgress, IconButton, Collapse, Chip, Grid, Stack, InputBase,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import SearchIcon from '@mui/icons-material/Search';
import { useSnackbar } from 'notistack';

import {
  useRentedVehicles,
  useRentedLogs,
  useRentedSummary,
  useCreateRentedLog,
  useUpdateRentedLog,
  useDeleteRentedLog,
  useCreateTrip,
} from '../../hooks/useRentedMachinery';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtDateTime = (v) => (!v ? '—' : new Date(v).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }));
const fmtDate = (v) => (!v ? '—' : new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }));
const fmtNumber = (v) => (v == null ? '—' : Number(v).toLocaleString());

// ─── Sub Components ──────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, accent, loading }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Paper sx={{
      p: 2.5,
      borderRadius: 3,
      border: `1px solid ${theme.palette.divider}`,
      bgcolor: isDark ? 'rgba(18,22,30,0.7)' : '#fff',
    }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="caption" sx={{
            color: 'text.secondary',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontSize: '0.68rem'
          }}>
            {label}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5, color: accent || 'text.primary' }}>
            {loading ? <CircularProgress size={20} /> : value}
          </Typography>
        </Box>
        {/* FIX 1: Guard against undefined icon */}
        {Icon && (
          <Box sx={{
            bgcolor: accent ? `${accent}18` : (isDark ? 'rgba(255,255,255,0.06)' : '#f4f6f8'),
            borderRadius: 2,
            p: 1.2,
          }}>
            <Icon sx={{ fontSize: 22, color: accent || 'text.secondary' }} />
          </Box>
        )}
      </Stack>
    </Paper>
  );
}

function ColHeader({ headers, showCheckbox, onSelectAll, isAllSelected, isIndeterminate }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: showCheckbox
        ? '40px 40px 200px 150px 120px 120px 150px 150px 120px 150px 100px'
        : '40px 200px 150px 120px 120px 150px 150px 120px 150px 100px',
      gap: 1,
      px: 1.5,
      py: 1,
      borderRadius: 2,
      mb: 1,
      bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#f0f4ff',
      border: `1px solid ${theme.palette.divider}`,
      alignItems: 'center',
    }}>
      {showCheckbox && (
        <Checkbox
          size="small"
          checked={isAllSelected}
          indeterminate={isIndeterminate}
          onChange={onSelectAll}
          sx={{ p: 0 }}
        />
      )}
      {headers.map((h) => (
        <Typography
          key={h}
          variant="caption"
          sx={{
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            color: 'text.secondary',
            fontSize: '0.68rem',
          }}
        >
          {h}
        </Typography>
      ))}
    </Box>
  );
}

function RowCell({ children, sx, ...props }) {
  return (
    <Typography
      variant="body2"
      sx={{
        fontWeight: 500,
        color: 'text.primary',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        ...sx,
      }}
      {...props}
    >
      {children}
    </Typography>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function RentedMachineryPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { enqueueSnackbar } = useSnackbar();

  const [vehicleFilter, setVehicleFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [expandedRows, setExpandedRows] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const [newRow, setNewRow] = useState({
    vehicleId: '',
    date: new Date().toISOString().split('T')[0],
    openingMeter: '',
    closingMeter: '',
    driverName: '',
    remarks: '',
  });

  // Queries
  const { data: vehicles = [] } = useRentedVehicles({ status: 'active' });
  const { data: logs = [], isLoading, refetch } = useRentedLogs({
    vehicleId: vehicleFilter !== 'All' ? vehicleFilter : undefined,
    dateFrom,
    dateTo,
  });
  const { data: summary, isLoading: summaryLoading } = useRentedSummary({
    vehicleId: vehicleFilter !== 'All' ? vehicleFilter : undefined,
    dateFrom,
    dateTo,
  });

  // Mutations
  const createLog = useCreateRentedLog();
  const updateLog = useUpdateRentedLog();
  const deleteLog = useDeleteRentedLog();
  const createTrip = useCreateTrip();

  // Organize logs into tree structure
  const organizedLogs = useMemo(() => {
    const parentLogs = logs.filter(l => !l.isTrip);
    return parentLogs.map(parent => ({
      ...parent,
      children: logs.filter(l => l.isTrip && l.parentLogId === parent._id),
    }));
  }, [logs]);

  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return organizedLogs;
    const q = searchQuery.toLowerCase();
    return organizedLogs.filter(l =>
      l.vehicleId?.vehicleNumber?.toLowerCase().includes(q) ||
      l.driverName?.toLowerCase().includes(q)
    );
  }, [organizedLogs, searchQuery]);

  // Handlers
  const toggleRow = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelectRow = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    const allIds = filteredLogs.map(l => l._id);
    setSelectedIds(prev => prev.length === allIds.length ? [] : allIds);
  };

  const handleAddRow = async () => {
    if (!newRow.vehicleId || !newRow.openingMeter) {
      enqueueSnackbar('Vehicle and opening meter are required', { variant: 'error' });
      return;
    }

    const res = await createLog.mutateAsync({
      vehicleId: newRow.vehicleId,
      date: newRow.date,
      openingMeter: Number(newRow.openingMeter),
      closingMeter: newRow.closingMeter ? Number(newRow.closingMeter) : null,
      driverName: newRow.driverName,
      remarks: newRow.remarks,
    });

    if (res) {
      enqueueSnackbar('Entry added successfully', { variant: 'success' });
      setNewRow({
        vehicleId: '',
        date: new Date().toISOString().split('T')[0],
        openingMeter: '',
        closingMeter: '',
        driverName: '',
        remarks: '',
      });
    }
  };

  const startEdit = (log) => {
    setEditingId(log._id);
    setEditForm({
      openingMeter: log.openingMeter ?? '',
      closingMeter: log.closingMeter ?? '',
      driverName: log.driverName || '',
      remarks: log.remarks || '',
      tripPurpose: log.tripPurpose || '',
      date: log.date ? new Date(log.date).toISOString().split('T')[0] : '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (id) => {
    const res = await updateLog.mutateAsync({
      id,
      payload: {
        openingMeter: editForm.openingMeter !== '' ? Number(editForm.openingMeter) : undefined,
        closingMeter: editForm.closingMeter !== '' ? Number(editForm.closingMeter) : null,
        driverName: editForm.driverName,
        remarks: editForm.remarks,
        tripPurpose: editForm.tripPurpose,
        date: editForm.date,
      },
    });

    if (res) {
      enqueueSnackbar('Entry updated', { variant: 'success' });
      cancelEdit();
    }
  };

  const handleDelete = async (ids) => {
    const results = await Promise.all(ids.map(id => deleteLog.mutateAsync(id)));
    const failed = results.filter(r => !r);
    if (failed.length === 0) {
      enqueueSnackbar(`${ids.length} entries deleted`, { variant: 'success' });
    }
    setSelectedIds([]);
  };

  const handleCreateTrip = async (parentLog) => {
    const res = await createTrip.mutateAsync({
      parentLogId: parentLog._id,
      openingMeter: parentLog.closingMeter || parentLog.openingMeter,
      date: new Date().toISOString().split('T')[0],
    });

    if (res) {
      enqueueSnackbar('Trip created', { variant: 'success' });
      setExpandedRows(prev => ({ ...prev, [parentLog._id]: true }));
    }
  };

  const rowSx = (isEditing, isSelected, isTrip) => ({
    display: 'grid',
    gridTemplateColumns: '40px 40px 200px 150px 120px 120px 150px 150px 120px 150px 100px',
    gap: 1,
    px: 1.5,
    py: isEditing ? 1 : 0.75,
    borderRadius: 2,
    border: `1px solid ${isSelected ? theme.palette.primary.main : theme.palette.divider}`,
    bgcolor: isTrip
      ? (isDark ? 'rgba(249,115,22,0.08)' : '#fff7ed')
      : isSelected
      ? (isDark ? 'rgba(59,130,246,0.08)' : '#f0f7ff')
      : (isDark ? 'rgba(255,255,255,0.02)' : '#fff'),
    alignItems: 'center',
    transition: 'all 0.15s',
    ml: isTrip ? 6 : 0,
    '&:hover': {
      bgcolor: isSelected ? undefined : (isDark ? 'rgba(255,255,255,0.04)' : '#f8faff'),
    },
  });

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} sx={{ mb: 3.5, gap: 2 }}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
            <Box sx={{ bgcolor: 'primary.main', borderRadius: 2, p: 0.9, display: 'flex' }}>
              <LocalShippingIcon sx={{ fontSize: 22, color: '#fff' }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>Rented Machinery Control</Typography>
          </Stack>
          <Typography variant="body2" sx={{ color: 'text.secondary', pl: '46px' }}>
            Track rentals, trips, and billing
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Paper elevation={0} sx={{ px: 1.5, py: 0.5, display: 'flex', alignItems: 'center', width: 280, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#f4f6f8', borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
            <SearchIcon sx={{ color: 'text.disabled', fontSize: 19, mr: 1 }} />
            <InputBase placeholder="Search..." sx={{ flex: 1, fontSize: '0.85rem' }} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </Paper>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={refetch} sx={{ borderRadius: 2, fontWeight: 700 }}>
            Refresh
          </Button>
        </Stack>
      </Stack>

      {/* FIX 2: Stats — Grid v2 syntax (no `item`, use `size` prop) */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Our Hours" value={fmtNumber(summary?.ourHours)} icon={LocalShippingIcon} accent="#10b981" loading={summaryLoading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Trip Hours" value={fmtNumber(summary?.tripHours)} icon={CallSplitIcon} accent="#f59e0b" loading={summaryLoading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Total Cost" value={`₹${fmtNumber(summary?.totalCost)}`} accent="#8b5cf6" loading={summaryLoading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Total Entries" value={summary?.totalEntries || 0} loading={summaryLoading} />
        </Grid>
      </Grid>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          select
          size="small"
          value={vehicleFilter}
          onChange={(e) => setVehicleFilter(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="All">All Vehicles</MenuItem>
          {vehicles.map(v => (
            <MenuItem key={v._id} value={v._id}>
              {v.vehicleNumber} - {v.vehicleType}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          type="date"
          size="small"
          label="From"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          type="date"
          size="small"
          label="To"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Box>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <Paper sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: isDark ? 'rgba(211,47,47,0.15)' : '#fff5f5', border: `1px solid ${theme.palette.error.light}` }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'error.main' }}>
              {selectedIds.length} items selected
            </Typography>
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => handleDelete(selectedIds)}
              sx={{ fontWeight: 800, borderRadius: 2 }}
            >
              Delete Selected
            </Button>
          </Stack>
        </Paper>
      )}

      {/* Main Table */}
      <Paper sx={{ borderRadius: 3, p: 3 }}>
        <Box sx={{ overflowX: 'auto' }}>
          <Box sx={{ minWidth: 1400 }}>
            {/* New Entry Form */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: '40px 40px 200px 150px 120px 120px 150px 150px 120px 150px 100px',
              gap: 1,
              p: 1.2,
              borderRadius: 2,
              mb: 1.5,
              bgcolor: isDark ? 'rgba(59,130,246,0.06)' : '#f0f7ff',
              border: `1.5px dashed ${theme.palette.primary.main}44`,
            }}>
              <Box />
              <Box />
              <TextField
                select
                size="small"
                value={newRow.vehicleId}
                onChange={(e) => setNewRow(p => ({ ...p, vehicleId: e.target.value }))}
                placeholder="Select Vehicle"
              >
                {vehicles.map(v => (
                  <MenuItem key={v._id} value={v._id}>
                    {v.vehicleNumber}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                size="small"
                type="date"
                value={newRow.date}
                onChange={(e) => setNewRow(p => ({ ...p, date: e.target.value }))}
              />
              <TextField
                size="small"
                type="number"
                placeholder="Opening"
                value={newRow.openingMeter}
                onChange={(e) => setNewRow(p => ({ ...p, openingMeter: e.target.value }))}
              />
              <TextField
                size="small"
                type="number"
                placeholder="Closing"
                value={newRow.closingMeter}
                onChange={(e) => setNewRow(p => ({ ...p, closingMeter: e.target.value }))}
              />
              <TextField
                size="small"
                placeholder="Driver"
                value={newRow.driverName}
                onChange={(e) => setNewRow(p => ({ ...p, driverName: e.target.value }))}
              />
              <Box />
              <Box />
              <TextField
                size="small"
                placeholder="Remarks"
                value={newRow.remarks}
                onChange={(e) => setNewRow(p => ({ ...p, remarks: e.target.value }))}
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddRow}
                sx={{ fontWeight: 700, borderRadius: 2, height: 40 }}
              >
                Add
              </Button>
            </Box>

            <ColHeader
              headers={['', 'Vehicle', 'Date', 'Opening', 'Closing', 'Driver', 'Hours', 'Cost', 'Remarks', 'Actions']}
              showCheckbox
              isAllSelected={selectedIds.length > 0 && selectedIds.length === filteredLogs.length}
              isIndeterminate={selectedIds.length > 0 && selectedIds.length < filteredLogs.length}
              onSelectAll={handleSelectAll}
            />

            {isLoading ? (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Stack spacing={0.75}>
                {filteredLogs.map((log) => {
                  const isEditing = editingId === log._id;
                  const isSelected = selectedIds.includes(log._id);
                  const hasChildren = log.children && log.children.length > 0;
                  const isExpanded = expandedRows[log._id];

                  return (
                    <Box key={log._id}>
                      {/* Parent Row */}
                      <Box sx={rowSx(isEditing, isSelected, false)}>
                        <Checkbox
                          size="small"
                          checked={isSelected}
                          onChange={() => handleSelectRow(log._id)}
                          sx={{ p: 0 }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => toggleRow(log._id)}
                          disabled={!hasChildren}
                          sx={{ p: 0 }}
                        >
                          {hasChildren ? (isExpanded ? <ExpandMoreIcon /> : <ChevronRightIcon />) : null}
                        </IconButton>

                        {isEditing ? (
                          <>
                            <RowCell sx={{ fontWeight: 800 }}>{log.vehicleId?.vehicleNumber}</RowCell>
                            <TextField
                              size="small"
                              type="date"
                              value={editForm.date}
                              onChange={(e) => setEditForm(p => ({ ...p, date: e.target.value }))}
                            />
                            <TextField
                              size="small"
                              type="number"
                              value={editForm.openingMeter}
                              onChange={(e) => setEditForm(p => ({ ...p, openingMeter: e.target.value }))}
                            />
                            <TextField
                              size="small"
                              type="number"
                              value={editForm.closingMeter}
                              onChange={(e) => setEditForm(p => ({ ...p, closingMeter: e.target.value }))}
                            />
                            <TextField
                              size="small"
                              value={editForm.driverName}
                              onChange={(e) => setEditForm(p => ({ ...p, driverName: e.target.value }))}
                            />
                            <RowCell sx={{ fontWeight: 900, color: 'primary.main' }}>{fmtNumber(log.totalHours)}</RowCell>
                            <RowCell sx={{ fontWeight: 900, color: 'success.main' }}>₹{fmtNumber(log.cost)}</RowCell>
                            <TextField
                              size="small"
                              value={editForm.remarks}
                              onChange={(e) => setEditForm(p => ({ ...p, remarks: e.target.value }))}
                            />
                            <Stack direction="row" spacing={0.5}>
                              <Button size="small" variant="contained" onClick={() => saveEdit(log._id)}>Save</Button>
                              <Button size="small" onClick={cancelEdit}>Cancel</Button>
                            </Stack>
                          </>
                        ) : (
                          <>
                            <RowCell sx={{ fontWeight: 800 }}>{log.vehicleId?.vehicleNumber}</RowCell>
                            <RowCell>{fmtDate(log.date)}</RowCell>
                            <RowCell>{fmtNumber(log.openingMeter)}</RowCell>
                            <RowCell>{fmtNumber(log.closingMeter)}</RowCell>
                            <RowCell>{log.driverName || '—'}</RowCell>
                            <RowCell sx={{ fontWeight: 900, color: 'primary.main' }}>{fmtNumber(log.totalHours)}</RowCell>
                            <RowCell sx={{ fontWeight: 900, color: 'success.main' }}>₹{fmtNumber(log.cost)}</RowCell>
                            <RowCell>{log.remarks || '—'}</RowCell>
                            <Stack direction="row" spacing={0.5}>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleCreateTrip(log)}
                                sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#f4f6f8' }}
                              >
                                <CallSplitIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => startEdit(log)}
                                sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#f4f6f8' }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                          </>
                        )}
                      </Box>

                      {/* Child Trip Rows */}
                      <Collapse in={isExpanded && hasChildren}>
                        <Stack spacing={0.75} sx={{ mt: 0.75 }}>
                          {log.children?.map((child) => {
                            const isChildEditing = editingId === child._id;
                            return (
                              <Box key={child._id} sx={rowSx(isChildEditing, false, true)}>
                                <Box />
                                <Chip
                                  label="TRIP"
                                  size="small"
                                  color="warning"
                                  sx={{ fontSize: '0.6rem', fontWeight: 800, height: 20 }}
                                />

                                {isChildEditing ? (
                                  <>
                                    <RowCell>{log.vehicleId?.vehicleNumber}</RowCell>
                                    <TextField
                                      size="small"
                                      type="date"
                                      value={editForm.date}
                                      onChange={(e) => setEditForm(p => ({ ...p, date: e.target.value }))}
                                    />
                                    <TextField
                                      size="small"
                                      type="number"
                                      value={editForm.openingMeter}
                                      onChange={(e) => setEditForm(p => ({ ...p, openingMeter: e.target.value }))}
                                    />
                                    <TextField
                                      size="small"
                                      type="number"
                                      value={editForm.closingMeter}
                                      onChange={(e) => setEditForm(p => ({ ...p, closingMeter: e.target.value }))}
                                    />
                                    <TextField
                                      size="small"
                                      placeholder="Trip purpose"
                                      value={editForm.tripPurpose}
                                      onChange={(e) => setEditForm(p => ({ ...p, tripPurpose: e.target.value }))}
                                    />
                                    <RowCell>{fmtNumber(child.totalHours)}</RowCell>
                                    <RowCell>—</RowCell>
                                    <TextField
                                      size="small"
                                      value={editForm.remarks}
                                      onChange={(e) => setEditForm(p => ({ ...p, remarks: e.target.value }))}
                                    />
                                    <Stack direction="row" spacing={0.5}>
                                      <Button size="small" variant="contained" onClick={() => saveEdit(child._id)}>Save</Button>
                                      <Button size="small" onClick={cancelEdit}>Cancel</Button>
                                    </Stack>
                                  </>
                                ) : (
                                  <>
                                    <RowCell>{log.vehicleId?.vehicleNumber}</RowCell>
                                    <RowCell>{fmtDate(child.date)}</RowCell>
                                    <RowCell>{fmtNumber(child.openingMeter)}</RowCell>
                                    <RowCell>{fmtNumber(child.closingMeter)}</RowCell>
                                    <RowCell sx={{ fontStyle: 'italic', color: 'warning.main' }}>
                                      {child.tripPurpose || 'External work'}
                                    </RowCell>
                                    <RowCell sx={{ fontWeight: 700, color: 'warning.main' }}>{fmtNumber(child.totalHours)}</RowCell>
                                    <RowCell>—</RowCell>
                                    <RowCell>{child.remarks || '—'}</RowCell>
                                    <Stack direction="row" spacing={0.5}>
                                      <IconButton
                                        size="small"
                                        onClick={() => startEdit(child)}
                                        sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#f4f6f8' }}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleDelete([child._id])}
                                        sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#f4f6f8' }}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Stack>
                                  </>
                                )}
                              </Box>
                            );
                          })}
                        </Stack>
                      </Collapse>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}