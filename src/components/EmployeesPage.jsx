import AddIcon from "@mui/icons-material/Add";
import BadgeIcon from "@mui/icons-material/Badge";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PhoneIcon from "@mui/icons-material/Phone";
import SearchIcon from "@mui/icons-material/Search";
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
  InputBase,
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
  const { data: employees, isLoading, addEmployee, updateEmployee, deleteEmployee } = useEmployees();
  
  const [open, setOpen] = useState(false);
  const [viewingEmp, setViewingEmp] = useState(null); 
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    employeeCode: "", name: "", phone: "", position: "", 
    dailyWage: "", profileImage: "", idCardImage: "",
  });

  const isFormValid = Object.values(formData).every(val => val !== "");

  const filteredEmployees = employees?.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    setFormData({ employeeCode: "", name: "", phone: "", position: "", dailyWage: "", profileImage: "", idCardImage: "" });
  };

  const handleSubmit = () => {
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
                    <Typography variant="body2" fontWeight={600}>{emp.position}</Typography>
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
                  <Tooltip title="Edit"><IconButton size="small" onClick={() => { setEditingId(emp._id); setFormData({...emp}); setOpen(true); }} sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#eee' }}><EditIcon fontSize="inherit" color="primary"/></IconButton></Tooltip>
                  <Tooltip title="Delete"><IconButton size="small" onClick={() => { if(window.confirm(`Delete ${emp.name}?`)) deleteEmployee(emp._id) }} sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#eee' }}><DeleteIcon fontSize="inherit" color="error"/></IconButton></Tooltip>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

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

          <Stack direction="row" spacing={2}>
            <TextField
              label="Designation"
              fullWidth
              value={formData.position}
              onChange={(e) => setFormData({...formData, position: e.target.value})}
            />
            <TextField
              label="Daily Wage (₹)"
              type="number"
              fullWidth
              value={formData.dailyWage}
              onChange={(e) => setFormData({...formData, dailyWage: e.target.value})}
            />
          </Stack>

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

      {/* VIEW PROFILE MODAL */}
      <Dialog open={!!viewingEmp} onClose={() => setViewingEmp(null)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 5 } }}>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ height: 120, bgcolor: 'primary.main', position: 'relative' }}>
             <IconButton onClick={() => setViewingEmp(null)} sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}><AddIcon sx={{ transform: 'rotate(45deg)' }}/></IconButton>
          </Box>
          <Box sx={{ px: 4, pb: 4, mt: -6, textAlign: 'center' }}>
            <Avatar src={viewingEmp?.profileImage} sx={{ width: 120, height: 120, mx: "auto", border: "5px solid #fff", boxShadow: theme.shadows[10], mb: 2 }} />
            <Typography variant="h5" fontWeight={900}>{viewingEmp?.name}</Typography>
            <Typography variant="body1" color="primary" fontWeight={700} gutterBottom>{viewingEmp?.position}</Typography>
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