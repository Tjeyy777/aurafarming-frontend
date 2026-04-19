import React, { useState, useMemo } from "react";
import { ThemeProvider, createTheme, Box, Container, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button, MenuItem, TextField, Alert } from "@mui/material";
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

  // Data hooks for PDF
  const { items: explosiveItems } = useInventory();
  const { items: consumableItems } = useConsumables();
  const { expenses } = useExpenses();
  const { entries: dieselEntries } = useDiesel();
  const { employees } = useEmployees();

  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);
  const toggleTheme = () => setMode((prev) => (prev === "light" ? "dark" : "light"));
  const isFullWidth = FULL_WIDTH_PAGES.includes(currentPage);

  const handleLogout = () => {
    logout();
    setCurrentPage("Dashboard");
  };

  // ─── Filter data by period ───
  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let start;
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);

    if (reportPeriod === "daily") {
      start = today;
    } else if (reportPeriod === "weekly") {
      start = new Date(today);
      start.setDate(start.getDate() - 7);
    } else {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
    }
    return { start, end };
  };

  const filterByDate = (arr, dateField = "createdAt") => {
    const { start, end } = getDateRange();
    return arr.filter(item => {
      const d = new Date(item[dateField] || item.date || item.createdAt);
      return d >= start && d <= end;
    });
  };

  const handlePrintReport = () => {
    const { start, end } = getDateRange();
    const label = reportPeriod === "daily" ? "Daily" : reportPeriod === "weekly" ? "Weekly" : "Monthly";
    const dateStr = `${start.toLocaleDateString()} — ${end.toLocaleDateString()}`;

    const filteredExpenses = filterByDate(expenses, "date");
    const filteredDiesel = filterByDate(dieselEntries, "date");

    const totalExplosiveValue = explosiveItems.reduce((s, i) => s + i.currentStock * i.unitCost, 0);
    const totalConsumableValue = consumableItems.reduce((s, i) => s + i.currentStock * i.unitCost, 0);
    const totalExpenseAmount = filteredExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const totalDieselCost = filteredDiesel.reduce((s, e) => s + Number(e.totalCost || 0), 0);
    const totalDieselLitres = filteredDiesel.reduce((s, e) => s + Number(e.litres || 0), 0);

    const html = `
      <html>
      <head>
        <title>Quarry Pro Suite — ${label} Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #1a1a1a; }
          h1 { font-size: 22px; margin-bottom: 4px; }
          h2 { font-size: 16px; margin: 24px 0 8px; color: #f97316; border-bottom: 2px solid #f97316; padding-bottom: 4px; }
          .subtitle { color: #666; font-size: 12px; margin-bottom: 20px; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
          .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
          .card .label { font-size: 11px; color: #888; text-transform: uppercase; }
          .card .value { font-size: 18px; font-weight: 700; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
          th { background: #f3f4f6; text-align: left; padding: 8px; border: 1px solid #e5e7eb; font-weight: 600; }
          td { padding: 8px; border: 1px solid #e5e7eb; }
          .footer { margin-top: 40px; text-align: center; color: #999; font-size: 10px; }
          @media print { body { padding: 15px; } }
        </style>
      </head>
      <body>
        <h1>QUARRY PRO SUITE</h1>
        <p class="subtitle">${label} Summary Report &bull; ${dateStr} &bull; Generated: ${new Date().toLocaleString()}</p>

        <div class="grid">
          <div class="card"><div class="label">Total Employees</div><div class="value">${employees.length}</div></div>
          <div class="card"><div class="label">Explosive Items</div><div class="value">${explosiveItems.length}</div></div>
          <div class="card"><div class="label">Consumable Items</div><div class="value">${consumableItems.length}</div></div>
          <div class="card"><div class="label">Period Expenses</div><div class="value">\u20b9${totalExpenseAmount.toLocaleString()}</div></div>
        </div>

        <h2>Explosives Inventory</h2>
        <div class="grid">
          <div class="card"><div class="label">Total Items</div><div class="value">${explosiveItems.length}</div></div>
          <div class="card"><div class="label">Inventory Value</div><div class="value">\u20b9${totalExplosiveValue.toLocaleString()}</div></div>
        </div>
        <table>
          <tr><th>Item</th><th>Category</th><th>Stock</th><th>Unit</th><th>Unit Cost</th><th>Value</th></tr>
          ${explosiveItems.map(i => `<tr><td>${i.name}</td><td>${i.category}</td><td>${i.currentStock}</td><td>${i.unit}</td><td>\u20b9${i.unitCost}</td><td>\u20b9${(i.currentStock * i.unitCost).toLocaleString()}</td></tr>`).join('')}
        </table>

        <h2>Consumables Inventory</h2>
        <div class="grid">
          <div class="card"><div class="label">Total Items</div><div class="value">${consumableItems.length}</div></div>
          <div class="card"><div class="label">Inventory Value</div><div class="value">\u20b9${totalConsumableValue.toLocaleString()}</div></div>
        </div>
        <table>
          <tr><th>Item</th><th>Category</th><th>Stock</th><th>Unit</th><th>Unit Cost</th><th>Value</th></tr>
          ${consumableItems.map(i => `<tr><td>${i.name}</td><td>${i.category}</td><td>${i.currentStock}</td><td>${i.unit}</td><td>\u20b9${i.unitCost}</td><td>\u20b9${(i.currentStock * i.unitCost).toLocaleString()}</td></tr>`).join('')}
        </table>

        <h2>Diesel (${label})</h2>
        <div class="grid">
          <div class="card"><div class="label">Total Litres</div><div class="value">${totalDieselLitres}</div></div>
          <div class="card"><div class="label">Total Cost</div><div class="value">\u20b9${totalDieselCost.toLocaleString()}</div></div>
          <div class="card"><div class="label">Entries</div><div class="value">${filteredDiesel.length}</div></div>
        </div>
        ${filteredDiesel.length > 0 ? `
        <table>
          <tr><th>Date</th><th>For</th><th>Litres</th><th>Rate/L</th><th>Total</th></tr>
          ${filteredDiesel.map(e => `<tr><td>${new Date(e.date).toLocaleDateString()}</td><td>${e.dieselFor === 'machine' ? (e.machineId?.machineName || 'Machine') : e.expenseName}</td><td>${e.litres}</td><td>\u20b9${e.pricePerLitre}</td><td>\u20b9${e.totalCost}</td></tr>`).join('')}
        </table>` : '<p style="color:#888;font-size:12px;">No diesel entries for this period.</p>'}

        <h2>Expenses (${label})</h2>
        <div class="grid">
          <div class="card"><div class="label">Total Amount</div><div class="value">\u20b9${totalExpenseAmount.toLocaleString()}</div></div>
          <div class="card"><div class="label">Entries</div><div class="value">${filteredExpenses.length}</div></div>
        </div>
        ${filteredExpenses.length > 0 ? `
        <table>
          <tr><th>Date</th><th>Expense</th><th>Amount</th><th>Notes</th></tr>
          ${filteredExpenses.map(e => `<tr><td>${new Date(e.date).toLocaleDateString()}</td><td>${e.expenseName}</td><td>\u20b9${e.amount}</td><td>${e.notes || '\u2014'}</td></tr>`).join('')}
        </table>` : '<p style="color:#888;font-size:12px;">No expenses for this period.</p>'}

        <div class="footer">
          <p>Quarry Pro Suite &bull; Auto-Generated Report &bull; ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 400);
    setOpenReportDialog(false);
  };

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

      {/* PDF Report Dialog */}
      <Dialog open={openReportDialog} onClose={() => setOpenReportDialog(false)} fullWidth maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Generate Summary Report</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '10px !important' }}>
          <Alert severity="info" sx={{ fontSize: 13 }}>
            This will generate a PDF with data from all modules — Explosives, Consumables, Diesel, Expenses, and Employees.
          </Alert>
          <TextField
            select
            label="Report Period"
            value={reportPeriod}
            onChange={(e) => setReportPeriod(e.target.value)}
            fullWidth
          >
            <MenuItem value="daily">Daily (Today)</MenuItem>
            <MenuItem value="weekly">Weekly (Last 7 days)</MenuItem>
            <MenuItem value="monthly">Monthly (This month)</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenReportDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handlePrintReport} sx={{ borderRadius: 2, fontWeight: 700 }}>
            Generate PDF
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}

export default App;