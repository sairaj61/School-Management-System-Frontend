import React, { useState } from 'react';
import { Box, Tabs, Tab, Paper } from '@mui/material';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import GroupIcon from '@mui/icons-material/Group';
import AdminPage from './AdminPage';
import SuperUserPage from './SuperUserPage';

const UserTenantManagement = () => {
  const [tab, setTab] = useState('admin');
  const isSuperuser = (localStorage.getItem('role') || 'superuser') === 'superuser';

  return (
    <Box sx={{ mt: 4, mx: 'auto', maxWidth: 1100 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="fullWidth"
          sx={{ mb: 3 }}
        >
          <Tab
            label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><GroupIcon /> Admin</Box>}
            value="admin"
          />
          {isSuperuser && (
            <Tab
              label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><SupervisorAccountIcon /> Superuser</Box>}
              value="superuser"
            />
          )}
        </Tabs>
        {tab === 'admin' && <AdminPage />}
        {tab === 'superuser' && isSuperuser && <SuperUserPage />}
      </Paper>
    </Box>
  );
};

export default UserTenantManagement;
