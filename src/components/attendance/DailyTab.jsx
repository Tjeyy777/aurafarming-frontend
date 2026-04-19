import { useState } from "react";
import { Box, Stack, Button, TextField, Alert, Chip, LinearProgress, Typography } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditNoteIcon from "@mui/icons-material/EditNote";
import StatsCards from "./StatsCard";
import AttendanceTable from "./AttendanceTable";
import BulkEditDialog from "./BulkEditDialog";

export default function DailyTab({
  selectedDate, setSelectedDate,
  attendanceList, stats,
  alreadySaved, isFetchingDate,
  isSubmitting, selected, setSelected,
  onUpdate, onBulkUpdate, onSubmit,
  employees, roles, parentRoles,
}) {
  const [bulkOpen, setBulkOpen] = useState(false);

  return (
    <Box>
      {/* Date picker + saved badge */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <TextField
          type="date"
          size="small"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          InputProps={{
            startAdornment: <CalendarTodayIcon sx={{ fontSize: 16, mr: 1, color: "text.secondary" }} />,
          }}
          sx={{ width: 200 }}
        />
        {alreadySaved && (
          <Chip
            icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
            label="Already saved — editing will update"
            color="success"
            size="small"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        )}
      </Stack>

      {isFetchingDate && <LinearProgress sx={{ mb: 2, borderRadius: 2 }} />}

      {stats.unmarked > 0 && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          {stats.unmarked} employee(s) not yet marked — rows highlighted below.
        </Alert>
      )}

      <StatsCards stats={stats} />

      {/* Bulk action bar */}
      {selected.length > 0 && (
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{
            mb: 2, p: 2, borderRadius: 3,
            bgcolor: "primary.main", color: "#fff",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          }}
        >
          <Typography fontWeight={700}>
            {selected.length} employee{selected.length > 1 ? "s" : ""} selected
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="contained"
            color="inherit"
            startIcon={<EditNoteIcon />}
            onClick={() => setBulkOpen(true)}
            sx={{
              bgcolor: "rgba(255,255,255,0.2)",
              color: "#fff",
              fontWeight: 700,
              "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
            }}
          >
            Bulk Edit
          </Button>
          <Button
            size="small"
            sx={{ color: "rgba(255,255,255,0.8)", fontWeight: 600 }}
            onClick={() => setSelected([])}
          >
            Clear
          </Button>
        </Stack>
      )}

      <AttendanceTable
        attendanceList={attendanceList}
        selected={selected}
        setSelected={setSelected}
        onUpdate={onUpdate}
      />

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 3 }}>
        <Typography variant="body2" color="text.secondary">
          {stats.total - stats.unmarked} / {stats.total} marked
        </Typography>
        <Button
          variant="contained"
          disableElevation
          startIcon={isSubmitting ? null : <SaveIcon />}
          onClick={onSubmit}
          disabled={isSubmitting || stats.unmarked > 0}
          sx={{ borderRadius: 2, px: 3, py: 1, textTransform: "none", fontWeight: 600, fontSize: 14 }}
        >
          {isSubmitting ? "Saving..." : alreadySaved ? "Update Attendance" : "Finalize Attendance"}
        </Button>
      </Stack>

      <BulkEditDialog
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        selected={selected}
        employees={employees}
        roles={roles}
        parentRoles={parentRoles}
        attendanceList={attendanceList}
        onApply={onBulkUpdate}
      />
    </Box>
  );
}