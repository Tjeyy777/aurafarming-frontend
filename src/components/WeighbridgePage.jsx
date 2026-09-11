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
import CloseIcon from "@mui/icons-material/Close";
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
import { useMaterials } from "../hooks/useMaterials";
import ExportDialog, { ExportButton } from "./ExportDialog";
import PageHeader from "./common/PageHeader";
import { generateWeighbridgePDF } from "../utils/pdfGenerator";
import { generateWeighbridgeExcel } from "../utils/excelGenerator";
import { fetchAllWeighbridgeEntries } from "../utils/exportDataFetcher";

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_FORM = { vehicleNumber: "", driverName: "", emptyWeight: "", materialId: "" };

const TODAY_COLS = "50px 150px 140px 110px 110px 140px 150px 150px 110px 90px 120px";
const HISTORY_COLS = "180px 120px 130px 100px 160px 140px";
const DAY_VIEW_COLS = "180px 150px 130px 130px 170px 170px 130px 110px";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDateTime = (v) => (!v ? "—" : new Date(v).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }));
const fmtDate = (v) => (!v ? "—" : new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }));
const fmtWeight = (v) => (v == null || v === "" ? "—" : `${Number(v).toLocaleString()} kg`);

const toLocalISOString = (dateOrStr) => {
  if (!dateOrStr) return "";
  const date = new Date(dateOrStr);
  if (isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, loading, accent }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
          <Box>
            <Typography variant="overline" sx={{ color: "text.secondary", display: "block", lineHeight: 1.3 }}>
              {label}
            </Typography>
            <Typography
              sx={{
                mt: 0.75, fontFamily: (t) => t.typography.fontFamilyMono,
                fontVariantNumeric: "tabular-nums", fontSize: "1.5rem", fontWeight: 600,
                letterSpacing: "-0.01em", lineHeight: 1.2, color: accent || "text.primary",
              }}
            >
              {loading ? <CircularProgress size={18} /> : value}
            </Typography>
          </Box>
          {Icon && <Icon sx={{ fontSize: 18, color: "text.disabled" }} />}
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
        <Typography key={h} variant="caption" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "text.secondary", fontSize: "0.68rem" }}>
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
      <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>{title}</DialogTitle>
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
      <DialogTitle sx={{ fontWeight: 600 }}>Complete Entry — {row?.vehicleNumber}</DialogTitle>
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

  const { data: materials = [] } = useMaterials();

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
  const [exportOpen, setExportOpen] = useState(false);

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
      materialId: newRow.materialId || undefined,
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
      materialId: row.materialId?._id || "",
      entryTime: row.entryTime ? toLocalISOString(row.entryTime) : "",
      exitTime: row.exitTime ? toLocalISOString(row.exitTime) : "",
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
        materialId: editForm.materialId || null,
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
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: "1600px", mx: "auto", pb: 10, width: "100%" }}>

      {/* ── Header ── */}
      <PageHeader
        icon={ScaleIcon}
        title="Weighbridge"
        subtitle="Live entries and historical logs"
        actions={(
          <Stack direction="row" spacing={1.5}>
            <Paper variant="outlined" sx={{ px: 1.5, py: 0.25, display: "flex", alignItems: "center", width: 240, borderRadius: "8px" }}>
              <SearchIcon sx={{ color: "text.disabled", fontSize: 18, mr: 1 }} />
              <InputBase placeholder="Search" sx={{ flex: 1, fontSize: "0.875rem" }} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </Paper>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={refetchToday}>Refresh</Button>
            <ExportButton onClick={() => setExportOpen(true)} />
          </Stack>
        )}
      />

      {/* Stat Cards */}
      {(() => {
        // Compute material breakdown from today's entries
        const materialBreakdown = {};
        const uniqueVehiclesToday = new Set();
        (todayEntries || []).forEach(e => {
          if (e.vehicleNumber) uniqueVehiclesToday.add(e.vehicleNumber);
          if (e.status === 'completed') {
            const mat = e.materialId?.name || 'Other';
            if (!materialBreakdown[mat]) materialBreakdown[mat] = { trips: 0, weight: 0 };
            materialBreakdown[mat].trips += 1;
            materialBreakdown[mat].weight += Number(e.netWeight || 0);
          }
        });

        const baseCards = [
          { label: "Today's weight", value: fmtWeight(productionSummary?.daily?.totalNetWeight), icon: ScaleIcon },
          { label: "Today's trips", value: productionSummary?.daily?.totalTrips ?? 0, icon: DirectionsCarIcon },
          { label: "Daily vehicles", value: uniqueVehiclesToday.size, icon: LocalShippingIcon },
          { label: "Weekly weight", value: fmtWeight(productionSummary?.weekly?.totalNetWeight), icon: TrendingUpIcon },
          { label: "Monthly weight", value: fmtWeight(productionSummary?.monthly?.totalNetWeight), icon: CalendarMonthIcon },
        ];

        const materialCards = Object.keys(materialBreakdown).map(mat => ({
          label: mat.charAt(0).toUpperCase() + mat.slice(1),
          value: `${materialBreakdown[mat].trips} trips · ${materialBreakdown[mat].weight.toLocaleString()} kg`,
          icon: ScaleIcon,
        }));

        const allCards = [...baseCards, ...materialCards];

        return (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {allCards.map((s) => (
              <Grid item xs={12} sm={6} md={3} key={s.label}><StatCard {...s} loading={productionLoading} /></Grid>
            ))}
          </Grid>
        );
      })()}

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
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "error.main" }}>{selectedIds.length} items selected</Typography>
                    </Stack>
                    <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={() => setConfirmDialog({ open: true, ids: selectedIds })} sx={{ fontWeight: 600, borderRadius: "10px" }}>Delete Selected</Button>
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
                      <Box />
                      <TextField
                        select
                        label="Material"
                        size="small"
                        value={newRow.materialId}
                        onChange={(e) => handleNewRowChange("materialId", e.target.value)}
                        SelectProps={{ native: true }}
                      >
                        <option value=""></option>
                        {materials.map((m) => (
                          <option key={m._id} value={m._id}>
                            {m.name}{m.ratePerTon ? ` (₹${m.ratePerTon}/T)` : ""}
                          </option>
                        ))}
                      </TextField>
                      <Box /><Box /><Box /><Box />
                      <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddRow} sx={{ fontWeight: 700, borderRadius: "10px", height: 40, alignSelf: "center" }}>Add</Button>
                    </Box>
                    {newRowError && (
                      <Alert severity="error" sx={{ mb: 1.5, borderRadius: "10px" }} onClose={() => setNewRowError("")}>
                        {newRowError}
                      </Alert>
                    )}

                    <ColHeader cols={TODAY_COLS} headers={["Vehicle", "Driver", "Empty", "Loaded", "Material", "Entry Time", "Exit Time", "Net Weight", "Status", "Actions"]} showCheckbox isAllSelected={selectedIds.length > 0 && selectedIds.length === filteredTodayEntries.length} isIndeterminate={selectedIds.length > 0 && selectedIds.length < filteredTodayEntries.length} onSelectAll={handleSelectAll} />

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
                                  <TextField
                                    select
                                    size="small"
                                    value={editForm.materialId}
                                    onChange={(e) => setEditForm((p) => ({ ...p, materialId: e.target.value }))}
                                    SelectProps={{ native: true }}
                                  >
                                    <option value=""></option>
                                    {materials.map((m) => (
                                      <option key={m._id} value={m._id}>
                                        {m.name}{m.ratePerTon ? ` (₹${m.ratePerTon}/T)` : ""}
                                      </option>
                                    ))}
                                  </TextField>
                                  <TextField size="small" type="datetime-local" value={editForm.entryTime} onChange={(e) => setEditForm((p) => ({ ...p, entryTime: e.target.value }))} />
                                  <TextField size="small" type="datetime-local" value={editForm.exitTime} onChange={(e) => setEditForm((p) => ({ ...p, exitTime: e.target.value }))} />
                                  <RowCell sx={{ fontWeight: 600, color: "primary.main" }}>{fmtWeight(row.netWeight)}</RowCell>
                                  <Chip size="small" label={row.status} color={row.status === "completed" ? "success" : "warning"} />
                                  <Stack direction="row" spacing={0.75}>
                                    <Button size="small" variant="contained" onClick={() => saveEdit(row._id)}>Save</Button>
                                    <Button size="small" onClick={cancelEdit}>Cancel</Button>
                                  </Stack>
                                </>
                              ) : (
                                <>
                                  <RowCell sx={{ fontWeight: 600 }}>{row.vehicleNumber}</RowCell>
                                  <RowCell>{row.driverName || "—"}</RowCell>
                                  <RowCell>{fmtWeight(row.emptyWeight)}</RowCell>
                                  <RowCell>{fmtWeight(row.loadedWeight)}</RowCell>
                                  <RowCell>{row.materialId?.name || row.remarks || "—"}</RowCell>
                                  <RowCell sx={{ fontSize: "0.78rem" }}>{fmtDateTime(row.entryTime)}</RowCell>
                                  <RowCell sx={{ fontSize: "0.78rem" }}>{fmtDateTime(row.exitTime)}</RowCell>
                                  <RowCell sx={{ fontWeight: 600, color: "primary.main" }}>{fmtWeight(row.netWeight)}</RowCell>
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
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Historical Summary</Typography>
                <TextField
                  type="date"
                  size="small"
                  label="Jump to Date"
                  InputLabelProps={{ shrink: true }}
                  onChange={(e) => {
                    if (e.target.value) {
                      openDayView(e.target.value);
                    }
                  }}
                  sx={{ bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#fff", borderRadius: "8px", '& fieldset': { borderRadius: '8px' } }}
                />
            </Stack>
            <Card sx={{ borderRadius: "16px" }}>
              <CardContent sx={{ p: "24px !important" }}>
              {historyLoading ? (
                <Box sx={{ py: 8, textAlign: "center" }}><CircularProgress /></Box>
              ) : (
                <Stack spacing={0.75}>
                  <ColHeader cols={HISTORY_COLS} headers={["Date", "Entries", "Completed", "Open", "Total Weight", "Action"]} />
                  {historySummary.map((item) => (
                    <Box key={item.date} sx={{ ...rowSx(false, false), gridTemplateColumns: HISTORY_COLS }}>
                      <RowCell sx={{ fontWeight: 600 }}>{fmtDate(item.date)}</RowCell>
                      <RowCell>{item.totalEntries}</RowCell>
                      <RowCell color="success.main">{item.completedEntries}</RowCell>
                      <RowCell color="warning.main">{item.openEntries}</RowCell>
                      <RowCell sx={{ fontWeight: 600, color: "primary.main" }}>{fmtWeight(item.totalNetWeight)}</RowCell>
                      <Button variant="outlined" size="small" startIcon={<VisibilityIcon />} onClick={() => openDayView(item.date)}>View</Button>
                    </Box>
                  ))}
                </Stack>
              )}
              {historyPagination?.totalPages > 1 && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}><Pagination page={historyPage} count={historyPagination.totalPages} onChange={(_, v) => setHistoryPage(v)} color="primary" /></Box>
              )}
            </CardContent>
          </Card>
          </Box>
        </Fade>
      )}

      <ConfirmDialog open={confirmDialog.open} title="Delete Entries" count={confirmDialog.ids.length} onConfirm={handleDeleteConfirm} onCancel={() => setConfirmDialog({ open: false, ids: [] })} />
      <CompleteDialog open={completeDialog.open} row={completeDialog.row} onConfirm={(w) => completeEntry({ id: completeDialog.row._id, payload: { loadedWeight: w } }).then(() => setCompleteDialog({ open: false, row: null }))} onCancel={() => setCompleteDialog({ open: false, row: null })} />

      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: "20px", height: "85vh", backgroundImage: "none" } }}>
        <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8faff", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" alignItems="center" spacing={2}>
              <Box sx={{ p: 1, borderRadius: "8px", bgcolor: "surface2", color: "text.secondary", display: "flex", border: (t) => `1px solid ${t.palette.divider}` }}>
                  <CalendarMonthIcon />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600, letterSpacing: "-0.02em" }}>Entries for {fmtDate(selectedDate)}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mt: 0.5 }}>View detailed logs for the selected date.</Typography>
              </Box>
          </Stack>
          <IconButton onClick={() => setViewDialogOpen(false)} sx={{ bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#fff", border: `1px solid ${theme.palette.divider}`, borderRadius: "10px" }}><CloseIcon /></IconButton>
        </Box>
        <DialogContent sx={{ p: 0, bgcolor: isDark ? "transparent" : "#fdfdfd" }}>
          {selectedDayLoading ? (
             <Box sx={{ py: 10, textAlign: "center" }}><CircularProgress /></Box>
          ) : selectedDayEntries?.length === 0 ? (
             <Box sx={{ py: 10, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <Box sx={{ p: 2, borderRadius: "50%", bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#f0f4f8" }}>
                    <LocalShippingIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                </Box>
                <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700 }}>No entries found for this date.</Typography>
             </Box>
          ) : (
            <Box sx={{ p: 3 }}>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                 <Grid item xs={12} sm={6}>
                     <Card variant="outlined" sx={{ borderRadius: "16px", bgcolor: "transparent", borderStyle: "dashed" }}>
                         <CardContent sx={{ p: "16px !important", display: "flex", alignItems: "center", gap: 2 }}>
                             <Box sx={{ p: 1.5, borderRadius: "12px", bgcolor: "success.main", color: "#fff" }}><DirectionsCarIcon /></Box>
                             <Box>
                                 <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase" }}>Total Trips</Typography>
                                 <Typography variant="h5" sx={{ fontWeight: 600, color: "text.primary" }}>{selectedDaySummary?.totalTrips || 0}</Typography>
                             </Box>
                         </CardContent>
                     </Card>
                 </Grid>
                 <Grid item xs={12} sm={6}>
                     <Card variant="outlined" sx={{ borderRadius: "16px", bgcolor: "transparent", borderStyle: "dashed" }}>
                         <CardContent sx={{ p: "16px !important", display: "flex", alignItems: "center", gap: 2 }}>
                             <Box sx={{ p: 1.5, borderRadius: "12px", bgcolor: "primary.main", color: "#fff" }}><ScaleIcon /></Box>
                             <Box>
                                 <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase" }}>Total Net Weight</Typography>
                                 <Typography variant="h5" sx={{ fontWeight: 600, color: "primary.main" }}>{fmtWeight(selectedDaySummary?.totalNetWeight || 0)}</Typography>
                             </Box>
                         </CardContent>
                     </Card>
                 </Grid>
              </Grid>

              <Box sx={{ overflowX: "auto", border: `1px solid ${theme.palette.divider}`, borderRadius: "14px", bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#fff" }}>
                <Box sx={{ minWidth: 1100, p: 1 }}>
                  <ColHeader cols={DAY_VIEW_COLS} headers={["Vehicle", "Driver", "Empty", "Loaded", "Entry Time", "Exit Time", "Net Weight", "Status"]} />
                  <Stack spacing={0.5}>
                    {selectedDayEntries?.map((row, i) => (
                      <Box key={row._id} sx={{ ...rowSx(false, false), gridTemplateColumns: DAY_VIEW_COLS, py: 1.2, px: 2, borderRadius: "10px", border: "none", borderBottom: i < selectedDayEntries.length - 1 ? `1px solid ${theme.palette.divider}` : "none", bgcolor: "transparent", '&:hover': { bgcolor: isDark ? "rgba(255,255,255,0.04)" : "#f8faff" } }}>
                        <RowCell sx={{ fontWeight: 600 }}>{row.vehicleNumber}</RowCell>
                        <RowCell sx={{ color: row.driverName ? "text.primary" : "text.disabled" }}>{row.driverName || "Unknown"}</RowCell>
                        <RowCell>{fmtWeight(row.emptyWeight)}</RowCell>
                        <RowCell>{fmtWeight(row.loadedWeight)}</RowCell>
                        <RowCell sx={{ fontSize: "0.8rem", color: "text.secondary" }}>{fmtDateTime(row.entryTime)}</RowCell>
                        <RowCell sx={{ fontSize: "0.8rem", color: "text.secondary" }}>{fmtDateTime(row.exitTime)}</RowCell>
                        <RowCell sx={{ fontWeight: 600, color: "primary.main", fontSize: "0.95rem" }}>{fmtWeight(row.netWeight)}</RowCell>
                        <Box>
                          <Chip size="small" label={row.status} sx={{ fontWeight: 700, borderRadius: "6px", textTransform: "uppercase", fontSize: "0.65rem", bgcolor: row.status === "completed" ? "success.main" : "warning.main", color: "#fff" }} />
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        {selectedDayPagination?.totalPages > 1 && (
            <DialogActions sx={{ p: 2, justifyContent: "center", borderTop: `1px solid ${theme.palette.divider}`, bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8faff" }}>
                <Pagination page={selectedDayPage} count={selectedDayPagination.totalPages} onChange={(_, v) => setSelectedDayPage(v)} color="primary" variant="outlined" shape="rounded" />
            </DialogActions>
        )}
      </Dialog>

      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        moduleName="Weighbridge"
        onExportPDF={async (period, customDate) => {
          const allEntries = await fetchAllWeighbridgeEntries();
          generateWeighbridgePDF({ entries: allEntries, period, customDate });
        }}
        onExportExcel={async (period, customDate) => {
          const allEntries = await fetchAllWeighbridgeEntries();
          generateWeighbridgeExcel({ entries: allEntries, period, customDate });
        }}
      />
    </Box>
  );
}
