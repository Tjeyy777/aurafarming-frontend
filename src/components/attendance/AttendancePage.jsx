import { useState, useMemo, useEffect, useCallback } from "react";
import { useEmployees } from "../../hooks/useEmployees";
import { useAttendance } from "../../hooks/useAttendence";
import { Box, LinearProgress, Stack, Tabs, Tab, Typography, Paper, useTheme, Fade } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import DailyTab from "./DailyTab";
import ReportsTab from "./ReportTab";
import AttendanceToast from "./AttendanceToast";

export default function AttendancePage() {
  const theme = useTheme();
  const { data: employees, isLoading: loadingEmps } = useEmployees();
  const { markAttendance, getAttendanceByDate, getMonthlyAttendance, getWeeklyReport, getDailyReport } = useAttendance();

  const [tab, setTab] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [userChanges, setUserChanges] = useState({});
  const [alreadySaved, setAlreadySaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingDate, setIsFetchingDate] = useState(false);

  const [toast, setToast] = useState({ open: false, type: "success", message: "" });
  const showToast = (type, message) => setToast({ open: true, type, message });

  // Reports tab state
  const [reportType, setReportType] = useState("monthly");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Fetch Logic (Check-In)
  useEffect(() => {
    if (!employees?.length) return;
    setIsFetchingDate(true);
    const run = async () => {
      const result = await getAttendanceByDate(selectedDate);
      if (result?.data?.length) {
        const saved = {};
        result.data.forEach((r) => {
          const id = r.employeeId?._id || r.employeeId;
          saved[id] = { status: r.status, overtime: r.overtimeHour };
        });
        setUserChanges(saved);
        setAlreadySaved(true);
      } else {
        setUserChanges({});
        setAlreadySaved(false);
      }
      setIsFetchingDate(false);
    };
    run();
  }, [selectedDate, employees]);

  const attendanceList = useMemo(() => {
    if (!employees) return [];
    return employees.map((emp) => {
      const change = userChanges[emp._id] || {};
      const isPresent = (change.status ?? null) === "present";
      const overtimeHours = Number(change.overtime) || 0;
      return {
        ...emp,
        status: change.status ?? null,
        overtime: overtimeHours,
        calculatedPay: isPresent ? emp.dailyWage + (overtimeHours * (emp.overtimeRate ?? 0)) : 0,
      };
    });
  }, [employees, userChanges]);

  const stats = useMemo(() => {
    const marked = attendanceList.filter((a) => a.status !== null);
    const present = attendanceList.filter((a) => a.status === "present").length;
    return {
      present, absent: marked.length - present,
      totalPay: attendanceList.reduce((sum, a) => sum + a.calculatedPay, 0),
      unmarked: attendanceList.length - marked.length,
      total: attendanceList.length,
    };
  }, [attendanceList]);

  // Clear report data when changing employee or report type
  useEffect(() => {
    setReportData(null);
  }, [selectedEmployee, reportType]);

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
      const res = await getMonthlyAttendance(selectedEmployee, year, month);
      setReportData(res?.data ?? null);
    }
    setReportLoading(false);
  }, [selectedEmployee, reportType, reportDate, selectedMonth, getDailyReport, getWeeklyReport, getMonthlyAttendance]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, margin: "auto" }}>
      {/* MODERN HEADER */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" sx={{ mb: 4, gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: "-1px", color: "primary.main" }}>
            Attendance Flow
          </Typography>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </Typography>
        </Box>

        <Paper sx={{ p: 0.5, borderRadius: 3, bgcolor: "action.hover", display: "inline-flex" }} elevation={0}>
          <Tabs 
            value={tab} 
            onChange={(_, v) => setTab(v)} 
            indicatorColor="transparent"
            sx={{
              "& .MuiTab-root": { 
                borderRadius: 2, minHeight: 40, px: 3, textTransform: "none", fontWeight: 700,
                transition: "0.3s", color: "text.secondary",
                "&.Mui-selected": { bgcolor: "background.paper", color: "primary.main", boxShadow: theme.shadows[2] }
              }
            }}
          >
            <Tab value="daily" label="Check-In" icon={<CheckCircleOutlineIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
            <Tab value="reports" label="Insights" icon={<AnalyticsIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
          </Tabs>
        </Paper>
      </Stack>

      <Fade in={true} timeout={800}>
        <Box>
          {tab === "daily" ? (
            <DailyTab 
               selectedDate={selectedDate} setSelectedDate={setSelectedDate}
               attendanceList={attendanceList} stats={stats} 
               alreadySaved={alreadySaved} isSubmitting={isSubmitting}
               onUpdate={(id, f, v) => setUserChanges(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [f]: v } }))}
               onSubmit={async () => {
                 setIsSubmitting(true);
                 const res = await markAttendance({ date: selectedDate, attendance: attendanceList.map(a => ({ employeeId: a._id, status: a.status, overtimeHour: a.overtime })) });
                 if(res?.status === "success") { setAlreadySaved(true); showToast("success", "Records Synced!"); }
                 setIsSubmitting(false);
               }}
            />
          ) : (
            <ReportsTab 
               employees={employees}
               reportType={reportType} setReportType={setReportType}
               selectedEmployee={selectedEmployee} setSelectedEmployee={setSelectedEmployee}
               selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}
               reportDate={reportDate} setReportDate={setReportDate}
               reportData={reportData} reportLoading={reportLoading}
               onLoad={loadReport}
            />
          )}
        </Box>
      </Fade>

      <AttendanceToast open={toast.open} onClose={() => setToast({...toast, open: false})} type={toast.type} message={toast.message} />
    </Box>
  );
}