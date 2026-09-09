import React, { useState } from 'react';
import {
  Box, Paper, TextField, Button, Typography, Tabs, Tab, Alert,
  InputAdornment, IconButton, CircularProgress,
} from '@mui/material';
import {
  MailOutline as EmailIcon,
  LockOutlined as LockIcon,
  PersonOutline as PersonIcon,
  VisibilityOutlined,
  VisibilityOffOutlined,
} from '@mui/icons-material';
import { useAuthStore } from '../../store/useAuthStore';

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  const { login, register, isLoading, error, clearError } = useAuthStore();

  const handleTabChange = (_e, newValue) => {
    setActiveTab(newValue);
    clearError();
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (activeTab === 0) await login(formData.email, formData.password);
    else await register(formData.name, formData.email, formData.password, 'admin');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Paper
        variant="outlined"
        sx={{ width: '100%', maxWidth: 400, p: 4, borderRadius: '14px' }}
      >
        <Box sx={{ mb: 3.5 }}>
          <Box
            sx={{
              width: 40, height: 40, borderRadius: '9px',
              bgcolor: 'primary.main', color: 'primary.contrastText',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '1.1rem', mb: 2,
            }}
          >
            A
          </Box>
          <Typography variant="h1" sx={{ fontSize: '1.375rem' }}>Aura Farming</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>
            Quarry operations management
          </Typography>
        </Box>

        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3, minHeight: 40 }}>
          <Tab label="Sign in" sx={{ minHeight: 40, px: 2 }} />
          <Tab label="Register" sx={{ minHeight: 40, px: 2 }} />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>
        )}

        <form onSubmit={handleSubmit}>
          {activeTab === 1 && (
            <TextField
              fullWidth
              name="name"
              label="Full name"
              value={formData.name}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
          )}

          <TextField
            fullWidth
            name="email"
            label="Email address"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            required
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                    {showPassword ? <VisibilityOffOutlined fontSize="small" /> : <VisibilityOutlined fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button fullWidth size="large" type="submit" variant="contained" disabled={isLoading}>
            {isLoading
              ? <CircularProgress size={20} color="inherit" />
              : activeTab === 0 ? 'Sign in' : 'Create account'}
          </Button>
        </form>

        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 3, textAlign: 'center' }}>
          © 2026 Aura Farming Solutions Pvt. Ltd.
        </Typography>
      </Paper>
    </Box>
  );
};

export default LoginPage;
