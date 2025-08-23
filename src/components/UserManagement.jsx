// import React, { useEffect, useState } from 'react';
// import { Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, CircularProgress, Drawer, Box, Button } from '@mui/material';
// import axiosInstance from '../utils/axiosConfig';
// import appConfig from '../config/appConfig';

// const UserManagement = () => {
//   const [users, setUsers] = useState([]);
//   const [page, setPage] = useState(0);
//   const [rowsPerPage, setRowsPerPage] = useState(20);
//   const [loading, setLoading] = useState(false);
//   const [selectedUser, setSelectedUser] = useState(null);

//   const fetchUsers = async (page, rowsPerPage) => {
//     setLoading(true);
//     try {
//       const res = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/auth/users/?skip=${page * rowsPerPage}&limit=${rowsPerPage}`);
//       setUsers(res.data);
//     } catch (err) {
//       setUsers([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchUsers(page, rowsPerPage);
//   }, [page, rowsPerPage]);

//   return (
//     <Box>
//       <Typography variant="h5" fontWeight={700} gutterBottom>User Management</Typography>
//       <Paper>
//         <TableContainer>
//           <Table>
//             <TableHead>
//               <TableRow>
//                 <TableCell>Username</TableCell>
//                 <TableCell>Email</TableCell>
//                 <TableCell>First Name</TableCell>
//                 <TableCell>Last Name</TableCell>
//                 <TableCell>Roles</TableCell>
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {loading ? (
//                 <TableRow><TableCell colSpan={5}><CircularProgress /></TableCell></TableRow>
//               ) : users.map(user => (
//                 <TableRow key={user.id} hover onClick={() => setSelectedUser(user)} style={{ cursor: 'pointer' }}>
//                   <TableCell>{user.username}</TableCell>
//                   <TableCell>{user.email}</TableCell>
//                   <TableCell>{user.first_name}</TableCell>
//                   <TableCell>{user.last_name}</TableCell>
//                   <TableCell>{user.roles?.map(r => r.name).join(', ')}</TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         </TableContainer>
//         <TablePagination
//           component="div"
//           count={-1} // Unknown total, so just show next/prev
//           page={page}
//           onPageChange={(_, newPage) => setPage(newPage)}
//           rowsPerPage={rowsPerPage}
//           onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
//           labelDisplayedRows={({ from, to }) => `${from}-${to}`}
//           nextIconButtonProps={{ disabled: users.length < rowsPerPage }}
//         />
//       </Paper>
//       <Drawer anchor="right" open={!!selectedUser} onClose={() => setSelectedUser(null)}>
//         <Box sx={{ width: 350, p: 3 }}>
//           {selectedUser && (
//             <>
//               <Typography variant="h6">{selectedUser.username}</Typography>
//               <Typography>Email: {selectedUser.email}</Typography>
//               <Typography>First Name: {selectedUser.first_name}</Typography>
//               <Typography>Last Name: {selectedUser.last_name}</Typography>
//               <Typography>Roles: {selectedUser.roles?.map(r => r.name).join(', ')}</Typography>
//               <Typography>Phone: {selectedUser.phone_number}</Typography>
//               <Typography>Address: {selectedUser.address}</Typography>
//               <Button sx={{ mt: 2 }} variant="contained" onClick={() => setSelectedUser(null)}>Close</Button>
//             </>
//           )}
//         </Box>
//       </Drawer>
//     </Box>
//   );
// };

// export default UserManagement;
