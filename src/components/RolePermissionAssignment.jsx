// import React, { useEffect, useState } from 'react';
// import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, Checkbox, FormControlLabel, Paper, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
// import { DataGrid } from '@mui/x-data-grid';
// import axiosInstance from '../utils/axiosConfig';
// import appConfig from '../config/appConfig';

// const RolePermissionAssignment = () => {
//   const [roles, setRoles] = useState([]);
//   const [permissions, setPermissions] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [selectedRole, setSelectedRole] = useState('');
//   const [rolePermissions, setRolePermissions] = useState([]);
//   const [openDialog, setOpenDialog] = useState(false);
//   const [selectedPermissionIds, setSelectedPermissionIds] = useState([]);
//   const [assigning, setAssigning] = useState(false);

//   const fetchRoles = async () => {
//     try {
//       const res = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/auth/roles/?skip=0&limit=100`);
//       setRoles(res.data);
//     } catch (err) { setRoles([]); }
//   };
//   const fetchPermissions = async () => {
//     try {
//       const res = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/auth/permissions/?skip=0&limit=100`);
//       setPermissions(res.data);
//     } catch (err) { setPermissions([]); }
//   };
//   const fetchRolePermissions = async (roleId) => {
//     if (!roleId) return;
//     setLoading(true);
//     try {
//       const res = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/auth/role-permissions/${roleId}/permissions`);
//       setRolePermissions(res.data);
//       setSelectedPermissionIds(res.data.map(p => p.id));
//     } catch (err) { setRolePermissions([]); setSelectedPermissionIds([]); }
//     finally { setLoading(false); }
//   };

//   useEffect(() => { fetchRoles(); fetchPermissions(); }, []);
//   useEffect(() => { if (selectedRole) fetchRolePermissions(selectedRole); }, [selectedRole]);

//   const handleAssign = async (e) => {
//     e.preventDefault();
//     setAssigning(true);
//     try {
//       await axiosInstance.post(`${appConfig.API_PREFIX_V1}/auth/role-permissions/role/assign/permissions`, {
//         role_id: selectedRole,
//         permission_ids: selectedPermissionIds.filter(Boolean)
//       });
//       fetchRolePermissions(selectedRole);
//       setOpenDialog(false);
//     } catch (err) {} finally { setAssigning(false); }
//   };

//   return (
//     <Box>
//       <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
//         <FormControl sx={{ minWidth: 200 }}>
//           <InputLabel id="role-select-label">Select Role</InputLabel>
//           <Select
//             labelId="role-select-label"
//             value={selectedRole}
//             label="Select Role"
//             onChange={e => setSelectedRole(e.target.value)}
//           >
//             {roles.map(role => (
//               <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>
//             ))}
//           </Select>
//         </FormControl>
//         <Button variant="contained" disabled={!selectedRole} onClick={() => setOpenDialog(true)}>Assign Permissions</Button>
//       </Box>
//       <Paper sx={{ height: 400, width: '100%' }}>
//         <DataGrid
//           rows={rolePermissions.map(rp => ({
//             ...rp,
//             id: rp.permission_id || rp.id || `${rp.role_id}_${rp.permission_id}`
//           }))}
//           columns={[
//             { field: 'permission_name', headerName: 'Permission Name', width: 200 },
//             { field: 'role_name', headerName: 'Role Name', width: 200 },
//             { field: 'description', headerName: 'Description', width: 300 },
//           ]}
//           pageSize={10}
//           rowsPerPageOptions={[10, 20, 50]}
//           loading={loading}
//           getRowId={row => row.id}
//         />
//       </Paper>
//       <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
//         <DialogTitle>Assign Permissions to Role</DialogTitle>
//         <form onSubmit={handleAssign}>
//           <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 350 }}>
//             {permissions.map(perm => (
//               <FormControlLabel
//                 key={perm.id}
//                 control={
//                   <Checkbox
//                     checked={selectedPermissionIds.includes(perm.id)}
//                     onChange={e => {
//                       if (e.target.checked) setSelectedPermissionIds([...selectedPermissionIds, perm.id]);
//                       else setSelectedPermissionIds(selectedPermissionIds.filter(id => id !== perm.id));
//                     }}
//                   />
//                 }
//                 label={perm.name}
//               />
//             ))}
//           </DialogContent>
//           <DialogActions>
//             <Button onClick={() => setOpenDialog(false)} color="secondary">Cancel</Button>
//             <Button type="submit" variant="contained" disabled={assigning}>{assigning ? 'Assigning...' : 'Assign'}</Button>
//           </DialogActions>
//         </form>
//       </Dialog>
//     </Box>
//   );
// };

// export default RolePermissionAssignment;
