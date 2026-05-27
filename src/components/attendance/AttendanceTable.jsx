import { useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Avatar, Typography, Stack, Box, Button, TextField,
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

  const headerStyle = { 
    fontSize: '0.75rem', 
    fontWeight: 700, 
    textTransform: 'uppercase', 
    letterSpacing: '0.05em', 
    color: 'text.secondary',
    borderBottom: `1px solid ${theme.palette.divider}`,
    py: 2
  };

  const inputStyle = {
    width: 76,
    "& .MuiOutlinedInput-root": { 
       borderRadius: '8px', 
       bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
       transition: 'all 0.2s',
       "&:hover": { bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' },
       "&.Mui-focused": { bgcolor: 'transparent' }
    },
    "& .MuiOutlinedInput-notchedOutline": { border: '1px solid transparent' },
    "& .Mui-focused .MuiOutlinedInput-notchedOutline": { border: '1px solid', borderColor: 'primary.main' },
    "& input": { textAlign: "center", py: 1, fontSize: '0.85rem', fontWeight: 600 },
  };

  return (
    <Box>
      <TableContainer
        sx={{
          borderRadius: '16px',
          overflow: "hidden",
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: isDark ? '#0d1017' : '#ffffff',
          boxShadow: isDark ? 'none' : '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
        }}
      >
        <Table size="medium">
          <TableHead sx={{ bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc" }}>
            <TableRow>
              <TableCell padding="checkbox" sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Checkbox
                  indeterminate={isIndeterminate}
                  checked={isAllSelected}
                  onChange={handleToggleAll}
                  size="small"
                  sx={{ color: 'text.secondary', '&.Mui-checked': { color: 'primary.main' } }}
                />
              </TableCell>
              <TableCell sx={headerStyle}>Employee Details</TableCell>
              <TableCell sx={headerStyle}>Designation</TableCell>
              <TableCell align="center" sx={headerStyle}>Attendance Status</TableCell>
              <TableCell align="center" sx={headerStyle}>Extra Time</TableCell>
              <TableCell align="center" sx={headerStyle}>Hourly Rate</TableCell>
              <TableCell align="right" sx={headerStyle}>Total Pay</TableCell>
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
                    transition: "all 0.2s ease",
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    bgcolor: isChecked 
                      ? (isDark ? "rgba(255, 140, 0, 0.08)" : "rgba(255, 140, 0, 0.04)") 
                      : (isUnmarked ? (isDark ? "rgba(255, 255, 255, 0.01)" : "#fafafa") : "inherit"),
                    "&:hover": {
                      bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#f1f5f9",
                    },
                    "&:last-child": { '& td, & th': { border: 0 } }
                  }}
                >
                  {/* CHECKBOX */}
                  <TableCell padding="checkbox">
                    <Checkbox
                      size="small"
                      checked={isChecked}
                      onChange={() => handleToggle(emp._id)}
                      sx={{ color: 'text.disabled', '&.Mui-checked': { color: 'primary.main' } }}
                    />
                  </TableCell>

                  {/* EMPLOYEE */}
                  <TableCell sx={{ py: 1.5 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar
                        src={emp.profileImage}
                        variant="rounded"
                        sx={{
                          width: 42, height: 42,
                          borderRadius: '12px',
                          bgcolor: isDark ? 'rgba(255, 140, 0, 0.15)' : 'primary.light',
                          color: 'primary.main',
                          fontWeight: 700,
                          fontSize: '1rem',
                        }}
                      >
                        {emp.name?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={700} sx={{ color: 'text.primary', letterSpacing: '-0.01em' }}>
                          {emp.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          ID: {emp.employeeCode}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>

                  {/* ROLE */}
                  <TableCell>
                    <Box sx={{ display: 'inline-block' }}>
                      <Typography variant="body2" fontWeight={600} sx={{ color: 'text.primary' }}>
                        {emp.role?.title || "—"}
                      </Typography>
                      {emp.subRole?.title && (
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>
                          {emp.subRole.title}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>

                  {/* STATUS */}
                  <TableCell align="center">
                    <Box sx={{ 
                      display: 'inline-flex', 
                      bgcolor: isDark ? 'rgba(0,0,0,0.2)' : '#e2e8f0', 
                      borderRadius: '10px', 
                      p: '4px',
                      border: `1px solid ${theme.palette.divider}`
                    }}>
                      <Button
                        disableElevation
                        onClick={() => onUpdate(emp._id, "status", "present")}
                        sx={{
                          minWidth: 70, px: 1.5, py: 0.5, borderRadius: '8px',
                          textTransform: 'none', fontWeight: 700, fontSize: '0.75rem',
                          bgcolor: isPresent ? (isDark ? '#22c55e' : '#16a34a') : 'transparent',
                          color: isPresent ? '#fff' : 'text.secondary',
                          boxShadow: isPresent ? '0 2px 8px rgba(34, 197, 94, 0.2)' : 'none',
                          transition: 'all 0.2s',
                          "&:hover": { bgcolor: isPresent ? (isDark ? '#16a34a' : '#15803d') : 'rgba(255,255,255,0.05)' }
                        }}
                      >
                        Present
                      </Button>
                      <Button
                        disableElevation
                        onClick={() => onUpdate(emp._id, "status", "absent")}
                        sx={{
                          minWidth: 70, px: 1.5, py: 0.5, borderRadius: '8px',
                          textTransform: 'none', fontWeight: 700, fontSize: '0.75rem',
                          bgcolor: isAbsent ? (isDark ? '#ef4444' : '#dc2626') : 'transparent',
                          color: isAbsent ? '#fff' : 'text.secondary',
                          boxShadow: isAbsent ? '0 2px 8px rgba(239, 68, 68, 0.2)' : 'none',
                          transition: 'all 0.2s',
                          "&:hover": { bgcolor: isAbsent ? (isDark ? '#dc2626' : '#b91c1c') : 'rgba(255,255,255,0.05)' }
                        }}
                      >
                        Absent
                      </Button>
                    </Box>
                  </TableCell>

                  {/* EXTRA HOURS */}
                  <TableCell align="center">
                    <TextField
                      size="small"
                      type="number"
                      placeholder="0"
                      value={emp.extraHours || ""}
                      disabled={!isPresent}
                      onChange={(e) => onUpdate(emp._id, "extraHours", e.target.value)}
                      inputProps={{ min: 0, step: 0.5 }}
                      sx={{
                        ...inputStyle,
                        opacity: isPresent ? 1 : 0.4,
                      }}
                    />
                  </TableCell>

                  {/* PER HOUR RATE */}
                  <TableCell align="center">
                    <TextField
                      size="small"
                      type="number"
                      placeholder="0"
                      value={emp.perHourRate || ""}
                      disabled={!isPresent}
                      onChange={(e) => onUpdate(emp._id, "perHourRate", e.target.value)}
                      inputProps={{ min: 0 }}
                      sx={{
                        ...inputStyle,
                        width: 86,
                        opacity: isPresent ? 1 : 0.4,
                      }}
                    />
                  </TableCell>

                  {/* TOTAL PAY */}
                  <TableCell align="right">
                    <Typography
                      variant="body1"
                      fontWeight={800}
                      sx={{ 
                        color: emp.totalPay > 0 ? (isDark ? "primary.main" : "primary.dark") : "text.disabled",
                        letterSpacing: '-0.02em'
                      }}
                    >
                      ₹{(emp.totalPay || 0).toLocaleString("en-IN")}
                    </Typography>
                    {emp.overtimePay > 0 && (
                      <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 700 }}>
                        +₹{emp.overtimePay.toLocaleString("en-IN")} OT
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}

            {attendanceList.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <Typography variant="h6" color="text.secondary" fontWeight={600} gutterBottom>
                    No Personnel Found
                  </Typography>
                  <Typography variant="body2" color="text.disabled">
                    Try adjusting your filters or search terms.
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
          sx={{ 
            mt: 2, 
            bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'transparent',
            borderRadius: '12px',
            border: `1px solid ${theme.palette.divider}` 
          }}
        />
      )}
    </Box>
  );
}