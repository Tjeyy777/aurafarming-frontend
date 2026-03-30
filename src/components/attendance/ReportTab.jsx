import { Box, Stack, Button, TextField, FormControl, InputLabel,
         Select, MenuItem, Avatar, ToggleButton, ToggleButtonGroup,
         Typography, LinearProgress } from "@mui/material";
import ReportViewer from "./reportViewer";

const reportTypeSx = {
  "& .MuiToggleButton-root": {
    px: 2.5, py: 0.75, textTransform: "none",
    fontWeight: 600, fontSize: 13,
    border: "1.5px solid", borderColor: "divider", color: "text.secondary",
  },
  "& .MuiToggleButton-root.Mui-selected": {
    bgcolor: "primary.main", borderColor: "primary.main", color: "#fff",
  },
};

export default function ReportsTab({
  employees, reportType, setReportType,
  selectedEmployee, setSelectedEmployee,
  selectedMonth, setSelectedMonth,
  reportDate, setReportDate,
  reportData, reportLoading, onLoad,
}) {
  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="flex-start"
        sx={{ mb: 3, flexWrap: "wrap", gap: 1.5 }}>

        <ToggleButtonGroup
          value={reportType} exclusive size="small"
          onChange={(_, v) => v && setReportType(v)}
          sx={reportTypeSx}
        >
          <ToggleButton value="daily">Daily</ToggleButton>
          <ToggleButton value="weekly">Weekly</ToggleButton>
          <ToggleButton value="monthly">Monthly</ToggleButton>
        </ToggleButtonGroup>

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Select Employee</InputLabel>
          <Select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            label="Select Employee"
          >
            {employees?.map((emp) => (
              <MenuItem key={emp._id} value={emp._id}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Avatar src={emp.profileImage} sx={{ width: 22, height: 22, fontSize: 11 }}>
                    {emp.name?.[0]}
                  </Avatar>
                  <span>{emp.name}</span>
                </Stack>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {(reportType === "daily" || reportType === "weekly") && (
          <TextField
            type="date" size="small"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            helperText={reportType === "weekly" ? "Pick any day in the week" : ""}
          />
        )}
        {reportType === "monthly" && (
          <TextField
            type="month" size="small"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
        )}

        <Button
          variant="contained" disableElevation
          onClick={onLoad}
          disabled={!selectedEmployee || reportLoading}
          sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2, minWidth: 130, py: 1 }}
        >
          {reportLoading ? "Loading..." : "Load Report"}
        </Button>
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
          textAlign: "center", py: 10,
          border: "1px dashed", borderColor: "divider", borderRadius: 3,
        }}>
          <Typography color="text.secondary" fontWeight={500}>
            Select an employee and {reportType === "monthly" ? "a month" : "a date"}, then click Load Report
          </Typography>
          {reportType === "weekly" && (
            <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: "block" }}>
              You can pick any day — the full Mon–Sun week will load
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}