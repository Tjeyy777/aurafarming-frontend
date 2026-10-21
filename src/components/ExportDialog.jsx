// src/components/ExportDialog.jsx
// Reusable export dialog for per-module PDF/Excel generation
import React, { useState, useMemo, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack,
  Typography, Box, Chip, ToggleButtonGroup, ToggleButton, TextField,
  CircularProgress, Tooltip, IconButton,
} from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import DateRangeIcon from "@mui/icons-material/DateRange";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableChartIcon from "@mui/icons-material/TableChart";
import DownloadIcon from "@mui/icons-material/Download";
import { getDateRange } from "../utils/pdfGenerator";

/**
 * @param {Object} props
 * @param {boolean} props.open
 * @param {Function} props.onClose
 * @param {string} props.moduleName - e.g. "Employees", "Diesel"
 * @param {Function} props.onExportPDF - (period, customDate) => void
 * @param {Function} props.onExportExcel - (period, customDate) => void
 */
export default function ExportDialog({ open, onClose, moduleName, onExportPDF, onExportExcel, companies, machines, initialMachineId = "" }) {
  const [period, setPeriod] = useState("daily");
  const [customDate, setCustomDate] = useState(new Date().toISOString().split("T")[0]);
  const today = new Date().toISOString().split("T")[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [selectedMachineId, setSelectedMachineId] = useState(initialMachineId || "");

  // Re-sync with the page's active machine filter each time the dialog opens
  useEffect(() => {
    if (open) setSelectedMachineId(initialMachineId || "");
  }, [open, initialMachineId]);

  const isCustom = period === "custom";
  const rangeArg = useMemo(
    () => (isCustom ? { from: fromDate, to: toDate } : customDate),
    [isCustom, fromDate, toDate, customDate]
  );
  const [loading, setLoading] = useState(false);

  const previewRange = useMemo(() => {
    const { start, end } = getDateRange(period, rangeArg);
    const fmt = (d) => d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    return `${fmt(start)} — ${fmt(end)}`;
  }, [period, rangeArg]);

  const handleExport = async (type) => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 80));
      if (type === "pdf") await onExportPDF(period, rangeArg, selectedCompanyId, selectedMachineId);
      else await onExportExcel(period, rangeArg, selectedCompanyId, selectedMachineId);
    } catch (err) {
      console.error(`${type} export failed:`, err);
      window.alert(`Export failed: ${err?.message || "Unknown error"}`);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={() => !loading && onClose()} fullWidth maxWidth="sm"
      PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <DownloadIcon color="primary" />
          <span>Export {moduleName}</span>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: "16px !important" }}>
        {/* Period selector */}
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", mb: 1, display: "block", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Period
          </Typography>
          <ToggleButtonGroup value={period} exclusive onChange={(_, v) => v && setPeriod(v)} fullWidth
            sx={{
              "& .MuiToggleButton-root": {
                py: 1.2, fontWeight: 700, textTransform: "none", borderRadius: "12px !important",
                border: "1px solid", borderColor: "divider", mx: 0.5,
                "&.Mui-selected": { bgcolor: "primary.main", color: "#fff", "&:hover": { bgcolor: "primary.dark" } },
              },
            }}>
            <ToggleButton value="daily"><CalendarTodayIcon sx={{ fontSize: 16, mr: 0.8 }} /> Day</ToggleButton>
            <ToggleButton value="weekly"><DateRangeIcon sx={{ fontSize: 16, mr: 0.8 }} /> Week</ToggleButton>
            <ToggleButton value="monthly"><CalendarMonthIcon sx={{ fontSize: 16, mr: 0.8 }} /> Month</ToggleButton>
            <ToggleButton value="custom"><DateRangeIcon sx={{ fontSize: 16, mr: 0.8 }} /> Custom</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Date picker */}
        {isCustom ? (
          <Stack direction="row" spacing={1.5}>
            <TextField type="date" label="From Date" value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); if (e.target.value > toDate) setToDate(e.target.value); }}
              fullWidth InputLabelProps={{ shrink: true }} sx={{ "& fieldset": { borderRadius: "12px" } }} />
            <TextField type="date" label="To Date" value={toDate} inputProps={{ min: fromDate }}
              onChange={(e) => setToDate(e.target.value)}
              fullWidth InputLabelProps={{ shrink: true }} sx={{ "& fieldset": { borderRadius: "12px" } }} />
          </Stack>
        ) : (
        <TextField type="date"
          label={period === "daily" ? "Select Date" : period === "weekly" ? "Pick any day in the week" : "Pick any day in the month"}
          value={customDate} onChange={(e) => setCustomDate(e.target.value)} fullWidth
          InputLabelProps={{ shrink: true }} sx={{ "& fieldset": { borderRadius: "12px" } }} />
        )}

        {machines && (
          <TextField select label="Machine Filter" value={selectedMachineId}
            onChange={(e) => setSelectedMachineId(e.target.value)} fullWidth
            SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}
            sx={{ "& fieldset": { borderRadius: "12px" } }}>
            <option value="">All</option>
            {machines.map((m) => (
              <option key={m._id} value={m._id}>{m.machineName || m.name}</option>
            ))}
          </TextField>
        )}

        {/* Company Filter (Optional) */}
        {companies && (
          <TextField
            select
            label="Select Company (Optional)"
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            fullWidth
            SelectProps={{ native: true }}
            sx={{ "& fieldset": { borderRadius: "12px" } }}
          >
            <option value="">All Companies / No Filter</option>
            {companies.map((company) => (
              <option key={company._id} value={company._id}>
                {company.name}
              </option>
            ))}
          </TextField>
        )}

        {/* Preview */}
        <Box sx={{ p: 2, borderRadius: 3, bgcolor: "action.hover", border: "1px dashed", borderColor: "divider" }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase" }}>
            Date Range
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5, color: "primary.main" }}>
            {previewRange}
          </Typography>
          <Chip label={period === "custom" ? "Custom Range" : period === "daily" ? "Single Day" : period === "weekly" ? "Full Week (Mon–Sun)" : "Full Month"}
            size="small" color="primary" variant="outlined" sx={{ fontWeight: 700, mt: 1 }} />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, pt: 1, gap: 1 }}>
        <Button onClick={onClose} disabled={loading} sx={{ fontWeight: 700 }}>Cancel</Button>
        <Button variant="outlined" color="success" onClick={() => handleExport("excel")} disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : <TableChartIcon />}
          sx={{ borderRadius: 2, fontWeight: 700 }}>
          Excel
        </Button>
        <Button variant="contained" color="error" onClick={() => handleExport("pdf")} disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <PictureAsPdfIcon />}
          sx={{ borderRadius: 2, fontWeight: 700 }}>
          PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * Small button to place in module headers. Opens the ExportDialog.
 */
export function ExportButton({ onClick }) {
  return (
    <Tooltip title="Export PDF / Excel">
      <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={onClick}
        sx={{ borderRadius: "10px", fontWeight: 700, textTransform: "none", fontSize: "0.8rem" }}>
        Export
      </Button>
    </Tooltip>
  );
}
