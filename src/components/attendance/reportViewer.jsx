import {
  Box, Card, CardContent, Grid, Typography, Stack, Chip, Alert,
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from "@mui/material";

function SummaryCards({ data }) {
  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {[
        { label: "Present days",  value: data.presentDays,        color: "success.main" },
        { label: "Absent days",   value: data.absentDays,         color: "error.main"   },
        { label: "Overtime hrs",  value: data.totalOvertimeHours, color: "info.main"    },
        { label: "Total salary",  value: `₹${(data.totalSalary || 0).toLocaleString("en-IN")}`, color: "primary.main" },
      ].map((c) => (
        <Grid item xs={6} md={3} key={c.label}>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: "16px !important" }}>
              <Typography variant="caption" color="text.secondary"
                sx={{ fontWeight: 600, textTransform: "uppercase", fontSize: 10 }}>
                {c.label}
              </Typography>
              <Typography variant="h4" sx={{ color: c.color, fontWeight: 700, mt: 0.5 }}>
                {c.value}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

function DailyCard({ data }) {
  if (!data) return (
    <Alert severity="info" sx={{ borderRadius: 2, maxWidth: 420 }}>
      No attendance record found for this date.
    </Alert>
  );

  return (
    <Card variant="outlined" sx={{ borderRadius: 3, maxWidth: 420 }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Box>
            <Typography fontWeight={700}>{data.employeeName}</Typography>
            <Typography variant="caption" color="text.secondary">{data.employeePosition}</Typography>
          </Box>
          <Chip
            label={data.status} size="small"
            sx={{
              fontWeight: 700, textTransform: "capitalize",
              bgcolor: data.status === "present" ? "success.main" : "error.main",
              color: "#fff",
            }}
          />
        </Stack>
        <Stack spacing={1.5} divider={<Box sx={{ borderBottom: "1px solid", borderColor: "divider" }} />}>
          {[
            { label: "Date",           value: new Date(data.date).toLocaleDateString("en-IN") },
            { label: "Overtime hours", value: data.overtimeHour || "—" },
            { label: "Daily earnings", value: `₹${(data.dailyEarnings || 0).toLocaleString("en-IN")}` },
          ].map((row) => (
            <Stack key={row.label} direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">{row.label}</Typography>
              <Typography variant="body2" fontWeight={600}>{row.value}</Typography>
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

function RecordsTable({ records, totalSalary, label }) {
  return (
    <TableContainer component={Paper} elevation={0}
      sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "action.hover" }}>
            <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Date</TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Status</TableCell>
            <TableCell align="center" sx={{ fontWeight: 700, fontSize: 13 }}>OT hrs</TableCell>
            <TableCell align="right"  sx={{ fontWeight: 700, fontSize: 13 }}>Earnings</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {records?.map((row) => (
            <TableRow key={row.date} sx={{ "&:last-child td": { border: 0 } }}>
              <TableCell sx={{ fontSize: 13 }}>
                {new Date(row.date).toLocaleDateString("en-IN", {
                  weekday: "short", day: "numeric", month: "short",
                })}
              </TableCell>
              <TableCell>
                <Chip
                  label={row.status} size="small"
                  sx={{
                    fontWeight: 600, fontSize: 11, textTransform: "capitalize",
                    bgcolor: row.status === "present" ? "success.main" : "error.main",
                    color: "#fff", border: "none",
                  }}
                />
              </TableCell>
              <TableCell align="center" sx={{ fontSize: 13 }}>{row.overtimeHour || "—"}</TableCell>
              <TableCell align="right">
                <Typography variant="body2" fontWeight={600}
                  color={row.dailyEarnings > 0 ? "success.main" : "text.disabled"}>
                  ₹{(row.dailyEarnings ?? 0).toLocaleString("en-IN")}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
          <TableRow sx={{ bgcolor: "action.selected" }}>
            <TableCell colSpan={3} sx={{ fontWeight: 700, fontSize: 13 }}>{label} Total</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700, fontSize: 14, color: "primary.main" }}>
              ₹{(totalSalary || 0).toLocaleString("en-IN")}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function ReportViewer({ reportType, reportData, selectedMonth, reportDate }) {
  if (!reportData) return null;

  const periodLabel = () => {
    if (reportType === "daily")
      return `Report for ${new Date(reportData.date || reportDate).toLocaleDateString("en-IN", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      })}`;
    if (reportType === "weekly" && reportData.weekStart)
      return `Week: ${new Date(reportData.weekStart).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${new Date(reportData.weekEnd).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
    return new Date(selectedMonth + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">{periodLabel()}</Typography>
        {reportData.employeeName && (
          <Chip label={reportData.employeeName} size="small" sx={{ fontWeight: 600, fontSize: 11 }} />
        )}
      </Stack>

      {reportType === "daily" && <DailyCard data={reportData} />}

      {(reportType === "weekly" || reportType === "monthly") && (
        <>
          <SummaryCards data={reportData} />
          <RecordsTable
            records={reportData.dailyRecords}
            totalSalary={reportData.totalSalary}
            label={reportType === "weekly" ? "Week" : "Month"}
          />
        </>
      )}
    </Box>
  );
}