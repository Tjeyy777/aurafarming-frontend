import { useState, useMemo, useEffect, useCallback } from "react";
import { useEmployees } from "../../hooks/useEmployees";
import { useAttendance } from "../../hooks/useAttendence";
import {
  Box, LinearProgress, Stack, Tabs, Tab, Typography, Paper, useTheme, Fade,
  FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HistoryIcon from "@mui/icons-material/History";
import RefreshIcon from "@mui/icons-material/Refresh";
import DailyTab from "./DailyTab";
import HistoryTab from "./HistoryTab";
import AttendanceToast from "./AttendanceToast";

export default function AttendancePage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { employees, roles, isLoading: loadingEmps, syncBiometric, isSyncing } = useEmployees();
  const { markAttendance, loading: isMarking, getAttendanceByDate } = useAttendance();

  // ─── Tab state ───
  const [tab, setTab] = useState("daily");

  // ─── Daily tab state ───
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [userChanges, setUserChanges] = useState({});
  const [alreadySaved, setAlreadySaved] = useState(false);
  const [isFetchingDate, setIsFetchingDate] = useState(false);
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedSubRole, setSelectedSubRole] = useState("all");
  const [selected, setSelected] = useState([]);

  // ─── Toast ───
  const [toast, setToast] = useState({ open: false, type: "success", message: "" });
  const showToast = (type, message) => setToast({ open: true, type, message });

  // ─── Derive parent roles and sub-roles ───
  const parentRoles = useMemo(() => roles.filter((r) => !r.parentRole), [roles]);
  const subRoles = useMemo(() => {
    if (selectedRole === "all") return [];
    return roles.filter((r) => {
      const parentId = r.parentRole?._id || r.parentRole;
      return parentId === selectedRole;
    });
  }, [roles, selectedRole]);

  // ─── Fetch saved attendance when date changes ───
  const fetchDateAttendance = useCallback(async () => {
    if (!employees?.length) return;
    setIsFetchingDate(true);
    setSelected([]);
    const result = await getAttendanceByDate(selectedDate);
    if (result?.data?.length) {
      const saved = {};
      result.data.forEach((r) => {
        const id = r.employeeId?._id || r.employeeId;
        saved[id] = {
          status: r.status,
          extraHours: r.overtimeHour || 0,
          perHourRate: r.perHourRate || 0,
        };
      });
      setUserChanges(saved);
      setAlreadySaved(true);
    } else {
      setUserChanges({});
      setAlreadySaved(false);
    }
    setIsFetchingDate(false);
  }, [employees, selectedDate, getAttendanceByDate]);

  useEffect(() => {
    fetchDateAttendance();
  }, [selectedDate, employees]);

  // ─── Refresh handler (re-sync biometric then refetch) ───
  const handleRefresh = async () => {
    // Format today for biometric API (DD/MM/YYYY)
    const d = new Date(selectedDate);
    const formatted = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    try {
      await syncBiometric({ fromDate: formatted, toDate: formatted });
      await fetchDateAttendance();
      showToast("success", "Biometric data refreshed!");
    } catch {
      showToast("error", "Refresh failed");
    }
  };

  // ─── Active employees only, filtered by role + sub-role ───
  const activeEmployees = useMemo(() => {
    if (!employees) return [];
    let list = employees.filter((emp) => emp.isActive);
    if (selectedRole !== "all") {
      list = list.filter((emp) => {
        const roleId = emp.role?._id || emp.role;
        return roleId === selectedRole;
      });
    }
    if (selectedSubRole !== "all") {
      list = list.filter((emp) => {
        const subRoleId = emp.subRole?._id || emp.subRole;
        return subRoleId === selectedSubRole;
      });
    }
    return list;
  }, [employees, selectedRole, selectedSubRole]);

  // ─── Build attendance list with computed pay ───
  const attendanceList = useMemo(() => {
    return activeEmployees.map((emp) => {
      const change = userChanges[emp._id] || {};
      const status = change.status ?? "absent"; // Auto-absent if no biometric record
      const extraHours = Number(change.extraHours) || 0;
      const perHourRate = Number(change.perHourRate) || 0;
      const isPresent = status === "present";
      const basePay = isPresent ? (emp.dailyWage || 0) : 0;
      const overtimePay = isPresent ? extraHours * perHourRate : 0;
      return {
        ...emp,
        status,
        extraHours,
        perHourRate,
        basePay,
        overtimePay,
        totalPay: basePay + overtimePay,
      };
    });
  }, [activeEmployees, userChanges]);

  // ─── Stats ───
  const stats = useMemo(() => {
    const marked = attendanceList.filter((a) => a.status !== null);
    const present = attendanceList.filter((a) => a.status === "present").length;
    return {
      present,
      absent: marked.length - present,
      totalPay: attendanceList.reduce((sum, a) => sum + a.totalPay, 0),
      unmarked: attendanceList.length - marked.length,
      total: attendanceList.length,
    };
  }, [attendanceList]);

  // ─── Inline update (single employee) ───
  const handleUpdate = useCallback((id, field, value) => {
    setUserChanges((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [field]: value },
    }));
  }, []);

  // ─── Bulk update from dialog ───
  const handleBulkUpdate = useCallback((targetIds, bulkData) => {
    setUserChanges((prev) => {
      const next = { ...prev };
      targetIds.forEach((id) => {
        next[id] = { ...(next[id] || {}), ...bulkData };
      });
      return next;
    });
    setSelected([]);
  }, []);

  // ─── Submit attendance ───
  const handleSubmit = async () => {
    const payload = {
      date: selectedDate,
      attendance: attendanceList
        .filter((a) => a.status !== null)
        .map((a) => ({
          employeeId: a._id,
          status: a.status,
          overtimeHour: a.extraHours,
          perHourRate: a.perHourRate,
        })),
    };

    const res = await markAttendance(payload);
    if (res?.status === "success") {
      setAlreadySaved(true);
      showToast("success", "Attendance records saved!");
    } else {
      showToast("error", res?.message || "Failed to save");
    }
  };

  if (loadingEmps) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6">Loading Personnel...</Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, margin: "auto" }}>
      {/* ─── HEADER ─── */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        sx={{ mb: 4, gap: 2 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: "-1px", color: "primary.main" }}>
            Attendance Flow
          </Typography>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          {/* Role Filter */}
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={selectedRole}
              onChange={(e) => { setSelectedRole(e.target.value); setSelectedSubRole("all"); }}
              label="Role"
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="all">All Roles</MenuItem>
              {parentRoles.map((r) => (
                <MenuItem key={r._id} value={r._id}>{r.title}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Sub-Role Filter */}
          {subRoles.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Sub-Role</InputLabel>
              <Select
                value={selectedSubRole}
                onChange={(e) => setSelectedSubRole(e.target.value)}
                label="Sub-Role"
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">All Sub-Roles</MenuItem>
                {subRoles.map((r) => (
                  <MenuItem key={r._id} value={r._id}>{r.title}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Refresh button */}
          <Tooltip title="Refresh biometric data">
            <IconButton
              onClick={handleRefresh}
              disabled={isSyncing}
              sx={{
                bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#f0f0f0",
                "&:hover": { bgcolor: "primary.main", color: "#fff" },
              }}
            >
              <RefreshIcon sx={{ animation: isSyncing ? "spin 1s linear infinite" : "none", "@keyframes spin": { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } } }} />
            </IconButton>
          </Tooltip>

          {/* Tab Switcher */}
          <Paper sx={{ p: 0.5, borderRadius: 3, bgcolor: "action.hover", display: "inline-flex" }} elevation={0}>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              TabIndicatorProps={{ sx: { display: "none" } }}
              sx={{
                "& .MuiTab-root": {
                  borderRadius: 2, minHeight: 40, px: 3, textTransform: "none", fontWeight: 700,
                  transition: "0.3s", color: "text.secondary",
                  "&.Mui-selected": { bgcolor: "background.paper", color: "primary.main", boxShadow: theme.shadows[2] },
                },
              }}
            >
              <Tab value="daily" label="Check-In" icon={<CheckCircleOutlineIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
              <Tab value="history" label="History" icon={<HistoryIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
            </Tabs>
          </Paper>
        </Stack>
      </Stack>

      {/* ─── CONTENT ─── */}
      <Fade in timeout={600}>
        <Box>
          {tab === "daily" ? (
            <DailyTab
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              attendanceList={attendanceList}
              stats={stats}
              alreadySaved={alreadySaved}
              isFetchingDate={isFetchingDate}
              isSubmitting={isMarking}
              selected={selected}
              setSelected={setSelected}
              onUpdate={handleUpdate}
              onBulkUpdate={handleBulkUpdate}
              onSubmit={handleSubmit}
              employees={activeEmployees}
              roles={roles}
              parentRoles={parentRoles}
            />
          ) : (
            <HistoryTab employees={employees} roles={roles} parentRoles={parentRoles} />
          )}
        </Box>
      </Fade>

      <AttendanceToast
        open={toast.open}
        onClose={() => setToast({ ...toast, open: false })}
        type={toast.type}
        message={toast.message}
      />
    </Box>
  );
}