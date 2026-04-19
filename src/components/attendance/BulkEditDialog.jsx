import { useState, useMemo, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Stack, FormControl, InputLabel, Select, MenuItem,
  Typography, Chip, Box, Divider, useTheme
} from "@mui/material";

export default function BulkEditDialog({
  open, onClose,
  selected: initialSelected,
  employees,
  roles, parentRoles,
  attendanceList,
  onApply,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [dialogRole, setDialogRole] = useState("keep");
  const [dialogSubRole, setDialogSubRole] = useState("keep");
  const [status, setStatus] = useState("keep"); // "keep", "present", "absent"
  const [extraHours, setExtraHours] = useState("");
  const [perHourRate, setPerHourRate] = useState("");

  // Sub-roles for selected parent role
  const dialogSubRoles = useMemo(() => {
    if (dialogRole === "keep" || dialogRole === "all") return [];
    return roles.filter((r) => {
      const parentId = r.parentRole?._id || r.parentRole;
      return parentId === dialogRole;
    });
  }, [roles, dialogRole]);

  // Calculate which employees will be affected
  const targetIds = useMemo(() => {
    let ids = [...initialSelected];

    if (dialogRole !== "keep") {
      // Filter from attendance list by role
      const roleMatched = attendanceList.filter((emp) => {
        if (dialogRole === "all") return true;
        const roleId = emp.role?._id || emp.role;
        return roleId === dialogRole;
      });

      // Further filter by sub-role if set
      const filtered = dialogSubRole !== "keep"
        ? roleMatched.filter((emp) => {
            const subId = emp.subRole?._id || emp.subRole;
            return dialogSubRole === "all" ? true : subId === dialogSubRole;
          })
        : roleMatched;

      ids = filtered.map((e) => e._id);
    }

    return ids;
  }, [initialSelected, dialogRole, dialogSubRole, attendanceList]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setDialogRole("keep");
      setDialogSubRole("keep");
      setStatus("keep");
      setExtraHours("");
      setPerHourRate("");
    }
  }, [open]);

  const handleApply = () => {
    const bulkData = {};
    if (status !== "keep") bulkData.status = status;
    if (extraHours !== "") bulkData.extraHours = Number(extraHours);
    if (perHourRate !== "") bulkData.perHourRate = Number(perHourRate);

    if (Object.keys(bulkData).length === 0) {
      onClose();
      return;
    }

    onApply(targetIds, bulkData);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: 4, backgroundImage: "none" } }}
    >
      <DialogTitle sx={{ fontWeight: 900, fontSize: "1.4rem", pb: 1 }}>
        Bulk Edit Attendance
      </DialogTitle>

      <DialogContent sx={{ pt: "12px !important" }}>
        {/* Target info */}
        <Chip
          label={`${targetIds.length} employee${targetIds.length !== 1 ? "s" : ""} will be updated`}
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 700, mb: 2.5 }}
        />

        {/* Role filter inside dialog */}
        <Typography variant="overline" fontWeight={800} color="text.secondary" sx={{ mb: 1, display: "block" }}>
          Target Group (Optional)
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <FormControl size="small" fullWidth>
            <InputLabel>Filter by Role</InputLabel>
            <Select
              value={dialogRole}
              onChange={(e) => { setDialogRole(e.target.value); setDialogSubRole("keep"); }}
              label="Filter by Role"
            >
              <MenuItem value="keep">Use Current Selection</MenuItem>
              <MenuItem value="all">All Roles</MenuItem>
              {parentRoles.map((r) => (
                <MenuItem key={r._id} value={r._id}>{r.title}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {dialogSubRoles.length > 0 && (
            <FormControl size="small" fullWidth>
              <InputLabel>Sub-Role</InputLabel>
              <Select
                value={dialogSubRole}
                onChange={(e) => setDialogSubRole(e.target.value)}
                label="Sub-Role"
              >
                <MenuItem value="keep">All Sub-Roles</MenuItem>
                {dialogSubRoles.map((r) => (
                  <MenuItem key={r._id} value={r._id}>{r.title}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Stack>

        <Divider sx={{ mb: 2.5 }} />

        {/* Values to apply */}
        <Typography variant="overline" fontWeight={800} color="text.secondary" sx={{ mb: 1, display: "block" }}>
          Values to Apply
        </Typography>

        <Stack spacing={2.5}>
          {/* Status */}
          <FormControl size="small" fullWidth>
            <InputLabel>Attendance Status</InputLabel>
            <Select value={status} onChange={(e) => setStatus(e.target.value)} label="Attendance Status">
              <MenuItem value="keep">Don't Change</MenuItem>
              <MenuItem value="present">Present (P)</MenuItem>
              <MenuItem value="absent">Absent (A)</MenuItem>
            </Select>
          </FormControl>

          {/* Hours + Rate */}
          <Stack direction="row" spacing={2}>
            <TextField
              label="Extra Hours"
              type="number"
              size="small"
              fullWidth
              value={extraHours}
              onChange={(e) => setExtraHours(e.target.value)}
              inputProps={{ min: 0, step: 0.5 }}
              helperText="Leave empty = don't change"
            />
            <TextField
              label="Per Hour Rate (₹)"
              type="number"
              size="small"
              fullWidth
              value={perHourRate}
              onChange={(e) => setPerHourRate(e.target.value)}
              inputProps={{ min: 0 }}
              helperText="Leave empty = don't change"
            />
          </Stack>

          {/* Preview */}
          {extraHours && perHourRate && (
            <Box
              sx={{
                p: 2, borderRadius: 3,
                bgcolor: isDark ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.05)",
                border: `1px solid ${isDark ? "rgba(99,102,241,0.3)" : "rgba(99,102,241,0.15)"}`,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Each employee will receive:
              </Typography>
              <Typography variant="h6" fontWeight={900} color="primary.main">
                ₹{(Number(extraHours) * Number(perHourRate)).toLocaleString("en-IN")} overtime pay
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {extraHours} hrs × ₹{Number(perHourRate).toLocaleString("en-IN")}/hr
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} sx={{ fontWeight: 700, color: "text.secondary" }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleApply}
          disabled={targetIds.length === 0}
          sx={{ px: 4, borderRadius: 2, fontWeight: 700 }}
        >
          Apply to {targetIds.length} Employee{targetIds.length !== 1 ? "s" : ""}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
