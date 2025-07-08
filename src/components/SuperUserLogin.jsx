import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Container, Alert } from '@mui/material';
import ManagementDashboard from './ManagementDashboard';
import axiosInstance from '../utils/axiosConfig';
import appConfig from '../config/appConfig';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import SchoolIcon from '@mui/icons-material/School';

const SuperUserLogin = () => {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Updated: send as application/x-www-form-urlencoded for OAuth2
      const params = new URLSearchParams();
      params.append('grant_type', 'password');
      params.append('username', form.username);
      params.append('password', form.password);
      params.append('scope', '');
      params.append('client_id', 'string');
      params.append('client_secret', 'string');
      const res = await axiosInstance.post(`${appConfig.API_PREFIX_V1}/auth/superuser-login`, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      if (res.data && (res.data.access_token || res.data.success)) {
        setAuthenticated(true);
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (authenticated) return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', background: 'linear-gradient(to right, #e3f2fd, #ffffff)' }}>
      <AppBar position="fixed" color="primary" elevation={2} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <SchoolIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            School Management System
          </Typography>
        </Toolbar>
      </AppBar>
      <Box sx={{ display: 'flex' }}>
        <Box sx={{ width: 220, minHeight: '100vh', bgcolor: 'white', borderRight: 1, borderColor: 'divider', boxShadow: 1, pt: 8, position: 'fixed', top: 0, left: 0, zIndex: (theme) => theme.zIndex.appBar - 1 }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} color="primary">Superuser Menu</Typography>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button variant="text" color="primary" fullWidth>Dashboard</Button>
              <Button variant="text" color="primary" fullWidth>Tenants</Button>
              <Button variant="text" color="primary" fullWidth>Users</Button>
            </Box>
          </Box>
        </Box>
        <Box sx={{ flex: 1, ml: '220px', minHeight: '100vh', p: 3, background: 'transparent', pt: 10 }}>
          <ManagementDashboard />
        </Box>
      </Box>
    </Box>
  );

  return (
    <Container maxWidth="xs" sx={{ mt: 10 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom align="center">Superuser Login</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField
            label="Username"
            name="username"
            value={form.username}
            onChange={handleChange}
            required
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
            fullWidth
            sx={{ mb: 2 }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </Paper>
    </Container>
  );
};

export default SuperUserLogin;
