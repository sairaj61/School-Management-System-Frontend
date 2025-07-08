import React, { useEffect, useState, useMemo } from 'react';
import { Paper, Typography, Button, Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, Card, CardContent } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import axiosInstance from '../utils/axiosConfig';
import appConfig from '../config/appConfig';

const UserManagementV2 = ({ userRefreshKey }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', organization_email: '', first_name: '', last_name: '', phone_number: '', address: '', profile_image_url: '', password: '', roles: [] });
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/auth/users/?skip=0&limit=100`);
      setUsers(res.data);
    } catch (err) {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [userRefreshKey]);

  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await axiosInstance.post(`${appConfig.API_PREFIX_V1}/auth/users/`, form);
      setOpenDialog(false);
      setForm({ username: '', email: '', organization_email: '', first_name: '', last_name: '', phone_number: '', address: '', profile_image_url: '', password: '', roles: [] });
      fetchUsers();
    } catch (err) {} finally { setCreating(false); }
  };

  const filteredUsers = useMemo(() => {
    if (!search) return users;
    return users.filter(u => (
      (u.username + u.email + u.first_name + u.last_name + u.phone_number + u.address)
        .toLowerCase().includes(search.toLowerCase())
    ));
  }, [users, search]);

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <CardContent>
              <Typography variant="h6">Total Users</Typography>
              <Typography variant="h3">{users.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search users..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ width: 300 }}
        />
        <Button variant="contained" onClick={() => setOpenDialog(true)}>Create User</Button>
      </Box>
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={filteredUsers}
          columns={[
            { field: 'username', headerName: 'Username', width: 160 },
            { field: 'email', headerName: 'Email', width: 200 },
            { field: 'first_name', headerName: 'First Name', width: 120 },
            { field: 'last_name', headerName: 'Last Name', width: 120 },
            { field: 'roles', headerName: 'Roles', width: 200, valueGetter: (params) => (params.row.roles || []).map(r => r.name).join(', ') },
          ]}
          pageSize={10}
          rowsPerPageOptions={[10, 20, 50]}
          loading={loading}
          getRowId={row => row.id || row.username}
        />
      </Paper>
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Create User</DialogTitle>
        <form onSubmit={handleCreate}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 350 }}>
            <TextField label="Username" name="username" value={form.username} onChange={handleFormChange} required fullWidth />
            <TextField label="Email" name="email" value={form.email} onChange={handleFormChange} required fullWidth />
            <TextField label="Organization Email" name="organization_email" value={form.organization_email} onChange={handleFormChange} required fullWidth />
            <TextField label="First Name" name="first_name" value={form.first_name} onChange={handleFormChange} required fullWidth />
            <TextField label="Last Name" name="last_name" value={form.last_name} onChange={handleFormChange} required fullWidth />
            <TextField label="Phone Number" name="phone_number" value={form.phone_number} onChange={handleFormChange} required fullWidth />
            <TextField label="Address" name="address" value={form.address} onChange={handleFormChange} required fullWidth />
            <TextField label="Profile Image URL" name="profile_image_url" value={form.profile_image_url} onChange={handleFormChange} fullWidth />
            <TextField label="Password" name="password" value={form.password} onChange={handleFormChange} type="password" required fullWidth />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)} color="secondary">Cancel</Button>
            <Button type="submit" variant="contained" disabled={creating}>{creating ? 'Creating...' : 'Create'}</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default UserManagementV2;
