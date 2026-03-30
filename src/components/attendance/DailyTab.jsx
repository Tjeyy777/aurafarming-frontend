import { Box, Stack, Button, TextField, Alert, Chip, LinearProgress, Typography } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import StatsCards from "./StatsCard";
import AttendanceTable from "./AttendanceTable";

export default function DailyTab({
  selectedDate, setSelectedDate,
  attendanceList, stats, presentPct,
  alreadySaved, isFetchingDate,
  isSubmitting, onUpdate, onSubmit,
}) {
  return (
    <Box>
      {/* Date picker + saved badge */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <TextField
          type="date" size="small"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          InputProps={{
            startAdornment: (
              <CalendarTodayIcon sx={{ fontSize: 16, mr: 1, color: "text.secondary" }} />
            ),
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

      <StatsCards stats={stats} presentPct={presentPct} />

      <AttendanceTable
        attendanceList={attendanceList}
        alreadySaved={alreadySaved}
        onUpdate={onUpdate}
      />

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 3 }}>
        <Typography variant="body2" color="text.secondary">
          {stats.total - stats.unmarked} / {stats.total} marked
        </Typography>
        <Button
          variant="contained" disableElevation
          startIcon={isSubmitting ? null : <SaveIcon />}
          onClick={onSubmit}
          disabled={isSubmitting || stats.unmarked > 0}
          sx={{ borderRadius: 2, px: 3, py: 1, textTransform: "none", fontWeight: 600, fontSize: 14 }}
        >
          {isSubmitting ? "Saving..." : alreadySaved ? "Update Attendance" : "Finalize Attendance"}
        </Button>
      </Stack>
    </Box>
  );
}