import { useState, useMemo, useCallback } from "react";
import {
  Box, Stack, Button, TextField, FormControl, InputLabel, Select, MenuItem,
  Avatar, ToggleButton, ToggleButtonGroup, Typography, LinearProgress,
  InputBase, Paper, Grid, Chip, useTheme, IconButton
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { useAttendance } from "../../hooks/useAttendence";
import ReportViewer from "./reportViewer";

// ─── Mini calendar component ───
function MiniCalendar({ selectedDate, onChange, attendanceMap }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date(selectedDate);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay();
  const days = [];

  for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const monthStr = viewMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const prevMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  const nextMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
        <IconButton size="small" onClick={prevMonth}><NavigateBeforeIcon /></IconButton>
        <Typography fontWeight={800} variant="body1">{monthStr}</Typography>
        <IconButton size="small" onClick={nextMonth}><NavigateNextIcon /></IconButton>
      </Stack>

      <Grid container columns={7} spacing={0.5}>
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <Grid item xs={1} key={d}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" textAlign="center" display="block">
              {d}
            </Typography>
          </Grid>
        ))}

        {days.map((day, i) => {
          if (day === null) return <Grid item xs={1} key={`empty-${i}`} />;

          const dateStr = `${viewMonth.getFullYear()}-${String(viewMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isSelected = dateStr === selectedDate;
          const record = attendanceMap?.[dateStr];

          return (
            <Grid item xs={1} key={day}>
              <Box
                onClick={() => onChange(dateStr)}
                sx={{
                  width: "100%", aspectRatio: "1", display: "flex", alignItems: "center",
                  justifyContent: "center", borderRadius: 2, cursor: "pointer",
                  fontWeight: 700, fontSize: 13,
                  bgcolor: isSelected
                    ? "primary.main"
                    : record?.status === "present"
                    ? (isDark ? "rgba(76,175,80,0.15)" : "rgba(76,175,80,0.1)")
                    : record?.status === "absent"
                    ? (isDark ? "rgba(244,67,54,0.15)" : "rgba(244,67,54,0.1)")
                    : "transparent",
                  color: isSelected ? "#fff" : "text.primary",
                  border: isSelected ? "none" : `1px solid ${theme.palette.divider}`,
                  transition: "0.2s",
                  "&:hover": { bgcolor: isSelected ? "primary.dark" : "action.hover" },
                }}
              >
                {day}
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

// ─── PDF generator (simple) ───
function generatePDF(title, data) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const rows = data?.dailyRecords?.map((r) => `
    <tr>
      <td>${new Date(r.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</td>
      <td style="color:${r.status === "present" ? "green" : "red"}">${r.status?.toUpperCase()}</td>
      <td>${r.overtimeHour || 0}</td>
      <td>₹${(r.dailyEarnings || 0).toLocaleString("en-IN")}</td>
    </tr>
  `).join("") || "";

  printWindow.document.write(`
    <html><head><title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background: #f5f5f5; font-weight: bold; }
      h1 { color: #333; }
      .summary { display: flex; gap: 20px; margin: 15px 0; }
      .stat { padding: 10px 20px; background: #f9f9f9; border-radius: 8px; }
    </style></head>
    <body>
      <h1>${title}</h1>
      ${data?.employeeName ? `<p><strong>Employee:</strong> ${data.employeeName}</p>` : ""}
      <div class="summary">
        <div class="stat"><strong>Present:</strong> ${data?.presentDays || 0}</div>
        <div class="stat"><strong>Absent:</strong> ${data?.absentDays || 0}</div>
        <div class="stat"><strong>OT Hours:</strong> ${data?.totalOvertimeHours || 0}</div>
        <div class="stat"><strong>Total Salary:</strong> ₹${(data?.totalSalary || 0).toLocaleString("en-IN")}</div>
      </div>
      <table><thead><tr><th>Date</th><th>Status</th><th>OT Hrs</th><th>Earnings</th></tr></thead>
      <tbody>${rows}</tbody></table>
    </body></html>
  `);
  printWindow.document.close();
  printWindow.print();
}

// ─── Main History Tab ───
export default function HistoryTab({ employees, roles, parentRoles }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { getMonthlyReport, getWeeklyReport, getDailyReport, getEmployeeHistory } = useAttendance();

  const [search, setSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [reportType, setReportType] = useState("monthly");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [employeeHistory, setEmployeeHistory] = useState([]);

  // Build attendance map for calendar coloring
  const attendanceMap = useMemo(() => {
    const map = {};
    employeeHistory.forEach((r) => {
      const d = new Date(r.date).toISOString().split("T")[0];
      map[d] = r;
    });
    return map;
  }, [employeeHistory]);

  // Filter employees by search
  const filteredEmps = useMemo(() => {
    if (!search) return employees || [];
    return (employees || []).filter((e) =>
      (e.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.employeeCode || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [employees, search]);

  // Fetch employee history when selected
  const handleSelectEmployee = async (empId) => {
    setSelectedEmployee(empId);
    setReportData(null);
    if (empId) {
      const res = await getEmployeeHistory(empId);
      setEmployeeHistory(res?.data || []);
    } else {
      setEmployeeHistory([]);
    }
  };

  // Load report
  const loadReport = useCallback(async () => {
    if (!selectedEmployee) return;
    setReportLoading(true);
    setReportData(null);
    if (reportType === "daily") {
      const res = await getDailyReport(selectedEmployee, reportDate);
      setReportData(res?.data ?? null);
    } else if (reportType === "weekly") {
      const res = await getWeeklyReport(selectedEmployee, reportDate);
      setReportData(res?.data ?? null);
    } else {
      const [year, month] = selectedMonth.split("-");
      const res = await getMonthlyReport(selectedEmployee, year, month);
      setReportData(res?.data ?? null);
    }
    setReportLoading(false);
  }, [selectedEmployee, reportType, reportDate, selectedMonth]);

  const selectedEmpName = employees?.find((e) => e._id === selectedEmployee)?.name;

  return (
    <Box>
      <Grid container spacing={3}>
        {/* LEFT — Employee Search + Calendar */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2.5, borderRadius: 4,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#fff",
            }}
          >
            {/* Search */}
            <Paper
              sx={{
                p: "2px 12px", display: "flex", alignItems: "center",
                bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#f5f5f5",
                borderRadius: 2, border: `1px solid ${theme.palette.divider}`,
                boxShadow: "none", mb: 2,
              }}
            >
              <SearchIcon sx={{ color: "text.secondary", mr: 1, fontSize: 20 }} />
              <InputBase
                placeholder="Search employee..."
                sx={{ flex: 1, fontSize: "0.85rem" }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Paper>

            {/* Employee list */}
            <Box sx={{ maxHeight: 250, overflowY: "auto", mb: 2 }}>
              {filteredEmps.slice(0, 20).map((emp) => (
                <Box
                  key={emp._id}
                  onClick={() => handleSelectEmployee(emp._id)}
                  sx={{
                    display: "flex", alignItems: "center", gap: 1.5,
                    p: 1, borderRadius: 2, cursor: "pointer",
                    bgcolor: selectedEmployee === emp._id ? (isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.08)") : "transparent",
                    border: selectedEmployee === emp._id ? "1px solid" : "1px solid transparent",
                    borderColor: selectedEmployee === emp._id ? "primary.main" : "transparent",
                    "&:hover": { bgcolor: "action.hover" },
                    transition: "0.15s",
                  }}
                >
                  <Avatar src={emp.profileImage} sx={{ width: 32, height: 32, fontSize: 13 }}>
                    {emp.name?.[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight={700}>{emp.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{emp.role?.title || "—"}</Typography>
                  </Box>
                </Box>
              ))}
              {filteredEmps.length === 0 && (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                  No employees found
                </Typography>
              )}
            </Box>

            {/* Calendar */}
            {selectedEmployee && (
              <>
                <Typography variant="overline" fontWeight={800} color="text.secondary">
                  Attendance Calendar
                </Typography>
                <MiniCalendar
                  selectedDate={reportDate}
                  onChange={(d) => setReportDate(d)}
                  attendanceMap={attendanceMap}
                />
                <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                  <Chip
                    size="small"
                    sx={{ bgcolor: "rgba(76,175,80,0.15)", fontWeight: 700, fontSize: 11 }}
                    label={`${employeeHistory.filter((r) => r.status === "present").length}P`}
                  />
                  <Chip
                    size="small"
                    sx={{ bgcolor: "rgba(244,67,54,0.15)", fontWeight: 700, fontSize: 11 }}
                    label={`${employeeHistory.filter((r) => r.status === "absent").length}A`}
                  />
                </Stack>
              </>
            )}
          </Paper>
        </Grid>

        {/* RIGHT — Report controls + viewer */}
        <Grid item xs={12} md={8}>
          {!selectedEmployee ? (
            <Box sx={{
              textAlign: "center", py: 12,
              border: "1px dashed", borderColor: "divider", borderRadius: 4,
            }}>
              <Typography variant="h6" color="text.secondary" fontWeight={600}>
                Select an employee to view history
              </Typography>
              <Typography variant="body2" color="text.disabled" mt={1}>
                Search and click on an employee from the left panel
              </Typography>
            </Box>
          ) : (
            <Box>
              {/* Report controls */}
              <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 3, flexWrap: "wrap", gap: 1.5 }}>
                <ToggleButtonGroup
                  value={reportType}
                  exclusive
                  size="small"
                  onChange={(_, v) => v && setReportType(v)}
                  sx={{
                    "& .MuiToggleButton-root": {
                      px: 2.5, py: 0.75, textTransform: "none",
                      fontWeight: 600, fontSize: 13,
                      border: "1.5px solid", borderColor: "divider", color: "text.secondary",
                    },
                    "& .MuiToggleButton-root.Mui-selected": {
                      bgcolor: "primary.main", borderColor: "primary.main", color: "#fff",
                    },
                  }}
                >
                  <ToggleButton value="daily">Daily</ToggleButton>
                  <ToggleButton value="weekly">Weekly</ToggleButton>
                  <ToggleButton value="monthly">Monthly</ToggleButton>
                </ToggleButtonGroup>

                {(reportType === "daily" || reportType === "weekly") && (
                  <TextField
                    type="date"
                    size="small"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    helperText={reportType === "weekly" ? "Pick any day in the week" : ""}
                  />
                )}
                {reportType === "monthly" && (
                  <TextField
                    type="month"
                    size="small"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  />
                )}

                <Button
                  variant="contained"
                  disableElevation
                  onClick={loadReport}
                  disabled={reportLoading}
                  sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2, minWidth: 130, py: 1 }}
                >
                  {reportLoading ? "Loading..." : "Load Report"}
                </Button>

                {reportData && (
                  <Button
                    variant="outlined"
                    startIcon={<PictureAsPdfIcon />}
                    onClick={() => {
                      const title = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Attendance Report — ${selectedEmpName}`;
                      generatePDF(title, reportData);
                    }}
                    sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2, py: 1 }}
                  >
                    Download PDF
                  </Button>
                )}
              </Stack>

              {reportLoading && <LinearProgress sx={{ mb: 2, borderRadius: 2 }} />}

              <ReportViewer
                reportType={reportType}
                reportData={reportData}
                selectedMonth={selectedMonth}
                reportDate={reportDate}
              />

              {!reportData && !reportLoading && (
                <Box sx={{
                  textAlign: "center", py: 8,
                  border: "1px dashed", borderColor: "divider", borderRadius: 3,
                }}>
                  <Typography color="text.secondary" fontWeight={500}>
                    Select {reportType === "monthly" ? "a month" : "a date"} and click Load Report
                  </Typography>
                  <Typography variant="body2" color="text.disabled" mt={1}>
                    Viewing: <strong>{selectedEmpName}</strong>
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
