import React, { useState, useMemo } from "react";
import { ThemeProvider, createTheme, Box, Container, Typography } from "@mui/material";
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

// Pages that should use full viewport width (no Container constraint)
const FULL_WIDTH_PAGES = ["Weighbridge"];

function App() {
  const [mode, setMode] = useState("dark");
  const [currentPage, setCurrentPage] = useState("Dashboard");

  const { isAuthenticated, logout } = useAuthStore();

  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);
  const toggleTheme = () => setMode((prev) => (prev === "light" ? "dark" : "light"));
  const isFullWidth = FULL_WIDTH_PAGES.includes(currentPage);

  const handleLogout = () => {
    logout();
    setCurrentPage("Dashboard");
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
            // Full-width pages: no Container, just responsive padding
            <Box sx={{ pt: 2, pb: 6, px: { xs: 2, sm: 3, md: 4 } }}>
              {renderPage()}
            </Box>
          ) : (
            // All other pages: constrained by Container as before
            <Container maxWidth="xl" sx={{ pt: 2, pb: 6 }}>
              {renderPage()}
            </Container>
          )}
        </Box>
      </Layout>
    </ThemeProvider>
  );
}

export default App;