import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Button, Grid, Divider, Chip, Avatar, Container, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import LockIcon from '@mui/icons-material/Lock';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import PersonIcon from '@mui/icons-material/Person';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axiosInstance from '../utils/axiosConfig';
import appConfig from '../config/appConfig';

const getAvatarColor = (name) => {
  // Simple color hash for avatar
  const colors = ['#1976d2', '#388e3c', '#fbc02d', '#d32f2f', '#7b1fa2'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return colors[hash % colors.length];
};

// This component is now replaced by ManagementDashboard. You can safely remove or archive this file.

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]); // <-- roles state
  const [permissions, setPermissions] = useState([]); // <-- permissions state
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openRoleDialog, setOpenRoleDialog] = useState(false); // <-- role dialog
  const [openPermissionDialog, setOpenPermissionDialog] = useState(false); // <-- permission dialog
  const [form, setForm] = useState({
    username: '', email: '', organization_email: '', first_name: '', last_name: '', phone_number: '', address: '', profile_image_url: '', password: '', roles: []
  });
  const [roleForm, setRoleForm] = useState({ name: '', description: '' });
  const [permissionForm, setPermissionForm] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [creatingRole, setCreatingRole] = useState(false);
  const [creatingPermission, setCreatingPermission] = useState(false);
  const [rolePermissions, setRolePermissions] = useState({});
  const [userRoles, setUserRoles] = useState([]);
  const [assignRoleDialog, setAssignRoleDialog] = useState({ open: false, user: null });
  const [assignPermissionDialog, setAssignPermissionDialog] = useState({ open: false, role: null });
  const [selectedRolePermissions, setSelectedRolePermissions] = useState([]);
  const [selectedUserRoles, setSelectedUserRoles] = useState([]);

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

  const fetchRoles = async () => {
    try {
      const res = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/auth/roles/?skip=0&limit=100`);
      setRoles(res.data);
    } catch (err) {
      setRoles([]);
    }
  };

  const fetchPermissions = async () => {
    try {
      const res = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/auth/permissions/?skip=0&limit=100`);
      setPermissions(res.data);
    } catch (err) {
      setPermissions([]);
    }
  };

  const fetchRolePermissions = async (roleId) => {
    try {
      const res = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/auth/role-permissions/${roleId}/permissions`);
      setRolePermissions(prev => ({ ...prev, [roleId]: res.data }));
    } catch (err) {
      setRolePermissions(prev => ({ ...prev, [roleId]: [] }));
    }
  };

  const fetchAllUserRoles = async () => {
    try {
      const res = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/auth/user-role/`);
      setUserRoles(res.data);
    } catch (err) {
      setUserRoles([]);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchPermissions();
  }, []);

  useEffect(() => {
    roles.forEach(role => fetchRolePermissions(role.id));
    fetchAllUserRoles();
  }, [roles.length]);

  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => setOpenDialog(false);

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await axiosInstance.post('/auth/users/', { ...form, roles: [] });
      handleCloseDialog();
      setForm({ username: '', email: '', organization_email: '', first_name: '', last_name: '', phone_number: '', address: '', profile_image_url: '', password: '', roles: [] });
      fetchUsers();
    } catch (err) {
      // Error handled by api.js interceptor
    } finally {
      setCreating(false);
    }
  };

  // Assign Permissions to Role
  const handleOpenAssignPermission = (role) => {
    setSelectedRolePermissions(rolePermissions[role.id]?.map(p => p.id) || []);
    setAssignPermissionDialog({ open: true, role });
  };
  const handleAssignPermissions = async () => {
    try {
      const filteredIds = selectedRolePermissions.filter(Boolean); // Remove null/undefined
      await axiosInstance.post('/auth/role-permissions/role/assign/permissions', {
        role_id: assignPermissionDialog.role.id,
        permission_ids: filteredIds
      });
      setAssignPermissionDialog({ open: false, role: null });
      fetchRolePermissions(assignPermissionDialog.role.id);
    } catch (err) {}
  };
  // Assign Roles to User
  const handleOpenAssignRole = (user) => {
    setSelectedUserRoles(user.roles?.map(r => r.id) || []);
    setAssignRoleDialog({ open: true, user });
  };
  const handleAssignRoles = async () => {
    try {
      await axiosInstance.post('/auth/user-roleuser/assign/roles', {
        user_id: assignRoleDialog.user.id,
        role_ids: selectedUserRoles
      });
      setAssignRoleDialog({ open: false, user: null });
      fetchAllUserRoles();
      fetchUsers();
    } catch (err) {}
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom color="primary">User Management</Typography>
        <Grid container spacing={2}>
          {users.map(user => (
            <Grid item xs={12} sm={6} md={4} key={user.id}>
              <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#f5f7fa' }}>
                <Avatar sx={{ bgcolor: getAvatarColor(user.username) }} src={user.profile_image_url || undefined}>
                  {!user.profile_image_url && <PersonIcon />}
                </Avatar>
                <Box>
                  <Typography fontWeight={600}>{user.username}</Typography>
                  <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                  <Typography variant="caption" color="text.secondary">{user.first_name} {user.last_name}</Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
        <Button variant="contained" sx={{ mt: 2 }} onClick={handleOpenDialog}>Create New User</Button>
        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle>Create New User</DialogTitle>
          <form onSubmit={handleCreateUser}>
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
              <Button onClick={handleCloseDialog} color="secondary">Cancel</Button>
              <Button type="submit" variant="contained" disabled={creating}>{creating ? 'Creating...' : 'Create'}</Button>
            </DialogActions>
          </form>
        </Dialog>
        <Divider sx={{ my: 3 }}><Chip label="Roles" icon={<AccountTreeIcon />} /></Divider>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight={600}>Roles & Permissions</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {roles.map(role => (
                <Grid item xs={12} sm={6} md={4} key={role.id}>
                  <Paper sx={{ p: 2, bgcolor: '#f5f7fa' }}>
                    <Typography fontWeight={600}>{role.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{role.description}</Typography>
                    <Box sx={{ mt: 1, mb: 1 }}>
                      {(rolePermissions[role.id] || []).map(perm => (
                        <Chip key={perm.id} label={perm.name} size="small" sx={{ mr: 0.5, mb: 0.5 }} icon={<LockIcon fontSize="small" />} />
                      ))}
                    </Box>
                    <Button size="small" onClick={() => handleOpenAssignPermission(role)} variant="outlined">Assign Permissions</Button>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
        <Dialog open={assignPermissionDialog.open} onClose={() => setAssignPermissionDialog({ open: false, role: null })}>
          <DialogTitle>Assign Permissions to Role</DialogTitle>
          <DialogContent>
            {permissions.map(perm => (
              <Box key={perm.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedRolePermissions.includes(perm.id)}
                    onChange={e => {
                      if (e.target.checked) setSelectedRolePermissions([...selectedRolePermissions, perm.id]);
                      else setSelectedRolePermissions(selectedRolePermissions.filter(id => id !== perm.id));
                    }}
                  /> {perm.name}
                </label>
              </Box>
            ))}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAssignPermissionDialog({ open: false, role: null })}>Cancel</Button>
            <Button onClick={handleAssignPermissions} variant="contained">Assign</Button>
          </DialogActions>
        </Dialog>
        <Divider sx={{ my: 3 }}><Chip label="Users & Roles" icon={<GroupIcon />} /></Divider>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight={600}>User-Role Associations</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {users.map(user => (
                <Grid item xs={12} sm={6} md={4} key={user.id}>
                  <Paper sx={{ p: 2, bgcolor: '#f5f7fa' }}>
                    <Typography fontWeight={600}>{user.username}</Typography>
                    <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                    <Box sx={{ mt: 1, mb: 1 }}>
                      {(user.roles || []).map(role => (
                        <Chip key={role.id} label={role.name} size="small" sx={{ mr: 0.5, mb: 0.5 }} icon={<AccountTreeIcon fontSize="small" />} />
                      ))}
                    </Box>
                    <Button size="small" onClick={() => handleOpenAssignRole(user)} variant="outlined">Assign Roles</Button>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
        <Dialog open={assignRoleDialog.open} onClose={() => setAssignRoleDialog({ open: false, user: null })}>
          <DialogTitle>Assign Roles to User</DialogTitle>
          <DialogContent>
            {roles.map(role => (
              <Box key={role.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedUserRoles.includes(role.id)}
                    onChange={e => {
                      if (e.target.checked) setSelectedUserRoles([...selectedUserRoles, role.id]);
                      else setSelectedUserRoles(selectedUserRoles.filter(id => id !== role.id));
                    }}
                  /> {role.name}
                </label>
              </Box>
            ))}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAssignRoleDialog({ open: false, user: null })}>Cancel</Button>
            <Button onClick={handleAssignRoles} variant="contained">Assign</Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default AdminPage;
