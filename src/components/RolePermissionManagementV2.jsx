// import React, { useState } from 'react';
// import { Box, Tabs, Tab, Paper } from '@mui/material';
// import RoleTable from './RoleTable';
// import PermissionTable from './PermissionTable';
// import RolePermissionAssignment from './RolePermissionAssignment';
// import UserRoleAssignment from './UserRoleAssignment';

// const RolePermissionManagementV2 = ({ refreshUsers }) => {
//   const [tab, setTab] = useState(0);

//   return (
//     <Box>
//       <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
//         <Tab label="Roles" />
//         <Tab label="Permissions" />
//         <Tab label="Role-Permission Assignment" />
//         <Tab label="User-Role Assignment" />
//       </Tabs>
//       <Paper sx={{ p: 2 }}>
//         {tab === 0 && <RoleTable />}
//         {tab === 1 && <PermissionTable />}
//         {tab === 2 && <RolePermissionAssignment />}
//         {tab === 3 && <UserRoleAssignment refreshUsers={refreshUsers} />}
//       </Paper>
//     </Box>
//   );
// };

// export default RolePermissionManagementV2;
