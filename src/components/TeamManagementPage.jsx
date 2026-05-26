import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Stack,
  InputAdornment,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import api from "../api/axiosConfig";

export default function TeamManagementPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dialog State
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({ name: "", email: "", password: "", isActive: true });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await api.get("/auth/staff");
      setStaff(res.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load staff list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setSelectedStaff(null);
    setFormData({ name: "", email: "", password: "", isActive: true });
    setFormError(null);
    setOpen(true);
  };

  const handleOpenEdit = (staffMember) => {
    setIsEditing(true);
    setSelectedStaff(staffMember);
    setFormData({
      name: staffMember.name,
      email: staffMember.email,
      password: "", // Leave blank so we only update if provided
      isActive: staffMember.isActive,
    });
    setFormError(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setFormError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      if (isEditing) {
        // Prepare payload, omitting empty password
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        
        await api.put(`/auth/staff/${selectedStaff._id}`, payload);
      } else {
        await api.post("/auth/staff", formData);
      }
      
      await fetchStaff();
      handleClose();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save staff account");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await api.put(`/auth/staff/${id}`, { isActive: !currentStatus });
      fetchStaff();
    } catch (err) {
      console.error("Failed to toggle staff status", err);
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: "primary.main", letterSpacing: "-0.02em", mb: 0.5 }}>
            Team Management
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: "0.95rem" }}>
            Create and manage staff accounts for your workspace.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
          sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, px: 3, py: 1 }}
        >
          Add Staff
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Card sx={{ borderRadius: 3, boxShadow: "0 8px 32px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ p: 5, textAlign: "center" }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: "text.secondary" }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "text.secondary" }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "text.secondary" }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "text.secondary" }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: "text.secondary" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {staff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 5, color: "text.secondary" }}>
                      No staff accounts found. Create one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  staff.map((member) => (
                    <TableRow key={member._id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{member.name}</TableCell>
                      <TableCell sx={{ color: "text.secondary" }}>{member.email}</TableCell>
                      <TableCell>
                        <Chip size="small" label="STAFF" sx={{ fontWeight: 700, fontSize: "0.7rem" }} />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          size="small" 
                          label={member.isActive ? "ACTIVE" : "INACTIVE"} 
                          color={member.isActive ? "success" : "default"}
                          sx={{ fontWeight: 700, fontSize: "0.7rem" }} 
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Switch 
                          checked={member.isActive} 
                          onChange={() => handleToggleActive(member._id, member.isActive)}
                          size="small"
                          color="success"
                          sx={{ mr: 1 }}
                        />
                        <IconButton size="small" onClick={() => handleOpenEdit(member)} color="primary">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 4 } }}>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 900 }}>
            {isEditing ? "Edit Staff Account" : "Create Staff Account"}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              {formError && <Alert severity="error">{formError}</Alert>}
              
              <TextField
                fullWidth
                label="Full Name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="disabled" fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="disabled" fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label={isEditing ? "New Password (Optional)" : "Password"}
                type="text" // Keep as text or password, keeping text makes it easier for admin to copy it
                required={!isEditing}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                helperText={!isEditing ? "Manually share this password with the staff member." : "Leave blank to keep existing password."}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="disabled" fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button onClick={handleClose} color="inherit">Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={submitting}
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              {submitting ? "Saving..." : (isEditing ? "Save Changes" : "Create Account")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
