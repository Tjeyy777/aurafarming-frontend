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
} from "@mui/material";
import { useMemo, useState } from "react";
import { useWeighbridge } from "../hooks/useWighbridge";

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_FORM = { vehicleNumber: "", driverName: "", emptyWeight: "", remarks: "" };

const TODAY_COLS = "200px 160px 130px 140px 170px 170px 130px 110px 200px";
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

function ColHeader({ cols, headers }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: cols, gap: 1, px: 1.5, py: 1, borderRadius: "10px", mb: 1, bgcolor: isDark ? "rgba(255,255,255,0.04)" : "#f0f4ff", border: `1px solid ${theme.palette.divider}` }}>
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

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
      <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ p: "12px 20px" }}>
        <Button onClick={onCancel} sx={{ fontWeight: 700 }}>Cancel</Button>
        <Button onClick={onConfirm} variant="contained" color="error" sx={{ fontWeight: 700, borderRadius: "8px" }}>Delete</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Complete Dialog ──────────────────────────────────────────────────────────

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

  // Confirm & Complete dialog state
  const [confirmDialog, setConfirmDialog] = useState({ open: false, id: null });
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

  // ── Filtered entries ────────────────────────────────────────────────────────

  const filteredTodayEntries = useMemo(() => {
    if (!searchQuery.trim()) return todayEntries;
    const q = searchQuery.toLowerCase();
    return todayEntries.filter((r) =>
      r.vehicleNumber?.toLowerCase().includes(q) || r.driverName?.toLowerCase().includes(q)
    );
  }, [todayEntries, searchQuery]);

  // ── Handlers ────────────────────────────────────────────────────────────────

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
      driverName: newRow.driverName,
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
        driverName: editForm.driverName,
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

  const handleCompleteConfirm = async (loadedWeight) => {
    const row = completeDialog.row;
    setCompleteDialog({ open: false, row: null });
    const res = await completeEntry({ id: row._id, payload: { loadedWeight } });
    if (res?.status !== "success") alert(res?.message || "Failed to complete entry.");
  };

  const handleDeleteConfirm = async () => {
    const id = confirmDialog.id;
    setConfirmDialog({ open: false, id: null });
    const res = await deleteEntry(id);
    if (res?.status !== "success") alert(res?.message || "Failed to delete entry.");
  };

  const openDayView = (date) => { setSelectedDate(date); setSelectedDayPage(1); setViewDialogOpen(true); };

  // ── Shared styles ────────────────────────────────────────────────────────────

  const rowSx = (isEditing) => ({
    display: "grid",
    gap: 1,
    px: 1.5,
    py: isEditing ? 1 : 0.75,
    borderRadius: "10px",
    border: `1px solid ${theme.palette.divider}`,
    bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#fff",
    alignItems: "center",
    transition: "background 0.15s",
    "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.04)" : "#f8faff" },
  });

  const actionBtnSx = { borderRadius: "8px", bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#f4f6f8", "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.1)" : "#e8ecf4" } };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ width: "100%" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        sx={{ mb: 3.5, gap: 2 }}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
            <Box sx={{ bgcolor: "primary.main", borderRadius: "10px", p: 0.9, display: "flex" }}>
              <ScaleIcon sx={{ fontSize: 22, color: "#fff" }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: "-0.025em" }}>
              Weighbridge Control
            </Typography>
          </Stack>
          <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500, pl: "46px" }}>
            Live dispatch entries · Production tracking · Daily sheet history
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} sx={{ width: { xs: "100%", md: "auto" } }}>
          <Paper
            elevation={0}
            sx={{
              px: 1.5, py: 0.5, display: "flex", alignItems: "center", width: 280,
              bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#f4f6f8",
              borderRadius: "12px", border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <SearchIcon sx={{ color: "text.disabled", fontSize: 19, mr: 1 }} />
            <InputBase
              placeholder="Search vehicle or driver…"
              sx={{ flex: 1, fontSize: "0.85rem" }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Paper>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={refetchToday}
            sx={{ borderRadius: "12px", fontWeight: 700, whiteSpace: "nowrap", px: 2 }}
          >
            Refresh
          </Button>
        </Stack>
      </Stack>

      {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: "Today's Weight", value: fmtWeight(productionSummary?.daily?.totalNetWeight), icon: ScaleIcon, accent: theme.palette.primary.main },
          { label: "Today's Trips", value: productionSummary?.daily?.totalTrips ?? 0, icon: DirectionsCarIcon, accent: "#10b981" },
          { label: "Weekly Weight", value: fmtWeight(productionSummary?.weekly?.totalNetWeight), icon: TrendingUpIcon, accent: "#f59e0b" },
          { label: "Monthly Weight", value: fmtWeight(productionSummary?.monthly?.totalNetWeight), icon: CalendarMonthIcon, accent: "#8b5cf6" },
        ].map((s) => (
          <Grid item xs={12} sm={6} md={3} key={s.label}>
            <StatCard {...s} loading={productionLoading} />
          </Grid>
        ))}
      </Grid>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <Card sx={{ borderRadius: "16px", border: `1px solid ${theme.palette.divider}`, bgcolor: isDark ? "rgba(18,22,30,0.6)" : "#fff", mb: 2.5 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ px: 1.5, "& .MuiTab-root": { fontWeight: 700, fontSize: "0.85rem", minHeight: 52, gap: 0.5 } }}
        >
          <Tab icon={<LocalShippingIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Today Sheet" />
          <Tab icon={<HistoryIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="History" />
        </Tabs>
      </Card>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 0 — TODAY SHEET
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 0 && (
        <Fade in>
          <Card sx={{ borderRadius: "16px", border: `1px solid ${theme.palette.divider}`, bgcolor: isDark ? "rgba(18,22,30,0.6)" : "#fff" }}>
            <CardContent sx={{ p: "24px !important" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.3 }}>Live Entry Sheet</Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 2.5 }}>
                Log empty weight on entry · Complete row when loaded vehicle exits
              </Typography>

              {newRowError && <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }}>{newRowError}</Alert>}

              <Box sx={{ overflowX: "auto" }}>
                <Box sx={{ minWidth: 1480 }}>

                  {/* Add row */}
                  <Box sx={{
                    display: "grid", gridTemplateColumns: TODAY_COLS, gap: 1, p: 1.2,
                    borderRadius: "12px", mb: 1.5,
                    bgcolor: isDark ? "rgba(59,130,246,0.06)" : "#f0f7ff",
                    border: `1.5px dashed ${theme.palette.primary.main}44`,
                  }}>
                    <TextField label="Vehicle No." size="small" value={newRow.vehicleNumber}
                      onChange={(e) => handleNewRowChange("vehicleNumber", e.target.value.toUpperCase())} />
                    <TextField label="Driver Name" size="small" value={newRow.driverName}
                      onChange={(e) => handleNewRowChange("driverName", e.target.value)} />
                    <TextField label="Empty (kg)" size="small" type="number" value={newRow.emptyWeight}
                      onChange={(e) => handleNewRowChange("emptyWeight", e.target.value)}
                      helperText={prevWeightHint || " "} />
                    <TextField label="Remarks" size="small" value={newRow.remarks}
                      onChange={(e) => handleNewRowChange("remarks", e.target.value)} />
                    <Box /><Box /><Box /><Box />
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddRow}
                      sx={{ fontWeight: 700, borderRadius: "10px", height: 40, alignSelf: "center" }}>
                      Add Row
                    </Button>
                  </Box>

                  {/* Header */}
                  <ColHeader cols={TODAY_COLS} headers={["Vehicle", "Driver", "Empty", "Loaded", "Entry Time", "Exit Time", "Net Weight", "Status", "Actions"]} />

                  {/* Rows */}
                  {todayLoading ? (
                    <Box sx={{ py: 8, textAlign: "center" }}><CircularProgress /></Box>
                  ) : filteredTodayEntries.length === 0 ? (
                    <Alert severity="info" sx={{ borderRadius: "10px" }}>No weighbridge entries found</Alert>
                  ) : (
                    <Stack spacing={0.75}>
                      {filteredTodayEntries.map((row) => {
                        const isEditing = editingId === row._id;
                        return (
                          <Box key={row._id} sx={{ ...rowSx(isEditing), gridTemplateColumns: TODAY_COLS }}>
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
                                  <Button size="small" variant="contained" onClick={() => saveEdit(row._id)} sx={{ fontWeight: 700, borderRadius: "8px", fontSize: "0.75rem" }}>Save</Button>
                                  <Button size="small" variant="outlined" onClick={cancelEdit} sx={{ fontWeight: 700, borderRadius: "8px", fontSize: "0.75rem" }}>Cancel</Button>
                                </Stack>
                              </>
                            ) : (
                              <>
                                <RowCell sx={{ fontWeight: 800 }}>{row.vehicleNumber}</RowCell>
                                <RowCell>{row.driverName || "—"}</RowCell>
                                <RowCell>{fmtWeight(row.emptyWeight)}</RowCell>
                                <RowCell>{fmtWeight(row.loadedWeight)}</RowCell>
                                <RowCell sx={{ color: "text.secondary", fontSize: "0.78rem" }}>{fmtDateTime(row.entryTime)}</RowCell>
                                <RowCell sx={{ color: "text.secondary", fontSize: "0.78rem" }}>{fmtDateTime(row.exitTime)}</RowCell>
                                <RowCell sx={{ fontWeight: 900, color: "primary.main" }}>{fmtWeight(row.netWeight)}</RowCell>
                                <Chip size="small" label={row.status} color={row.status === "completed" ? "success" : "warning"} sx={{ fontWeight: 700, fontSize: "0.68rem" }} />
                                <Stack direction="row" spacing={0.5}>
                                  {row.status === "open" && (
                                    <Tooltip title="Mark as completed">
                                      <IconButton size="small" color="success" sx={actionBtnSx} onClick={() => setCompleteDialog({ open: true, row })}>
                                        <CheckCircleIcon sx={{ fontSize: 17 }} />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                  <Tooltip title="Edit">
                                    <IconButton size="small" sx={actionBtnSx} onClick={() => startEdit(row)}>
                                      <EditIcon sx={{ fontSize: 17, color: "primary.main" }} />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete">
                                    <IconButton size="small" sx={actionBtnSx} onClick={() => setConfirmDialog({ open: true, id: row._id })}>
                                      <DeleteIcon sx={{ fontSize: 17, color: "error.main" }} />
                                    </IconButton>
                                  </Tooltip>
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
                <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                  <Pagination page={todayPage} count={todayPagination.totalPages} onChange={(_, v) => setTodayPage(v)} color="primary" />
                </Box>
              )}
            </CardContent>
          </Card>
        </Fade>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1 — HISTORY
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 1 && (
        <Fade in>
          <Card sx={{ borderRadius: "16px", border: `1px solid ${theme.palette.divider}`, bgcolor: isDark ? "rgba(18,22,30,0.6)" : "#fff" }}>
            <CardContent sx={{ p: "24px !important" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.3 }}>Daily History Sheets</Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 2.5 }}>
                Day-wise weighbridge summaries · Open any date to inspect all entries
              </Typography>

              {historyLoading ? (
                <Box sx={{ py: 8, textAlign: "center" }}><CircularProgress /></Box>
              ) : historySummary.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: "10px" }}>No history records found</Alert>
              ) : (
                <Stack spacing={0.75}>
                  <ColHeader cols={HISTORY_COLS} headers={["Date", "Entries", "Completed", "Open", "Total Weight", "Action"]} />
                  {historySummary.map((item) => (
                    <Box key={item.date} sx={{ ...rowSx(false), gridTemplateColumns: HISTORY_COLS }}>
                      <RowCell sx={{ fontWeight: 800 }}>{fmtDate(item.date)}</RowCell>
                      <RowCell>{item.totalEntries}</RowCell>
                      <RowCell sx={{ color: "success.main", fontWeight: 700 }}>{item.completedEntries}</RowCell>
                      <RowCell sx={{ color: "warning.main", fontWeight: 700 }}>{item.openEntries}</RowCell>
                      <RowCell sx={{ fontWeight: 900, color: "primary.main" }}>{fmtWeight(item.totalNetWeight)}</RowCell>
                      <Button variant="outlined" size="small" startIcon={<VisibilityIcon sx={{ fontSize: 15 }} />}
                        onClick={() => openDayView(item.date)}
                        sx={{ fontWeight: 700, borderRadius: "8px", fontSize: "0.75rem" }}>
                        View Day
                      </Button>
                    </Box>
                  ))}
                </Stack>
              )}

              {historyPagination?.totalPages > 1 && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                  <Pagination page={historyPage} count={historyPagination.totalPages} onChange={(_, v) => setHistoryPage(v)} color="primary" />
                </Box>
              )}
            </CardContent>
          </Card>
        </Fade>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          DAY VIEW DIALOG
      ══════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        fullWidth maxWidth="xl"
        TransitionComponent={Fade}
        PaperProps={{ sx: { borderRadius: "18px", border: `1px solid ${theme.palette.divider}` } }}
      >
        <DialogTitle sx={{ fontWeight: 900, pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <CalendarMonthIcon color="primary" />
            <span>Daily Sheet — {selectedDate ? fmtDate(selectedDate) : "—"}</span>
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { label: "Total Trips", value: selectedDaySummary?.totalTrips ?? 0 },
              { label: "Total Net Weight", value: fmtWeight(selectedDaySummary?.totalNetWeight) },
            ].map((s) => (
              <Grid item xs={12} md={6} key={s.label}>
                <Card variant="outlined" sx={{ borderRadius: "12px" }}>
                  <CardContent sx={{ py: "14px !important", px: "18px !important" }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.67rem" }}>{s.label}</Typography>
                    <Typography variant="h6" fontWeight={900} sx={{ mt: 0.4 }}>{s.value}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {selectedDayLoading ? (
            <Box sx={{ py: 8, textAlign: "center" }}><CircularProgress /></Box>
          ) : selectedDayEntries.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: "10px" }}>No entries found for this day</Alert>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <Box sx={{ minWidth: 1260 }}>
                <ColHeader cols={DAY_VIEW_COLS} headers={["Vehicle", "Driver", "Empty", "Loaded", "Entry Time", "Exit Time", "Net", "Status"]} />
                <Stack spacing={0.75}>
                  {selectedDayEntries.map((row) => (
                    <Box key={row._id} sx={{ ...rowSx(false), gridTemplateColumns: DAY_VIEW_COLS }}>
                      <RowCell sx={{ fontWeight: 800 }}>{row.vehicleNumber}</RowCell>
                      <RowCell>{row.driverName || "—"}</RowCell>
                      <RowCell>{fmtWeight(row.emptyWeight)}</RowCell>
                      <RowCell>{fmtWeight(row.loadedWeight)}</RowCell>
                      <RowCell sx={{ color: "text.secondary", fontSize: "0.78rem" }}>{fmtDateTime(row.entryTime)}</RowCell>
                      <RowCell sx={{ color: "text.secondary", fontSize: "0.78rem" }}>{fmtDateTime(row.exitTime)}</RowCell>
                      <RowCell sx={{ fontWeight: 900, color: "primary.main" }}>{fmtWeight(row.netWeight)}</RowCell>
                      <Chip size="small" label={row.status} color={row.status === "completed" ? "success" : "warning"} sx={{ fontWeight: 700, fontSize: "0.68rem" }} />
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Box>
          )}

          {selectedDayPagination?.totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <Pagination page={selectedDayPage} count={selectedDayPagination.totalPages} onChange={(_, v) => setSelectedDayPage(v)} color="primary" />
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: "14px 22px" }}>
          <Button onClick={() => setViewDialogOpen(false)} variant="outlined" sx={{ fontWeight: 700, borderRadius: "10px" }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ── Confirm Delete Dialog ───────────────────────────────────────────── */}
      <ConfirmDialog
        open={confirmDialog.open}
        title="Delete Entry?"
        message="This action cannot be undone. The weighbridge entry will be permanently removed."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDialog({ open: false, id: null })}
      />

      {/* ── Complete Entry Dialog ───────────────────────────────────────────── */}
      <CompleteDialog
        open={completeDialog.open}
        row={completeDialog.row}
        onConfirm={handleCompleteConfirm}
        onCancel={() => setCompleteDialog({ open: false, row: null })}
      />
    </Box>
  );
}