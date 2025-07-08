import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, Checkbox, FormControlLabel, Paper, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import axiosInstance from '../utils/axiosConfig';
import appConfig from '../config/appConfig';

const UserRoleAssignment = ({ refreshUsers }) => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [userRoles, setUserRoles] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);
  const [assigning, setAssigning] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/auth/users/?skip=0&limit=100`);
      setUsers(res.data);
    } catch (err) { setUsers([]); }
  };
  const fetchRoles = async () => {
    try {
      const res = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/auth/roles/?skip=0&limit=100`);
      setRoles(res.data);
    } catch (err) { setRoles([]); }
  };
  const fetchUserRoles = async (userId) => {
    if (!userId) return;
    setLoading(true);
    try {
      const user = users.find(u => u.id === userId);
      setUserRoles(user?.roles || []);
      setSelectedRoleIds((user?.roles || []).map(r => r.id));
    } catch (err) { setUserRoles([]); setSelectedRoleIds([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); fetchRoles(); }, []);
  useEffect(() => { if (selectedUser) fetchUserRoles(selectedUser); }, [selectedUser, users]);

  const handleAssign = async (e) => {
    e.preventDefault();
    setAssigning(true);
    try {
      await axiosInstance.post(`${appConfig.API_PREFIX_V1}/auth/user-roleuser/assign/roles`, {
        user_id: selectedUser,
        role_ids: selectedRoleIds.filter(Boolean)
      });
      fetchUserRoles(selectedUser);
      setOpenDialog(false);
      if (refreshUsers) refreshUsers();
    } catch (err) {} finally { setAssigning(false); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="user-select-label">Select User</InputLabel>
          <Select
            labelId="user-select-label"
            value={selectedUser}
            label="Select User"
            onChange={e => setSelectedUser(e.target.value)}
          >
            {users.map(user => (
              <MenuItem key={user.id} value={user.id}>{user.username}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="contained" disabled={!selectedUser} onClick={() => setOpenDialog(true)}>Assign Roles</Button>
      </Box>
      <Paper sx={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={userRoles}
          columns={[
            { field: 'name', headerName: 'Role Name', width: 200 },
            { field: 'description', headerName: 'Description', width: 300 },
          ]}
          pageSize={10}
          rowsPerPageOptions={[10, 20, 50]}
          loading={loading}
          getRowId={row => row.id || row.name}
        />
      </Paper>
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Assign Roles to User</DialogTitle>
        <form onSubmit={handleAssign}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 350 }}>
            {roles.map(role => (
              <FormControlLabel
                key={role.id}
                control={
                  <Checkbox
                    checked={selectedRoleIds.includes(role.id)}
                    onChange={e => {
                      if (e.target.checked) setSelectedRoleIds([...selectedRoleIds, role.id]);
                      else setSelectedRoleIds(selectedRoleIds.filter(id => id !== role.id));
                    }}
                  />
                }
                label={role.name}
              />
            ))}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)} color="secondary">Cancel</Button>
            <Button type="submit" variant="contained" disabled={assigning}>{assigning ? 'Assigning...' : 'Assign'}</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default UserRoleAssignment;
