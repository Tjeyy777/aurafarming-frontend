import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import HistoryIcon from "@mui/icons-material/History";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ScaleIcon from "@mui/icons-material/Scale";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fade,
  Grid,
  IconButton,
  InputBase,
  Pagination,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useTheme,
  Checkbox,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useWeighbridge } from "../hooks/useWighbridge";

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_FORM = { vehicleNumber: "", driverName: "", emptyWeight: "", remarks: "" };

const TODAY_COLS = "50px 180px 160px 120px 120px 170px 170px 120px 100px 120px";
const HISTORY_COLS = "180px 120px 130px 100px 160px 140px";
const DAY_VIEW_COLS = "180px 150px 130px 130px 170px 170px 130px 110px";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDateTime = (v) => (!v ? "—" : new Date(v).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }));
const fmtDate = (v) => (!v ? "—" : new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }));
const fmtWeight = (v) => (v == null || v === "" ? "—" : `${Number(v).toLocaleString()} kg`);

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, loading, accent }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <Card
      sx={{
        borderRadius: "16px",
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: isDark ? "rgba(18,22,30,0.7)" : "#fff",
        backdropFilter: "blur(12px)",
        overflow: "visible",
        position: "relative",
        transition: "transform 0.18s, box-shadow 0.18s",
        "&:hover": { transform: "translateY(-2px)", boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.4)" : "0 8px 32px rgba(0,0,0,0.10)" },
      }}
    >
      <CardContent sx={{ p: "20px 22px !important" }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Box>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.68rem" }}>
              {label}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5, letterSpacing: "-0.03em", color: accent || "text.primary" }}>
              {loading ? <CircularProgress size={20} thickness={5} /> : value}
            </Typography>
          </Box>
          <Box sx={{ bgcolor: accent ? `${accent}18` : isDark ? "rgba(255,255,255,0.06)" : "#f4f6f8", borderRadius: "12px", p: 1.2, mt: 0.3 }}>
            <Icon sx={{ fontSize: 22, color: accent || "text.secondary" }} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function ColHeader({ cols, headers, showCheckbox, onSelectAll, isAllSelected, isIndeterminate }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: cols, gap: 1, px: 1.5, py: 1, borderRadius: "10px", mb: 1, bgcolor: isDark ? "rgba(255,255,255,0.04)" : "#f0f4ff", border: `1px solid ${theme.palette.divider}`, alignItems: "center" }}>
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
        <Typography key={h} variant="caption" sx={{ fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "text.secondary", fontSize: "0.68rem" }}>
          {h}
        </Typography>
      ))}
    </Box>
  );
}

function RowCell({ children, ...props }) {
  return (
    <Typography variant="body2" sx={{ fontWeight: 500, color: "text.primary", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...props?.sx }}>
      {children}
    </Typography>
  );
}

function ConfirmDialog({ open, title, onConfirm, onCancel, count = 1 }) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
      <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete {count} selected {count > 1 ? "entries" : "entry"}? This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: "12px 20px" }}>
        <Button onClick={onCancel} sx={{ fontWeight: 700 }}>Cancel</Button>
        <Button onClick={onConfirm} variant="contained" color="error" sx={{ fontWeight: 700, borderRadius: "8px" }}>
            Delete {count > 1 ? `(${count})` : ""}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function CompleteDialog({ open, row, onConfirm, onCancel }) {
  const [weight, setWeight] = useState("");
  const [err, setErr] = useState("");

  const handleConfirm = () => {
    if (!weight || isNaN(Number(weight))) { setErr("Enter a valid numeric weight"); return; }
    onConfirm(Number(weight));
    setWeight("");
    setErr("");
  };

  const handleClose = () => { setWeight(""); setErr(""); onCancel(); };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
      <DialogTitle sx={{ fontWeight: 800 }}>Complete Entry — {row?.vehicleNumber}</DialogTitle>
      <DialogContent sx={{ pt: "12px !important" }}>
        <TextField
          label="Loaded Weight (kg)"
          type="number"
          fullWidth
          size="small"
          value={weight}
          onChange={(e) => { setWeight(e.target.value); setErr(""); }}
          error={!!err}
          helperText={err || " "}
          autoFocus
        />
      </DialogContent>
      <DialogActions sx={{ p: "12px 20px" }}>
        <Button onClick={handleClose} sx={{ fontWeight: 700 }}>Cancel</Button>
        <Button onClick={handleConfirm} variant="contained" color="success" sx={{ fontWeight: 700, borderRadius: "8px" }}>Confirm</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WeighbridgePage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [tab, setTab] = useState(0);
  const [todayPage, setTodayPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [selectedDayPage, setSelectedDayPage] = useState(1);

  const [newRow, setNewRow] = useState(EMPTY_FORM);
  const [newRowError, setNewRowError] = useState("");
  const [prevWeightHint, setPrevWeightHint] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  const [confirmDialog, setConfirmDialog] = useState({ open: false, ids: [] });
  const [completeDialog, setCompleteDialog] = useState({ open: false, row: null });

  const {
    todayEntries, todayPagination, todayLoading,
    productionSummary, productionLoading,
    historySummary, historyPagination, historyLoading,
    selectedDayEntries, selectedDayPagination, selectedDaySummary, selectedDayLoading,
    createEntry, completeEntry, updateEntry, deleteEntry,
    fetchPreviousWeight, refetchToday,
  } = useWeighbridge({
    todayPage, todayLimit: 50,
    historyPage, historyLimit: 10,
    selectedDate, selectedDayPage, selectedDayLimit: 30,
  });

  const filteredTodayEntries = useMemo(() => {
    if (!searchQuery.trim()) return todayEntries;
    const q = searchQuery.toLowerCase();
    return todayEntries.filter((r) =>
      r.vehicleNumber?.toLowerCase().includes(q) || r.driverName?.toLowerCase().includes(q)
    );
  }, [todayEntries, searchQuery]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSelectRow = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredTodayEntries.length && filteredTodayEntries.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTodayEntries.map(r => r._id));
    }
  };

  const handleNewRowChange = async (field, value) => {
    setNewRow((prev) => ({ ...prev, [field]: value }));
    if (field === "vehicleNumber") {
      setPrevWeightHint("");
      const cleaned = value.trim().toUpperCase();
      if (cleaned.length >= 4) {
        const previous = await fetchPreviousWeight(cleaned);
        if (previous?.data?.previousEmptyWeight) {
          setPrevWeightHint(`Previous: ${previous.data.previousEmptyWeight} kg`);
        }
      }
    }
  };

  const handleAddRow = async () => {
    setNewRowError("");
    if (!newRow.vehicleNumber || !newRow.emptyWeight) {
      setNewRowError("Vehicle number and empty weight are required.");
      return;
    }
    const res = await createEntry({
      vehicleNumber: newRow.vehicleNumber.trim().toUpperCase(),
      driverName: newRow.driverName?.trim() || "",
      emptyWeight: Number(newRow.emptyWeight),
      remarks: newRow.remarks,
    });
    if (res?.status === "success") { setNewRow(EMPTY_FORM); setPrevWeightHint(""); }
    else setNewRowError(res?.message || "Failed to add entry.");
  };

  const startEdit = (row) => {
    setEditingId(row._id);
    setEditForm({
      vehicleNumber: row.vehicleNumber || "",
      driverName: row.driverName || "",
      emptyWeight: row.emptyWeight ?? "",
      loadedWeight: row.loadedWeight ?? "",
      remarks: row.remarks || "",
      entryTime: row.entryTime ? new Date(row.entryTime).toISOString().slice(0, 16) : "",
      exitTime: row.exitTime ? new Date(row.exitTime).toISOString().slice(0, 16) : "",
    });
  };

  const cancelEdit = () => { setEditingId(null); setEditForm({}); };

  const saveEdit = async (id) => {
    const res = await updateEntry({
      id,
      updatedData: {
        vehicleNumber: editForm.vehicleNumber.trim().toUpperCase(),
        driverName: editForm.driverName?.trim() || "", 
        emptyWeight: editForm.emptyWeight === "" ? undefined : Number(editForm.emptyWeight),
        loadedWeight: editForm.loadedWeight === "" ? null : Number(editForm.loadedWeight),
        remarks: editForm.remarks,
        entryTime: editForm.entryTime ? new Date(editForm.entryTime).toISOString() : undefined,
        exitTime: editForm.exitTime ? new Date(editForm.exitTime).toISOString() : null,
      },
    });
    if (res?.status === "success") cancelEdit();
    else alert(res?.message || "Failed to update entry.");
  };

  const handleDeleteConfirm = async () => {
    const ids = confirmDialog.ids;
    setConfirmDialog({ open: false, ids: [] });
    const results = await Promise.all(ids.map(id => deleteEntry(id)));
    const failed = results.filter(r => r?.status !== "success");
    if (failed.length > 0) alert(`${failed.length} deletions failed.`);
    setSelectedIds([]);
  };

  const openDayView = (date) => { setSelectedDate(date); setSelectedDayPage(1); setViewDialogOpen(true); };

  // ── Styles ──────────────────────────────────────────────────────────────────

  const rowSx = (isEditing, isSelected) => ({
    display: "grid",
    gap: 1,
    px: 1.5,
    py: isEditing ? 1 : 0.75,
    borderRadius: "10px",
    border: `1px solid ${isSelected ? theme.palette.primary.main : theme.palette.divider}`,
    bgcolor: isSelected 
        ? (isDark ? "rgba(59, 130, 246, 0.08)" : "#f0f7ff") 
        : (isDark ? "rgba(255,255,255,0.02)" : "#fff"),
    alignItems: "center",
    transition: "all 0.15s",
    "&:hover": { bgcolor: isSelected ? undefined : (isDark ? "rgba(255,255,255,0.04)" : "#f8faff") },
  });

  const actionBtnSx = { borderRadius: "8px", bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#f4f6f8", "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.1)" : "#e8ecf4" } };

  return (
    <Box sx={{ width: "100%" }}>

      {/* ── Header ── */}
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} sx={{ mb: 3.5, gap: 2 }}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
            <Box sx={{ bgcolor: "primary.main", borderRadius: "10px", p: 0.9, display: "flex" }}><ScaleIcon sx={{ fontSize: 22, color: "#fff" }} /></Box>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>Weighbridge Control</Typography>
          </Stack>
          <Typography variant="body2" sx={{ color: "text.secondary", pl: "46px" }}>Manage live entries and historical logs</Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Paper elevation={0} sx={{ px: 1.5, py: 0.5, display: "flex", alignItems: "center", width: 280, bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#f4f6f8", borderRadius: "12px", border: `1px solid ${theme.palette.divider}` }}>
            <SearchIcon sx={{ color: "text.disabled", fontSize: 19, mr: 1 }} />
            <InputBase placeholder="Search..." sx={{ flex: 1, fontSize: "0.85rem" }} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </Paper>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={refetchToday} sx={{ borderRadius: "12px", fontWeight: 700 }}>Refresh</Button>
        </Stack>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: "Today's Weight", value: fmtWeight(productionSummary?.daily?.totalNetWeight), icon: ScaleIcon, accent: theme.palette.primary.main },
          { label: "Today's Trips", value: productionSummary?.daily?.totalTrips ?? 0, icon: DirectionsCarIcon, accent: "#10b981" },
          { label: "Weekly Weight", value: fmtWeight(productionSummary?.weekly?.totalNetWeight), icon: TrendingUpIcon, accent: "#f59e0b" },
          { label: "Monthly Weight", value: fmtWeight(productionSummary?.monthly?.totalNetWeight), icon: CalendarMonthIcon, accent: "#8b5cf6" },
        ].map((s) => (
          <Grid item xs={12} sm={6} md={3} key={s.label}><StatCard {...s} loading={productionLoading} /></Grid>
        ))}
      </Grid>

      <Card sx={{ borderRadius: "16px", mb: 2.5 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 1.5 }}>
          <Tab label="Today Sheet" />
          <Tab label="History" />
        </Tabs>
      </Card>

      {tab === 0 && (
        <Fade in>
          <Box>
            {/* Bulk Action Bar */}
            <Fade in={selectedIds.length > 0}>
                <Paper elevation={4} sx={{ display: selectedIds.length > 0 ? "flex" : "none", alignItems: "center", justifyContent: "space-between", p: "12px 24px", mb: 2.5, borderRadius: "14px", bgcolor: isDark ? "rgba(211, 47, 47, 0.15)" : "#fff5f5", border: `1px solid ${theme.palette.error.light}` }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Checkbox size="small" checked={selectedIds.length === filteredTodayEntries.length} indeterminate={selectedIds.length > 0 && selectedIds.length < filteredTodayEntries.length} onChange={handleSelectAll} color="error" />
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "error.main" }}>{selectedIds.length} items selected</Typography>
                    </Stack>
                    <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={() => setConfirmDialog({ open: true, ids: selectedIds })} sx={{ fontWeight: 800, borderRadius: "10px" }}>Delete Selected</Button>
                </Paper>
            </Fade>

            <Card sx={{ borderRadius: "16px" }}>
              <CardContent sx={{ p: "24px !important" }}>
                <Box sx={{ overflowX: "auto" }}>
                  <Box sx={{ minWidth: 1400 }}>
                    {/* Entry Form */}
                    <Box sx={{ display: "grid", gridTemplateColumns: TODAY_COLS, gap: 1, p: 1.2, borderRadius: "12px", mb: 1.5, bgcolor: isDark ? "rgba(59,130,246,0.06)" : "#f0f7ff", border: `1.5px dashed ${theme.palette.primary.main}44` }}>
                      <Box />
                      <TextField label="Vehicle No." size="small" value={newRow.vehicleNumber} onChange={(e) => handleNewRowChange("vehicleNumber", e.target.value.toUpperCase())} />
                      <TextField label="Driver (Opt)" size="small" value={newRow.driverName} onChange={(e) => handleNewRowChange("driverName", e.target.value)} />
                      <TextField label="Empty (kg)" size="small" type="number" value={newRow.emptyWeight} onChange={(e) => handleNewRowChange("emptyWeight", e.target.value)} helperText={prevWeightHint || " "} />
                      <TextField label="Remarks" size="small" value={newRow.remarks} onChange={(e) => handleNewRowChange("remarks", e.target.value)} />
                      <Box /><Box /><Box /><Box />
                      <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddRow} sx={{ fontWeight: 700, borderRadius: "10px", height: 40, alignSelf: "center" }}>Add</Button>
                    </Box>

                    <ColHeader cols={TODAY_COLS} headers={["Vehicle", "Driver", "Empty", "Loaded", "Entry Time", "Exit Time", "Net Weight", "Status", "Actions"]} showCheckbox isAllSelected={selectedIds.length > 0 && selectedIds.length === filteredTodayEntries.length} isIndeterminate={selectedIds.length > 0 && selectedIds.length < filteredTodayEntries.length} onSelectAll={handleSelectAll} />

                    {todayLoading ? (
                      <Box sx={{ py: 8, textAlign: "center" }}><CircularProgress /></Box>
                    ) : (
                      <Stack spacing={0.75}>
                        {filteredTodayEntries.map((row) => {
                          const isEditing = editingId === row._id;
                          const isSelected = selectedIds.includes(row._id);
                          return (
                            <Box key={row._id} sx={{ ...rowSx(isEditing, isSelected), gridTemplateColumns: TODAY_COLS }}>
                              <Checkbox size="small" checked={isSelected} onChange={() => handleSelectRow(row._id)} />
                              {isEditing ? (
                                <>
                                  <TextField size="small" value={editForm.vehicleNumber} onChange={(e) => setEditForm((p) => ({ ...p, vehicleNumber: e.target.value.toUpperCase() }))} />
                                  <TextField size="small" value={editForm.driverName} onChange={(e) => setEditForm((p) => ({ ...p, driverName: e.target.value }))} />
                                  <TextField size="small" type="number" value={editForm.emptyWeight} onChange={(e) => setEditForm((p) => ({ ...p, emptyWeight: e.target.value }))} />
                                  <TextField size="small" type="number" value={editForm.loadedWeight} onChange={(e) => setEditForm((p) => ({ ...p, loadedWeight: e.target.value }))} />
                                  <TextField size="small" type="datetime-local" value={editForm.entryTime} onChange={(e) => setEditForm((p) => ({ ...p, entryTime: e.target.value }))} />
                                  <TextField size="small" type="datetime-local" value={editForm.exitTime} onChange={(e) => setEditForm((p) => ({ ...p, exitTime: e.target.value }))} />
                                  <RowCell sx={{ fontWeight: 800, color: "primary.main" }}>{fmtWeight(row.netWeight)}</RowCell>
                                  <Chip size="small" label={row.status} color={row.status === "completed" ? "success" : "warning"} />
                                  <Stack direction="row" spacing={0.75}>
                                    <Button size="small" variant="contained" onClick={() => saveEdit(row._id)}>Save</Button>
                                    <Button size="small" onClick={cancelEdit}>Cancel</Button>
                                  </Stack>
                                </>
                              ) : (
                                <>
                                  <RowCell sx={{ fontWeight: 800 }}>{row.vehicleNumber}</RowCell>
                                  <RowCell>{row.driverName || "—"}</RowCell>
                                  <RowCell>{fmtWeight(row.emptyWeight)}</RowCell>
                                  <RowCell>{fmtWeight(row.loadedWeight)}</RowCell>
                                  <RowCell sx={{ fontSize: "0.78rem" }}>{fmtDateTime(row.entryTime)}</RowCell>
                                  <RowCell sx={{ fontSize: "0.78rem" }}>{fmtDateTime(row.exitTime)}</RowCell>
                                  <RowCell sx={{ fontWeight: 900, color: "primary.main" }}>{fmtWeight(row.netWeight)}</RowCell>
                                  <Chip size="small" label={row.status} color={row.status === "completed" ? "success" : "warning"} />
                                  <Stack direction="row" spacing={0.5}>
                                    {row.status === "open" && (
                                      <Tooltip title="Complete"><IconButton size="small" color="success" sx={actionBtnSx} onClick={() => setCompleteDialog({ open: true, row })}><CheckCircleIcon /></IconButton></Tooltip>
                                    )}
                                    <Tooltip title="Edit"><IconButton size="small" sx={actionBtnSx} onClick={() => startEdit(row)}><EditIcon sx={{ color: "primary.main" }} /></IconButton></Tooltip>
                                  </Stack>
                                </>
                              )}
                            </Box>
                          );
                        })}
                      </Stack>
                    )}
                  </Box>
                </Box>
                {todayPagination?.totalPages > 1 && (
                  <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}><Pagination page={todayPage} count={todayPagination.totalPages} onChange={(_, v) => setTodayPage(v)} color="primary" /></Box>
                )}
              </CardContent>
            </Card>
          </Box>
        </Fade>
      )}

      {tab === 1 && (
        <Fade in>
          <Card sx={{ borderRadius: "16px" }}>
            <CardContent sx={{ p: "24px !important" }}>
              {historyLoading ? (
                <Box sx={{ py: 8, textAlign: "center" }}><CircularProgress /></Box>
              ) : (
                <Stack spacing={0.75}>
                  <ColHeader cols={HISTORY_COLS} headers={["Date", "Entries", "Completed", "Open", "Total Weight", "Action"]} />
                  {historySummary.map((item) => (
                    <Box key={item.date} sx={{ ...rowSx(false, false), gridTemplateColumns: HISTORY_COLS }}>
                      <RowCell sx={{ fontWeight: 800 }}>{fmtDate(item.date)}</RowCell>
                      <RowCell>{item.totalEntries}</RowCell>
                      <RowCell color="success.main">{item.completedEntries}</RowCell>
                      <RowCell color="warning.main">{item.openEntries}</RowCell>
                      <RowCell sx={{ fontWeight: 900, color: "primary.main" }}>{fmtWeight(item.totalNetWeight)}</RowCell>
                      <Button variant="outlined" size="small" startIcon={<VisibilityIcon />} onClick={() => openDayView(item.date)}>View</Button>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Fade>
      )}

      <ConfirmDialog open={confirmDialog.open} title="Delete Entries" count={confirmDialog.ids.length} onConfirm={handleDeleteConfirm} onCancel={() => setConfirmDialog({ open: false, ids: [] })} />
      <CompleteDialog open={completeDialog.open} row={completeDialog.row} onConfirm={(w) => completeEntry({ id: completeDialog.row._id, payload: { loadedWeight: w } }).then(() => setCompleteDialog({ open: false, row: null }))} onCancel={() => setCompleteDialog({ open: false, row: null })} />
    </Box>
  );
}