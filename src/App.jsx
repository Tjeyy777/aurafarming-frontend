import React, { useState, useMemo, useCallback } from "react";
import {
  ThemeProvider, createTheme, Box, Container, Typography,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  MenuItem, TextField, Alert, Stack, Chip, CircularProgress,
  ToggleButtonGroup, ToggleButton
} from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import DateRangeIcon from "@mui/icons-material/DateRange";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableChartIcon from "@mui/icons-material/TableChart";
import { getDesignTokens } from "./theme";
import Layout from "./components/Layout";
import LoginPage from "./components/auth/LoginPage";
import { useAuthStore } from "./store/useAuthStore";

// Page Modules
import AttendancePage from "./components/attendance/AttendancePage";
import ConsumablesPage from "./components/ConsumablesPage";
import EmployeesPage from "./components/EmployeesPage";
import ExplosivesPage from "./components/ExplosivesPage";
import MachineryDashboard from "./components/machinary/MachinarydashBoard";
import DieselPage from "./components/DieselPage";
import ExpensesPage from "./components/ExpensesPage";
import WeighbridgePage from "./components/WeighbridgePage";
import RentedMachineryPage from "./components/RentedMachinery/RentedMachineryPage";
import RentedVehicleMasterPage from "./components/RentedMachinery/RentedVehicalMasterPage";

// Hooks for PDF summary
import { useInventory } from "./hooks/useInventory";
import { useConsumables } from "./hooks/useConsumables";
import { useExpenses } from "./hooks/useExpenses";
import { useDiesel } from "./hooks/useDiesel";
import { useEmployees } from "./hooks/useEmployees";
import { useMachines } from "./hooks/useMachinery";
import { useWeighbridge } from "./hooks/useWighbridge";
import { useAttendance } from "./hooks/useAttendence";

// PDF & Excel Generators
import { generateQuarryPDF, getDateRange } from "./utils/pdfGenerator";
import { generateFullExcel } from "./utils/excelGenerator";

// Pages that should use full viewport width (no Container constraint)
const FULL_WIDTH_PAGES = ["Weighbridge"];

function App() {
  const [mode, setMode] = useState("dark");
  const { user, isAuthenticated, logout } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const [currentPage, setCurrentPage] = useState(isAdmin ? "Dashboard" : "Employees");

  // PDF report state
  const [openReportDialog, setOpenReportDialog] = useState(false);
  const [reportPeriod, setReportPeriod] = useState("daily");
  const [customDate, setCustomDate] = useState(new Date().toISOString().split("T")[0]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Data hooks for PDF
  const { items: explosiveItems } = useInventory();
  const { items: consumableItems } = useConsumables();
  const { expenses } = useExpenses();
  const { entries: dieselEntries } = useDiesel();
  const { employees } = useEmployees();
  const { machines } = useMachines();
  const { todayEntries } = useWeighbridge({ todayPage: 1, todayLimit: 500 });
  const { getAttendanceByDate } = useAttendance();

  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);
  const toggleTheme = () => setMode((prev) => (prev === "light" ? "dark" : "light"));
  const isFullWidth = FULL_WIDTH_PAGES.includes(currentPage);

  const handleLogout = () => {
    logout();
    setCurrentPage("Dashboard");
  };

  // ─── Compute preview date range for display ───
  const previewRange = useMemo(() => {
    const { start, end } = getDateRange(reportPeriod, customDate);
    const fmt = (d) => d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    return `${fmt(start)} — ${fmt(end)}`;
  }, [reportPeriod, customDate]);

  // ─── Generate PDF ───
  const handleGeneratePDF = useCallback(async () => {
    setIsGenerating(true);
    try {
      // Fetch attendance data for the period
      let attendanceRecords = [];
      try {
        const { start, end } = getDateRange(reportPeriod, customDate);
        // Fetch attendance for each day in range
        const days = [];
        const cur = new Date(start);
        while (cur <= end) {
          days.push(cur.toISOString().split("T")[0]);
          cur.setDate(cur.getDate() + 1);
        }
        const results = await Promise.all(days.map((d) => getAttendanceByDate(d)));
        results.forEach((r) => {
          if (r?.data) attendanceRecords.push(...r.data);
        });
      } catch (e) {
        console.warn("Could not fetch attendance for PDF:", e);
      }

      // Use a small timeout to let the UI update with the loading state
      await new Promise((r) => setTimeout(r, 100));

      generateQuarryPDF({
        period: reportPeriod,
        customDate,
        employees,
        explosiveItems,
        consumableItems,
        expenses,
        dieselEntries,
        machines,
        weighbridgeEntries: todayEntries,
        attendanceRecords,
        rentedLogs: [], // Rented logs are fetched via react-query inside the page, passing empty for now
      });
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Check console for details.");
    } finally {
      setIsGenerating(false);
      setOpenReportDialog(false);
    }
  }, [reportPeriod, customDate, employees, explosiveItems, consumableItems, expenses, dieselEntries, machines, todayEntries, getAttendanceByDate]);

  // ─── Generate Excel ───
  const handleGenerateExcel = useCallback(async () => {
    setIsGenerating(true);
    try {
      await new Promise((r) => setTimeout(r, 100));
      generateFullExcel({
        period: reportPeriod,
        customDate,
        employees,
        explosiveItems,
        consumableItems,
        expenses,
        dieselEntries,
        machines,
        weighbridgeEntries: todayEntries,
        attendanceRecords: [],
        rentedLogs: [],
      });
    } catch (err) {
      console.error("Excel generation failed:", err);
      alert("Failed to generate Excel. Check console.");
    } finally {
      setIsGenerating(false);
      setOpenReportDialog(false);
    }
  }, [reportPeriod, customDate, employees, explosiveItems, consumableItems, expenses, dieselEntries, machines, todayEntries]);

  const renderPage = () => {
    switch (currentPage) {
      case "Employees":   return <EmployeesPage />;
      case "Attendance":  return <AttendancePage />;
      case "Explosives":  return <ExplosivesPage />;
      case "Consumables": return <ConsumablesPage />;
      case "Machinery":   return <MachineryDashboard />;
      case "Diesel":      return <DieselPage />;
      case "Expenses":    return <ExpensesPage />;
      case "Weighbridge": return <WeighbridgePage />;
      case "Rented Logs": return <RentedMachineryPage />;
      case "Add Rented Vehicle": return <RentedVehicleMasterPage />;
      default:
        return (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <Typography variant="h3" sx={{ fontWeight: 800, color: "primary.main", mb: 2 }}>
              {currentPage.toUpperCase()}
            </Typography>
            <Typography sx={{ color: "text.secondary", fontFamily: "monospace" }}>
              [ STATUS: SYSTEM_OPERATIONAL // MODE: {mode.toUpperCase()} ]
            </Typography>
          </Box>
        );
    }
  };

  if (!isAuthenticated) {
    return (
      <ThemeProvider theme={theme}>
        <LoginPage />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Layout
        onNavigate={setCurrentPage}
        currentPage={currentPage}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
        onGenerateReport={() => setOpenReportDialog(true)}
      >
        <Box
          sx={{
            minHeight: "100vh",
            bgcolor: "background.default",
            position: "relative",
            transition: "background-color 0.3s ease",
            backgroundImage:
              mode === "dark"
                ? `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`
                : `linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        >
          {isFullWidth ? (
            <Box sx={{ pt: 2, pb: 6, px: { xs: 2, sm: 3, md: 4 } }}>
              {renderPage()}
            </Box>
          ) : (
            <Container maxWidth="xl" sx={{ pt: 2, pb: 6 }}>
              {renderPage()}
            </Container>
          )}
        </Box>
      </Layout>

      {/* ═══ PDF Report Dialog ═══ */}
      <Dialog
        open={openReportDialog}
        onClose={() => !isGenerating && setOpenReportDialog(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 4, overflow: "visible" } }}
      >
        <DialogTitle sx={{ fontWeight: 900, pb: 0.5, fontSize: "1.3rem" }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <PictureAsPdfIcon color="error" />
            <span>Generate Summary Report</span>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: "16px !important" }}>
          <Alert severity="info" sx={{ fontSize: 13, borderRadius: 2 }}>
            This PDF will include data from <strong>all modules</strong> — Employees, Attendance, Weighbridge, Explosives, Consumables, Machinery, Diesel, Expenses &amp; Rented Logs.
          </Alert>

          {/* Period Selector */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", mb: 1, display: "block", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Report Period
            </Typography>
            <ToggleButtonGroup
              value={reportPeriod}
              exclusive
              onChange={(_, v) => v && setReportPeriod(v)}
              fullWidth
              sx={{
                "& .MuiToggleButton-root": {
                  py: 1.5,
                  fontWeight: 700,
                  textTransform: "none",
                  borderRadius: "12px !important",
                  border: "1px solid",
                  borderColor: "divider",
                  mx: 0.5,
                  "&.Mui-selected": {
                    bgcolor: "primary.main",
                    color: "#fff",
                    "&:hover": { bgcolor: "primary.dark" },
                  },
                },
              }}
            >
              <ToggleButton value="daily">
                <CalendarTodayIcon sx={{ fontSize: 18, mr: 1 }} /> Day
              </ToggleButton>
              <ToggleButton value="weekly">
                <DateRangeIcon sx={{ fontSize: 18, mr: 1 }} /> Week
              </ToggleButton>
              <ToggleButton value="monthly">
                <CalendarMonthIcon sx={{ fontSize: 18, mr: 1 }} /> Month
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Date Picker */}
          <TextField
            type="date"
            label={
              reportPeriod === "daily"
                ? "Select Date"
                : reportPeriod === "weekly"
                ? "Pick any day in the week"
                : "Pick any day in the month"
            }
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            sx={{ "& fieldset": { borderRadius: "12px" } }}
          />

          {/* Preview */}
          <Box sx={{ p: 2, borderRadius: 3, bgcolor: "action.hover", border: "1px dashed", borderColor: "divider" }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Date Range Preview
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 800, mt: 0.5, color: "primary.main" }}>
              {previewRange}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Chip
                label={reportPeriod === "daily" ? "Single Day" : reportPeriod === "weekly" ? "Full Week (Mon–Sun)" : "Full Month"}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
            </Stack>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={() => setOpenReportDialog(false)} disabled={isGenerating} sx={{ fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            variant="outlined"
            color="success"
            onClick={handleGenerateExcel}
            disabled={isGenerating}
            startIcon={isGenerating ? <CircularProgress size={18} /> : <TableChartIcon />}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Excel
          </Button>
          <Button
            variant="contained"
            onClick={handleGeneratePDF}
            disabled={isGenerating}
            startIcon={isGenerating ? <CircularProgress size={18} color="inherit" /> : <PictureAsPdfIcon />}
            sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}
          >
            {isGenerating ? "Generating..." : "Download PDF"}
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}

export default App;