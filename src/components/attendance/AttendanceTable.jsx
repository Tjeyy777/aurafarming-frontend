import { useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Avatar, Typography, Stack, Box, Chip, Button, TextField,
  Checkbox, TablePagination, useTheme
} from "@mui/material";

export default function AttendanceTable({ attendanceList, selected, setSelected, onUpdate }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  const isAllSelected = attendanceList.length > 0 && selected.length === attendanceList.length;
  const isIndeterminate = selected.length > 0 && selected.length < attendanceList.length;

  const handleToggleAll = () => {
    if (isAllSelected) {
      setSelected([]);
    } else {
      setSelected(attendanceList.map((e) => e._id));
    }
  };

  const handleToggle = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const paginated = attendanceList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      <TableContainer
        sx={{
          borderRadius: 4,
          overflow: "hidden",
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Table size="small">
          <TableHead sx={{ bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#f9fafb" }}>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={isIndeterminate}
                  checked={isAllSelected}
                  onChange={handleToggleAll}
                  size="small"
                />
              </TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Employee</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Role</TableCell>
              <TableCell align="center" sx={{ fontWeight: 800 }}>Status</TableCell>
              <TableCell align="center" sx={{ fontWeight: 800 }}>Extra Hrs</TableCell>
              <TableCell align="center" sx={{ fontWeight: 800 }}>₹/Hour</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>Total Pay</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paginated.map((emp) => {
              const isPresent = emp.status === "present";
              const isAbsent = emp.status === "absent";
              const isUnmarked = emp.status === null;
              const isChecked = selected.includes(emp._id);

              return (
                <TableRow
                  key={emp._id}
                  hover
                  sx={{
                    transition: "0.2s",
                    borderLeft: `4px solid ${
                      isUnmarked
                        ? theme.palette.warning.main
                        : isPresent
                        ? theme.palette.success.main
                        : theme.palette.error.main
                    }`,
                    bgcolor: isUnmarked
                      ? (isDark ? "rgba(237, 108, 2, 0.03)" : "rgba(237, 108, 2, 0.02)")
                      : isChecked
                      ? (isDark ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.04)")
                      : "inherit",
                  }}
                >
                  {/* CHECKBOX */}
                  <TableCell padding="checkbox">
                    <Checkbox
                      size="small"
                      checked={isChecked}
                      onChange={() => handleToggle(emp._id)}
                    />
                  </TableCell>

                  {/* EMPLOYEE */}
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar
                        src={emp.profileImage}
                        sx={{
                          width: 36, height: 36,
                          border: `2px solid ${isDark ? "#121212" : "#fff"}`,
                          boxShadow: theme.shadows[1],
                          fontSize: 14,
                        }}
                      >
                        {emp.name?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>{emp.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{emp.employeeCode}</Typography>
                      </Box>
                    </Stack>
                  </TableCell>

                  {/* ROLE */}
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {emp.role?.title || "—"}
                    </Typography>
                    {emp.subRole?.title && (
                      <Typography variant="caption" color="text.secondary">
                        {emp.subRole.title}
                      </Typography>
                    )}
                  </TableCell>

                  {/* STATUS */}
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      {["present", "absent"].map((s) => (
                        <Button
                          key={s}
                          variant={emp.status === s ? "contained" : "outlined"}
                          color={s === "present" ? "success" : "error"}
                          size="small"
                          onClick={() => onUpdate(emp._id, "status", s)}
                          sx={{
                            minWidth: 32, px: 1.5, py: 0.3,
                            borderRadius: "16px",
                            textTransform: "none",
                            fontWeight: 700,
                            fontSize: "0.7rem",
                            boxShadow: emp.status === s ? 2 : 0,
                          }}
                        >
                          {s === "present" ? "P" : "A"}
                        </Button>
                      ))}
                    </Stack>
                  </TableCell>

                  {/* EXTRA HOURS */}
                  <TableCell align="center">
                    <TextField
                      size="small"
                      type="number"
                      value={emp.extraHours || ""}
                      disabled={!isPresent}
                      onChange={(e) => onUpdate(emp._id, "extraHours", e.target.value)}
                      inputProps={{ min: 0, step: 0.5 }}
                      sx={{
                        width: 70,
                        "& .MuiOutlinedInput-root": { borderRadius: 2 },
                        "& input": { textAlign: "center", py: 0.5, fontSize: 13 },
                      }}
                    />
                  </TableCell>

                  {/* PER HOUR RATE */}
                  <TableCell align="center">
                    <TextField
                      size="small"
                      type="number"
                      value={emp.perHourRate || ""}
                      disabled={!isPresent}
                      onChange={(e) => onUpdate(emp._id, "perHourRate", e.target.value)}
                      inputProps={{ min: 0 }}
                      sx={{
                        width: 80,
                        "& .MuiOutlinedInput-root": { borderRadius: 2 },
                        "& input": { textAlign: "center", py: 0.5, fontSize: 13 },
                      }}
                    />
                  </TableCell>

                  {/* TOTAL PAY */}
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      fontWeight={900}
                      color={emp.totalPay > 0 ? "success.main" : "text.disabled"}
                    >
                      ₹{(emp.totalPay || 0).toLocaleString("en-IN")}
                    </Typography>
                    {emp.overtimePay > 0 && (
                      <Typography variant="caption" color="primary.main" fontWeight={600}>
                        +₹{emp.overtimePay.toLocaleString("en-IN")} OT
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}

            {attendanceList.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary" fontWeight={500}>
                    No employees found for current filters
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {attendanceList.length > rowsPerPage && (
        <TablePagination
          component="div"
          count={attendanceList.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[10, 15, 25, 50]}
          sx={{ borderTop: `1px solid ${theme.palette.divider}` }}
        />
      )}
    </Box>
  );
}