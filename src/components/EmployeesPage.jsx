import AddIcon from "@mui/icons-material/Add";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import BadgeIcon from "@mui/icons-material/Badge";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PhoneIcon from "@mui/icons-material/Phone";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import SyncIcon from "@mui/icons-material/Sync";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Alert,
  Avatar,
  Box, Button,
  Card, CardContent,
  Chip, Dialog, DialogActions, DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  InputBase,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme
} from "@mui/material";
import { useState } from "react";
import { useEmployees } from "../hooks/useEmployees";

export default function EmployeesPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { 
    employees, 
    roles, 
    isLoading, 
    addEmployee, 
    updateEmployee, 
    deleteEmployee, 
    addRole, 
    updateRole, 
    deleteRole,
    syncBiometric,
    isSyncing,
    deactivateEmployee,
    reactivateEmployee
  } = useEmployees();
  
  const [open, setOpen] = useState(false);
  const [openManageRolesDialog, setOpenManageRolesDialog] = useState(false);
  const [openRoleDialog, setOpenRoleDialog] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [viewingEmp, setViewingEmp] = useState(null); 
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("active"); // "all", "active", "inactive"

  const [formData, setFormData] = useState({
    employeeCode: "", name: "", phone: "", 
    dailyWage: "", profileImage: "", idCardImage: "",
    role: "", subRole: "",
  });

  // Derive parent roles and sub-roles
  const parentRoles = roles.filter((r) => !r.parentRole);
  const getSubRoles = (parentId) => roles.filter((r) => {
    const pid = r.parentRole?._id || r.parentRole;
    return pid === parentId;
  });

  const [roleForm, setRoleForm] = useState({
    title: "",
    description: "",
    parentRole: null,
  });

  const isFormValid = formData.name && formData.employeeCode;

  const filteredEmployees = employees?.filter(emp => {
    const matchesSearch = (emp.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (emp.employeeCode || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === "active") return matchesSearch && emp.isActive;
    if (statusFilter === "inactive") return matchesSearch && emp.isActive === false;
    return matchesSearch;
  });

  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (file && file.size < 5 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, [field]: reader.result }));
      reader.readAsDataURL(file);
    } else {
      setError("File must be smaller than 5MB");
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
    setError("");
    setFormData({ employeeCode: "", name: "", phone: "", dailyWage: "", profileImage: "", idCardImage: "", role: "", subRole: "" });
  };

  const handleSaveRole = async () => {
    if (!roleForm.title) {
      setError("Role title is required.");
      return;
    }

    try {
      if (editingRoleId) {
        await updateRole({ id: editingRoleId, updatedData: roleForm });
      } else {
        const res = await addRole(roleForm);
        if (res?._id && !openManageRolesDialog) {
          setFormData((prev) => ({ ...prev, role: res._id }));
        }
      }
      setOpenRoleDialog(false);
      setEditingRoleId(null);
      setRoleForm({ title: "", description: "", parentRole: null });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to process role");
    }
  };

  const handleSubmit = () => {
    const exists = employees.find(
      (e) => e.employeeCode === formData.employeeCode
    );

    if (exists && !editingId) {
      setError("Employee already exists from biometric");
      return;
    }

    if (!formData.role) {
      setError("Please select a role.");
      return;
    }
    const payload = { ...formData, dailyWage: Number(formData.dailyWage) };
    editingId ? updateEmployee({ id: editingId, updatedData: payload }) : addEmployee(payload);
    handleClose();
  };

  if (isLoading) return <Box sx={{ p: 4, textAlign: 'center' }}><Typography variant="h6">Syncing Database...</Typography></Box>;

  return (
    <Box sx={{ maxWidth: "1600px", margin: "auto" }}>
      
      {/* HEADER SECTION */}
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} sx={{ mb: 4, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: isDark ? "primary.main" : "text.primary", letterSpacing: "-0.02em" }}>
            Staff Intelligence
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
            {employees?.length || 0} active personnel registered in the system
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} sx={{ width: { xs: "100%", md: "auto" } }}>
          <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, display: "flex", p: 0.5, bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#f5f5f5" }}>
            {["all", "active", "inactive"].map((f) => (
              <Button
                key={f}
                size="small"
                onClick={() => setStatusFilter(f)}
                sx={{
                  px: 2,
                  py: 0.5,
                  borderRadius: 2,
                  textTransform: "capitalize",
                  fontWeight: 700,
                  bgcolor: statusFilter === f ? (isDark ? "primary.main" : "white") : "transparent",
                  color: statusFilter === f ? (isDark ? "white" : "primary.main") : "text.secondary",
                  boxShadow: statusFilter === f && !isDark ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
                  "&:hover": { bgcolor: statusFilter === f ? (isDark ? "primary.dark" : "white") : "rgba(0,0,0,0.05)" }
                }}
              >
                {f}
              </Button>
            ))}
          </Box>

          <Paper sx={{ 
            p: '2px 12px', display: 'flex', alignItems: 'center', width: 300, 
            bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#f5f5f5",
            borderRadius: 3, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none'
          }}>
            <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
            <InputBase 
              placeholder="Search by name or code..." 
              sx={{ flex: 1, fontSize: '0.875rem' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Paper>

          <Button 
            variant="outlined" 
            disableElevation
            onClick={() => setOpenManageRolesDialog(true)}
            sx={{ borderRadius: 3, px: 3, fontWeight: 700 }}
          >
            Manage Roles
          </Button>

          <Button
            variant="contained"
            color="secondary"
            startIcon={<SyncIcon />}
            disabled={isSyncing}
            onClick={async () => {
              try {
                await syncBiometric({
                  fromDate: "15/04/2026",
                  toDate: "20/04/2026",
                });
                alert("Biometric Synced ✅");
              } catch (err) {
                alert("Sync Failed ❌");
              }
            }}
            sx={{ borderRadius: 3, px: 3, fontWeight: 700 }}
          >
            {isSyncing ? "Syncing..." : "Sync Biometric"}
          </Button>

          <Button 
            variant="contained" 
            disableElevation
            startIcon={<AddIcon />} 
            onClick={() => setOpen(true)}
            sx={{ borderRadius: 3, px: 3, fontWeight: 700 }}
          >
            Add Staff
          </Button>
        </Stack>
      </Stack>

      {/* MODERN GRID VIEW */}
      <Grid container spacing={3}>
        {filteredEmployees?.map((emp) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={emp._id}>
            <Card sx={{ 
              borderRadius: 4, 
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: isDark ? "rgba(13, 16, 23, 0.4)" : "background.paper",
              backdropFilter: isDark ? "blur(10px)" : "none",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              position: 'relative',
              overflow: 'visible',
              "&:hover": { 
                transform: "translateY(-5px)", 
                borderColor: "primary.main",
                boxShadow: isDark ? "0 10px 30px rgba(249, 115, 22, 0.1)" : "0 10px 30px rgba(0,0,0,0.05)"
              }
            }}>
              <Box sx={{ height: 60, bgcolor: isDark ? "rgba(255,255,255,0.03)" : "primary.light", borderRadius: "16px 16px 0 0", opacity: 0.5 }} />
              
              <CardContent sx={{ pt: 0, textAlign: 'center' }}>
                <Avatar 
                  src={emp.profileImage} 
                  sx={{ 
                    width: 80, height: 80, mx: "auto", mt: -5, 
                    border: `4px solid ${isDark ? "#121212" : "#fff"}`,
                    boxShadow: theme.shadows[3]
                  }} 
                />
                
                <Typography variant="h6" sx={{ fontWeight: 800, mt: 1.5 }}>{emp.name}</Typography>
                
                <Stack direction="row" spacing={0.5} justifyContent="center" sx={{ mb: 1 }}>
                  <Chip 
                    label={emp.isActive ? "Active" : "Inactive"} 
                    size="small" 
                    color={emp.isActive ? "success" : "error"}
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800 }}
                  />
                  {(!emp.dailyWage || !emp.role) && (
                    <Chip label="Setup Required" color="warning" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800 }} />
                  )}
                </Stack>

                <Chip 
                  label={emp.employeeCode} 
                  size="small" 
                  sx={{ 
                    mb: 2, fontWeight: 700, 
                    bgcolor: isDark ? "rgba(249,115,22,0.1)" : "#f0f0f0",
                    color: "primary.main"
                  }} 
                />

                <Divider sx={{ mb: 2, opacity: 0.5 }} />

                <Stack spacing={1} sx={{ textAlign: 'left', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <BadgeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2" fontWeight={600}>{emp.role?.title || emp.position || "Staff"}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <PhoneIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">{emp.phone}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f9f9f9', p: 1, borderRadius: 2 }}>
                    <Typography variant="caption" fontWeight={700}>DAILY RATE</Typography>
                    <Typography variant="body2" fontWeight={900} color="primary.main">₹{emp.dailyWage}</Typography>
                  </Box>
                </Stack>

                <Stack direction="row" justifyContent="center" spacing={1}>
                  <Tooltip title="View Profile"><IconButton size="small" onClick={() => setViewingEmp(emp)} sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#eee' }}><VisibilityIcon fontSize="inherit"/></IconButton></Tooltip>
                  <Tooltip title="Edit"><IconButton size="small" onClick={() => { setEditingId(emp._id); setFormData({ ...emp, role: emp.role?._id || emp.role, subRole: emp.subRole?._id || emp.subRole || "" }); setOpen(true); }} sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#eee' }}><EditIcon fontSize="inherit" color="primary"/></IconButton></Tooltip>
                  {emp.isActive ? (
                    <Tooltip title="Deactivate"><IconButton size="small" onClick={() => { if(window.confirm(`Deactivate ${emp.name}?`)) deactivateEmployee(emp._id) }} sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#eee' }}><PersonOffIcon fontSize="inherit" color="error"/></IconButton></Tooltip>
                  ) : (
                    <Tooltip title="Reactivate"><IconButton size="small" onClick={() => { if(window.confirm(`Reactivate ${emp.name}?`)) reactivateEmployee(emp._id) }} sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#eee' }}><RefreshIcon fontSize="inherit" color="success"/></IconButton></Tooltip>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {employees.length === 0 && (
        <Box textAlign="center" mt={5}>
          <Typography variant="h6" color="text.secondary">No Employees Found</Typography>
          <Typography variant="body2" color="text.secondary">
            Click Sync Biometric to import
          </Typography>
        </Box>
      )}

      {/* ADD / EDIT DIALOG */}
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 4, backgroundImage: 'none', overflow: 'visible' } }}
      >
        <DialogTitle sx={{ fontWeight: 900, fontSize: '1.5rem' }}>
          {editingId ? "Update Profile" : "New Registration"}
        </DialogTitle>

        {/* FIX: pt: 3 gives floating labels room to sit above the field border;
            overflow: visible lets them escape the DialogContent clip boundary */}
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: "20px !important", overflow: "visible" }}>
          {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

          <Stack direction="row" spacing={2}>
            <TextField
              label="Staff ID Code"
              fullWidth
              value={formData.employeeCode}
              onChange={(e) => setFormData({...formData, employeeCode: e.target.value})}
            />
            <TextField
              label="Full Name"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              select
              label="Staff Role"
              fullWidth
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value, subRole: "" })}
            >
              {parentRoles.length === 0 ? (
                <MenuItem disabled value="">
                  No roles found. Add one first.
                </MenuItem>
              ) : (
                parentRoles.map((r) => (
                  <MenuItem key={r._id} value={r._id}>
                    {r.title}
                  </MenuItem>
                ))
              )}
            </TextField>

            {formData.role && getSubRoles(formData.role).length > 0 && (
              <TextField
                select
                label="Sub-Role"
                fullWidth
                value={formData.subRole || ""}
                onChange={(e) => setFormData({ ...formData, subRole: e.target.value })}
              >
                <MenuItem value="">None</MenuItem>
                {getSubRoles(formData.role).map((r) => (
                  <MenuItem key={r._id} value={r._id}>
                    {r.title}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Stack>

          <TextField
            label="Daily Wage (₹)"
            type="number"
            fullWidth
            value={formData.dailyWage}
            onChange={(e) => setFormData({ ...formData, dailyWage: e.target.value })}
          />

          <TextField
            label="Primary Contact"
            fullWidth
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />

          <Typography variant="overline" sx={{ fontWeight: 900, color: 'primary.main' }}>
            Verification Media
          </Typography>

          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              fullWidth
              sx={{ py: 1.5, borderRadius: 3, borderStyle: 'dashed' }}
            >
              {formData.profileImage ? "Photo Ready" : "Profile Picture"}
              <input type="file" hidden accept="image/*" onChange={(e) => handleFileUpload(e, "profileImage")} />
            </Button>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              fullWidth
              sx={{ py: 1.5, borderRadius: 3, borderStyle: 'dashed' }}
            >
              {formData.idCardImage ? "ID Scanned" : "Government ID"}
              <input type="file" hidden accept="image/*" onChange={(e) => handleFileUpload(e, "idCardImage")} />
            </Button>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose} sx={{ fontWeight: 700, color: 'text.secondary' }}>Discard</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!isFormValid}
            sx={{ px: 4, borderRadius: 2, fontWeight: 700 }}
          >
            Confirm Details
          </Button>
        </DialogActions>
      </Dialog>

      {/* MANAGE ROLES DIALOG */}
      <Dialog 
        open={openManageRolesDialog} 
        onClose={() => setOpenManageRolesDialog(false)} 
        fullWidth 
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 900, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Manage Staff Roles
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => { setEditingRoleId(null); setRoleForm({ title: "", description: "", parentRole: null }); setOpenRoleDialog(true); }}
            sx={{ borderRadius: 2 }}
          >
            New Role
          </Button>
        </DialogTitle>
        <DialogContent dividers>
          {parentRoles.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No roles defined yet.</Typography>
            </Box>
          ) : (
            <Stack spacing={2} sx={{ py: 1 }}>
              {parentRoles.map((role) => (
                <Box key={role._id}>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#f9f9f9',
                      borderRadius: 3,
                      border: `1px solid ${theme.palette.divider}`
                    }}
                  >
                    <Box>
                      <Typography fontWeight={700}>{role.title}</Typography>
                      <Typography variant="body2" color="text.secondary">{role.description || "No description"}</Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        sx={{ textTransform: 'none', fontWeight: 600, fontSize: 12 }}
                        onClick={() => { setEditingRoleId(null); setRoleForm({ title: "", description: "", parentRole: role._id }); setOpenRoleDialog(true); }}
                      >
                        + Sub-Role
                      </Button>
                      <IconButton 
                        size="small" 
                        color="primary" 
                        onClick={() => { setEditingRoleId(role._id); setRoleForm({ title: role.title, description: role.description }); setOpenRoleDialog(true); }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => { if(window.confirm(`Delete role "${role.title}"? Sub-roles will also be orphaned.`)) deleteRole(role._id) }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Paper>
                  {/* Sub-roles nested */}
                  {getSubRoles(role._id).length > 0 && (
                    <Stack spacing={1} sx={{ pl: 4, mt: 1, mb: 1 }}>
                      {getSubRoles(role._id).map((sub) => (
                        <Paper 
                          key={sub._id} 
                          sx={{ 
                            p: 1.5, 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            bgcolor: isDark ? 'rgba(255,255,255,0.01)' : '#fafafa',
                            borderRadius: 2,
                            border: `1px dashed ${theme.palette.divider}`
                          }}
                        >
                          <Box>
                            <Typography variant="body2" fontWeight={600}>↳ {sub.title}</Typography>
                            <Typography variant="caption" color="text.secondary">{sub.description || ""}</Typography>
                          </Box>
                          <Stack direction="row" spacing={0.5}>
                            <IconButton 
                              size="small" 
                              color="primary" 
                              onClick={() => { setEditingRoleId(sub._id); setRoleForm({ title: sub.title, description: sub.description, parentRole: sub.parentRole?._id || sub.parentRole }); setOpenRoleDialog(true); }}
                            >
                              <EditIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              color="error" 
                              onClick={() => { if(window.confirm(`Delete sub-role "${sub.title}"?`)) deleteRole(sub._id) }}
                            >
                              <DeleteIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </Box>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenManageRolesDialog(false)}>Close Management</Button>
        </DialogActions>
      </Dialog>
 
      {/* QUICK ADD / EDIT ROLE DIALOG */}
      <Dialog 
        open={openRoleDialog} 
        onClose={() => { setOpenRoleDialog(false); setEditingRoleId(null); }} 
        fullWidth 
        maxWidth="xs"
        sx={{ zIndex: 1400 }} // Ensure it's above the Management dialog
        PaperProps={{ sx: { borderRadius: 4, boxShadow: theme.shadows[10] } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>
          {editingRoleId
            ? (roleForm.parentRole ? "Update Sub-Role" : "Update Staff Role")
            : (roleForm.parentRole ? "Create Sub-Role" : "Create New Staff Role")
          }
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: "10px !important" }}>
          {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
          <TextField 
            label="Role Title (e.g. Driller)" 
            fullWidth 
            value={roleForm.title} 
            onChange={(e) => setRoleForm({ ...roleForm, title: e.target.value })} 
          />
          <TextField 
            label="Short Description" 
            fullWidth 
            multiline 
            rows={2}
            value={roleForm.description} 
            onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })} 
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => { setOpenRoleDialog(false); setEditingRoleId(null); }}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveRole} sx={{ borderRadius: 2, fontWeight: 700 }}>
            {editingRoleId ? "Update Role" : "Save Role"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* VIEW PROFILE MODAL */}
      <Dialog open={!!viewingEmp} onClose={() => setViewingEmp(null)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 5 } }}>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ height: 120, bgcolor: 'primary.main', position: 'relative' }}>
             <IconButton onClick={() => setViewingEmp(null)} sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}><AddIcon sx={{ transform: 'rotate(45deg)' }}/></IconButton>
          </Box>
          <Box sx={{ px: 4, pb: 4, mt: -6, textAlign: 'center' }}>
            <Avatar src={viewingEmp?.profileImage} sx={{ width: 120, height: 120, mx: "auto", border: "5px solid #fff", boxShadow: theme.shadows[10], mb: 2 }} />
            <Typography variant="h5" fontWeight={900}>{viewingEmp?.name}</Typography>
            <Typography variant="body1" color="primary" fontWeight={700} gutterBottom>{viewingEmp?.role?.title || viewingEmp?.position}</Typography>
            <Divider sx={{ my: 3 }} />
            <Grid container spacing={2} sx={{ textAlign: 'left' }}>
               <Grid item xs={6}><Typography variant="caption" color="text.secondary">STAFF CODE</Typography><Typography variant="body1" fontWeight={700}>{viewingEmp?.employeeCode}</Typography></Grid>
               <Grid item xs={6}><Typography variant="caption" color="text.secondary">DAILY EARNINGS</Typography><Typography variant="body1" fontWeight={700}>₹{viewingEmp?.dailyWage}</Typography></Grid>
               <Grid item xs={12}><Typography variant="caption" color="text.secondary">CONTACT NUMBER</Typography><Typography variant="body1" fontWeight={700}>{viewingEmp?.phone}</Typography></Grid>
               <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>ID CARD PREVIEW</Typography>
                  <Box component="img" src={viewingEmp?.idCardImage} sx={{ width: "100%", borderRadius: 3, border: `1px solid ${theme.palette.divider}` }} />
               </Grid>
            </Grid>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}