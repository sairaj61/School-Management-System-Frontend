// import React, { useEffect, useState } from 'react';
// import {
//   Box, Typography, Paper, Button, Grid, Divider, Avatar, Container, TextField, Dialog, DialogTitle, DialogContent, DialogActions
// } from '@mui/material';
// import PersonIcon from '@mui/icons-material/Person';
// import axiosInstance from '../utils/axiosConfig';
// import UserManagementV2 from './UserManagementV2';
// import appConfig from '../config/appConfig';
// import AppBar from '@mui/material/AppBar';
// import Toolbar from '@mui/material/Toolbar';
// import SchoolIcon from '@mui/icons-material/School';

// const getAvatarColor = (name) => {
//   // Simple color hash for avatar
//   const colors = ['#1976d2', '#388e3c', '#fbc02d', '#d32f2f', '#7b1fa2'];
//   let hash = 0;
//   for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
//   return colors[hash % colors.length];
// };

// // Standalone SuperUserPage for superuser-only flow
// const SuperUserPage = () => {
//   const [tenants, setTenants] = useState([]);
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [openDialog, setOpenDialog] = useState(false);
//   const [form, setForm] = useState({ name: '', email_id: '', address: '' });
//   const [creating, setCreating] = useState(false);

//   const fetchTenants = async () => {
//     setLoading(true);
//     try {
//       const res = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/auth/tenants`);
//       setTenants(res.data);
//     } catch (err) {
//       setTenants([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchUsers = async () => {
//     try {
//       const res = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/auth/users/?skip=0&limit=100`);
//       setUsers(res.data);
//     } catch (err) {
//       setUsers([]);
//     }
//   };

//   useEffect(() => {
//     fetchTenants();
//     fetchUsers();
//   }, []);

//   const handleOpenDialog = () => setOpenDialog(true);
//   const handleCloseDialog = () => setOpenDialog(false);

//   const handleFormChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleCreateTenant = async (e) => {
//     e.preventDefault();
//     setCreating(true);
//     try {
//       await axiosInstance.post(`${appConfig.API_PREFIX_V1}/auth/tenants`, form);
//       handleCloseDialog();
//       setForm({ name: '', email_id: '', address: '' });
//       fetchTenants();
//     } catch (err) {
//       // Error handled by api.js interceptor
//     } finally {
//       setCreating(false);
//     }
//   };

//   return (
//     <Box sx={{ flexGrow: 1, minHeight: '100vh', background: 'linear-gradient(to right, #e3f2fd, #ffffff)' }}>
//       <AppBar position="fixed" color="primary" elevation={2}>
//         <Toolbar>
//           <SchoolIcon sx={{ mr: 2 }} />
//           <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
//             School Management System
//           </Typography>
//         </Toolbar>
//       </AppBar>
//       <Toolbar /> {/* Spacer for fixed AppBar */}
//       <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
//         <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
//           <Typography variant="h5" fontWeight={700} gutterBottom color="primary">Tenant Management</Typography>
//           <Grid container spacing={2}>
//             {tenants.map(tenant => (
//               <Grid item xs={12} sm={6} md={4} key={tenant.id}>
//                 <Paper sx={{ p: 2, bgcolor: '#f5f7fa' }}>
//                   <Typography fontWeight={600}>{tenant.name}</Typography>
//                   <Typography variant="caption" color="text.secondary">ID: {tenant.id}</Typography>
//                   {tenant.email_id && (
//                     <Typography variant="caption" color="text.secondary">Email: {tenant.email_id}</Typography>
//                   )}
//                   {tenant.address && (
//                     <Typography variant="caption" color="text.secondary">Address: {tenant.address}</Typography>
//                   )}
//                   {tenant.schema_name && (
//                     <Typography variant="caption" color="text.secondary">Schema: {tenant.schema_name}</Typography>
//                   )}
//                 </Paper>
//               </Grid>
//             ))}
//           </Grid>
//           <Button variant="contained" sx={{ mt: 2 }} onClick={handleOpenDialog}>Create New Tenant</Button>
//           <Dialog open={openDialog} onClose={handleCloseDialog}>
//             <DialogTitle>Create New Tenant</DialogTitle>
//             <form onSubmit={handleCreateTenant}>
//               <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 350 }}>
//                 <TextField label="Name" name="name" value={form.name} onChange={handleFormChange} required fullWidth />
//                 <TextField label="Email" name="email_id" value={form.email_id} onChange={handleFormChange} required fullWidth />
//                 <TextField label="Address" name="address" value={form.address} onChange={handleFormChange} required fullWidth />
//               </DialogContent>
//               <DialogActions>
//                 <Button onClick={handleCloseDialog} color="secondary">Cancel</Button>
//                 <Button type="submit" variant="contained" disabled={creating}>{creating ? 'Creating...' : 'Create'}</Button>
//               </DialogActions>
//             </form>
//           </Dialog>
//         </Paper>
//         <Paper elevation={3} sx={{ p: 3 }}>
//           <Typography variant="h5" fontWeight={700} gutterBottom color="primary">User Management</Typography>
//           <UserManagementV2 />
//         </Paper>
//       </Container>
//     </Box>
//   );
// };

// export default SuperUserPage;
