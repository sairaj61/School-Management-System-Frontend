// import React, { useState } from 'react';
// import { Drawer, List, ListItem, ListItemIcon, ListItemText, Box, Typography } from '@mui/material';
// import GroupIcon from '@mui/icons-material/Group';
// import BusinessIcon from '@mui/icons-material/Business';
// import AccountTreeIcon from '@mui/icons-material/AccountTree';
// import TenantManagement from './TenantManagementV2';
// import UserManagement from './UserManagementV2';
// import RolePermissionManagement from './RolePermissionManagementV2';

// const sections = [
//   { key: 'tenants', label: 'Tenants', icon: <BusinessIcon /> },
//   { key: 'users', label: 'Users', icon: <GroupIcon /> },
//   { key: 'roles', label: 'Roles & Permissions', icon: <AccountTreeIcon /> },
// ];

// const ManagementDashboard = () => {
//   const [section, setSection] = useState('tenants');
//   const [userRefreshKey, setUserRefreshKey] = useState(0);
//   const refreshUsers = () => setUserRefreshKey((k) => k + 1);

//   return (
//     <Box sx={{ display: 'flex', height: '100vh' }}>
//       <Drawer variant="permanent" anchor="left" sx={{ width: 220, flexShrink: 0, '& .MuiDrawer-paper': { width: 220, boxSizing: 'border-box' } }}>
//         <Box sx={{ p: 2 }}>
//           <Typography variant="h6" fontWeight={700}>Management</Typography>
//         </Box>
//         <List>
//           {sections.map(s => (
//             <ListItem button key={s.key} selected={section === s.key} onClick={() => setSection(s.key)}>
//               <ListItemIcon>{s.icon}</ListItemIcon>
//               <ListItemText primary={s.label} />
//             </ListItem>
//           ))}
//         </List>
//       </Drawer>
//       <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
//         {section === 'tenants' && <TenantManagement />}
//         {section === 'users' && <UserManagement key={userRefreshKey} />}
//         {section === 'roles' && <RolePermissionManagement refreshUsers={refreshUsers} />}
//       </Box>
//     </Box>
//   );
// };

// export default ManagementDashboard;
