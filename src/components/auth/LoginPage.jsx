import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Tabs,
  Tab,
  Alert,
  Fade,
  InputAdornment,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Visibility,
  VisibilityOff,
  LogoDev
} from '@mui/icons-material';
import { useAuthStore } from '../../store/useAuthStore';

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const { login, register, isLoading, error, clearError } = useAuthStore();

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    clearError();
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (activeTab === 0) {
      await login(formData.email, formData.password);
    } else {
      await register(formData.name, formData.email, formData.password);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #0d1017 0%, #0a0c10 100%)'
            : 'linear-gradient(135deg, #f0f2f5 0%, #e0e4e9 100%)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundImage: (theme) =>
            theme.palette.mode === 'dark'
              ? 'radial-gradient(rgba(249, 115, 22, 0.05) 1px, transparent 1px)'
              : 'radial-gradient(rgba(37, 99, 235, 0.05) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }
      }}
    >
      <Container maxWidth="sm">
        <Fade in timeout={800}>
          <Paper
            elevation={24}
            sx={{
              p: 4,
              borderRadius: 4,
              backdropFilter: 'blur(10px)',
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  p: 1.5,
                  borderRadius: 2,
                  background: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                      : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  mb: 2,
                  boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                }}
              >
                <LogoDev sx={{ color: 'white', fontSize: 32 }} />
              </Box>
              <Typography variant="h4" fontWeight={900} color="text.primary">
                QUARRY <Box component="span" sx={{ color: 'primary.main' }}>PRO</Box>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, letterSpacing: 1 }}>
                ADVANCED MINING MANAGEMENT
              </Typography>
            </Box>

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              centered
              sx={{
                mb: 4,
                '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' }
              }}
            >
              <Tab label="LOGIN" sx={{ fontWeight: 700, px: 4 }} />
              <Tab label="REGISTER" sx={{ fontWeight: 700, px: 4 }} />
            </Tabs>

            {/* Error Message */}
            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {activeTab === 1 && (
                <TextField
                  fullWidth
                  name="name"
                  label="Full Name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  sx={{ mb: 2.5 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              )}

              <TextField
                fullWidth
                name="email"
                label="Email Address"
                type="email"
                placeholder="name@company.com"
                value={formData.email}
                onChange={handleChange}
                required
                sx={{ mb: 2.5 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                fullWidth
                size="large"
                type="submit"
                variant="contained"
                disabled={isLoading}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 800,
                  fontSize: '1rem',
                  boxShadow: (theme) =>
                    `0 8px 16px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(37, 99, 235, 0.2)'}`,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: (theme) =>
                      `0 12px 20px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(37, 99, 235, 0.3)'}`,
                  },
                  transition: 'all 0.2s'
                }}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  activeTab === 0 ? 'SIGN IN' : 'CREATE ACCOUNT'
                )}
              </Button>
            </form>

            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                © 2026 QUARRY PRO SUITE • ALL RIGHTS RESERVED
              </Typography>
            </Box>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default LoginPage;
