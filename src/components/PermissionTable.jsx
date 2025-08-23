// import React, { useEffect, useState } from 'react';
// import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Paper } from '@mui/material';
// import { DataGrid } from '@mui/x-data-grid';
// import axiosInstance from '../utils/axiosConfig';
// import appConfig from '../config/appConfig';

// const PermissionTable = () => {
//   const [permissions, setPermissions] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [openDialog, setOpenDialog] = useState(false);
//   const [form, setForm] = useState({ name: '', description: '' });
//   const [creating, setCreating] = useState(false);

//   const fetchPermissions = async () => {
//     setLoading(true);
//     try {
//       const res = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/auth/permissions/?skip=0&limit=100`);
//       setPermissions(res.data);
//     } catch (err) {
//       setPermissions([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { fetchPermissions(); }, []);

//   const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
//   const handleCreate = async (e) => {
//     e.preventDefault();
//     setCreating(true);
//     try {
//       await axiosInstance.post(`${appConfig.API_PREFIX_V1}/auth/permissions/`, form);
//       setOpenDialog(false);
//       setForm({ name: '', description: '' });
//       fetchPermissions();
//     } catch (err) {} finally { setCreating(false); }
//   };

//   return (
//     <Box>
//       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
//         <Typography variant="h6">Permissions</Typography>
//         <Button variant="contained" onClick={() => setOpenDialog(true)}>Create Permission</Button>
//       </Box>
//       <Paper sx={{ height: 500, width: '100%' }}>
//         <DataGrid
//           rows={permissions}
//           columns={[
//             { field: 'name', headerName: 'Name', width: 200 },
//             { field: 'description', headerName: 'Description', width: 300 },
//           ]}
//           pageSize={10}
//           rowsPerPageOptions={[10, 20, 50]}
//           loading={loading}
//           getRowId={row => row.id || row.name}
//         />
//       </Paper>
//       <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
//         <DialogTitle>Create Permission</DialogTitle>
//         <form onSubmit={handleCreate}>
//           <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 350 }}>
//             <TextField label="Name" name="name" value={form.name} onChange={handleFormChange} required fullWidth />
//             <TextField label="Description" name="description" value={form.description} onChange={handleFormChange} required fullWidth />
//           </DialogContent>
//           <DialogActions>
//             <Button onClick={() => setOpenDialog(false)} color="secondary">Cancel</Button>
//             <Button type="submit" variant="contained" disabled={creating}>{creating ? 'Creating...' : 'Create'}</Button>
//           </DialogActions>
//         </form>
//       </Dialog>
//     </Box>
//   );
// };

// export default PermissionTable;
