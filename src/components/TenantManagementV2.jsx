// import React, { useEffect, useState, useMemo } from 'react';
// import { Paper, Typography, Button, Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, Card, CardContent } from '@mui/material';
// import { DataGrid } from '@mui/x-data-grid';
// import axiosInstance from '../utils/axiosConfig';
// import appConfig from '../config/appConfig';

// const TenantManagementV2 = () => {
//   const [tenants, setTenants] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [openDialog, setOpenDialog] = useState(false);
//   const [form, setForm] = useState({ name: '', email_id: '', address: '' });
//   const [creating, setCreating] = useState(false);
//   const [search, setSearch] = useState('');

//   const fetchTenants = async () => {
//     setLoading(true);
//     try {
//       const res = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/auth/tenants/?skip=0&limit=100`);
//       setTenants(res.data);
//     } catch (err) {
//       setTenants([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { fetchTenants(); }, []);

//   const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
//   const handleCreate = async (e) => {
//     e.preventDefault();
//     setCreating(true);
//     try {
//       await axiosInstance.post(`${appConfig.API_PREFIX_V1}/auth/tenants`, form);
//       setOpenDialog(false);
//       setForm({ name: '', email_id: '', address: '' });
//       fetchTenants();
//     } catch (err) {} finally { setCreating(false); }
//   };

//   const filteredTenants = useMemo(() => {
//     if (!search) return tenants;
//     return tenants.filter(t => (
//       (t.name + t.email_id + t.address).toLowerCase().includes(search.toLowerCase())
//     ));
//   }, [tenants, search]);

//   return (
//     <Box>
//       <Grid container spacing={2} sx={{ mb: 2 }}>
//         <Grid item xs={12} sm={6} md={4}>
//           <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
//             <CardContent>
//               <Typography variant="h6">Total Tenants</Typography>
//               <Typography variant="h3">{tenants.length}</Typography>
//             </CardContent>
//           </Card>
//         </Grid>
//       </Grid>
//       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
//         <TextField
//           size="small"
//           placeholder="Search tenants..."
//           value={search}
//           onChange={e => setSearch(e.target.value)}
//           sx={{ width: 300 }}
//         />
//         <Button variant="contained" onClick={() => setOpenDialog(true)}>Create Tenant</Button>
//       </Box>
//       <Paper sx={{ height: 600, width: '100%' }}>
//         <DataGrid
//           rows={filteredTenants}
//           columns={[
//             { field: 'name', headerName: 'Name', width: 200 },
//             { field: 'email_id', headerName: 'Email', width: 220 },
//             { field: 'address', headerName: 'Address', width: 300 },
//           ]}
//           pageSize={10}
//           rowsPerPageOptions={[10, 20, 50]}
//           loading={loading}
//           getRowId={row => row.id || row.name}
//         />
//       </Paper>
//       <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
//         <DialogTitle>Create Tenant</DialogTitle>
//         <form onSubmit={handleCreate}>
//           <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 350 }}>
//             <TextField label="Name" name="name" value={form.name} onChange={handleFormChange} required fullWidth />
//             <TextField label="Email" name="email_id" value={form.email_id} onChange={handleFormChange} required fullWidth />
//             <TextField label="Address" name="address" value={form.address} onChange={handleFormChange} required fullWidth />
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

// export default TenantManagementV2;
