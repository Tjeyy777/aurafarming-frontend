import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Stack, Avatar, Box, Button, TextField } from "@mui/material";

export default function AttendanceTable({ attendanceList, onUpdate }) {
  return (
    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
      <Table>
        <TableHead sx={{ bgcolor: "action.hover" }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 800 }}>Employee Details</TableCell>
            <TableCell align="center" sx={{ fontWeight: 800 }}>Attendance Status</TableCell>
            <TableCell align="center" sx={{ fontWeight: 800 }}>Extra Hours</TableCell>
            <TableCell align="right" sx={{ fontWeight: 800 }}>Payout</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {attendanceList.map((emp) => {
            const isUnmarked = emp.status === null;
            return (
              <TableRow key={emp._id} hover sx={{ 
                borderLeft: isUnmarked ? "4px solid #ed6c02" : "4px solid transparent",
                bgcolor: isUnmarked ? "rgba(237, 108, 2, 0.02)" : "inherit"
              }}>
                <TableCell>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar src={emp.profileImage} sx={{ width: 42, height: 42, border: "2px solid #fff", boxShadow: 1 }}>{emp.name[0]}</Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={700}>{emp.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{emp.position}</Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1} justifyContent="center">
                    {["present", "absent"].map((s) => (
                      <Button
                        key={s}
                        variant={emp.status === s ? "contained" : "outlined"}
                        color={s === "present" ? "success" : "error"}
                        size="small"
                        onClick={() => onUpdate(emp._id, "status", s)}
                        sx={{ borderRadius: "20px", textTransform: "none", px: 2, fontWeight: 700, fontSize: "0.75rem", boxShadow: emp.status === s ? 3 : 0 }}
                      >
                        {s}
                      </Button>
                    ))}
                  </Stack>
                </TableCell>
                <TableCell align="center">
                  <TextField
                    size="small" type="number"
                    value={emp.overtime || ""}
                    disabled={emp.status !== "present"}
                    onChange={(e) => onUpdate(emp._id, "overtime", e.target.value)}
                    sx={{ width: 70, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight={900} color={emp.calculatedPay > 0 ? "success.dark" : "text.disabled"}>
                    ₹{emp.calculatedPay.toLocaleString()}
                  </Typography>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}