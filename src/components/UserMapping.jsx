import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Box,
  Divider,
  CircularProgress,
} from '@mui/material';
import axiosInstance from '../utils/axiosConfig';
import appConfig from '../config/appConfig';

const UserMapping = () => {
  // Hardcoded demo data
  const [staffActive, setStaffActive] = useState([
    { id: 1, name: 'Alice Johnson', username: 'alice.j', role: 'Teacher' },
    { id: 2, name: 'Bob Smith', username: 'bob.s', role: 'Clerk' },
  ]);

  const [staffPending, setStaffPending] = useState([]);
  const [loadingPendingStaff, setLoadingPendingStaff] = useState(false);

  const [parentActive, setParentActive] = useState([
    { id: 21, name: 'David Parent', username: 'dparent', child: 'John D.' },
  ]);
  const [parentPending, setParentPending] = useState([]);
  const [loadingPendingParents, setLoadingPendingParents] = useState(false);

  const makeStaffDisabled = (user) => {
    setStaffActive(prev => prev.filter(u => u.id !== user.id));
    setStaffPending(prev => [user, ...prev]);
  };

  const makeStaffActive = (user) => {
    setStaffPending(prev => prev.filter(u => u.id !== user.id));
    setStaffActive(prev => [user, ...prev]);
  };

  // Fetch probable/pending staff from API on mount
  useEffect(() => {
    const fetchPendingStaff = async () => {
      try {
        setLoadingPendingStaff(true);
        const res = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/mapping/user-mapping/probable-staff`);
        // Map response to the fields used by the table
        const mapped = res.data.map(item => ({
          id: item.id,
          name: item.name,
          username: item.email || item.phone_number || item.id,
          role: item.staff_type || 'UNKNOWN',
          raw: item,
        }));
        setStaffPending(mapped);
      } catch (error) {
        // axios interceptor will dispatch a global alert; keep pending as empty
        console.error('Failed to fetch pending staff', error);
      } finally {
        setLoadingPendingStaff(false);
      }
    };

    fetchPendingStaff();
  }, []);

  // Fetch probable/pending parents on mount
  useEffect(() => {
    const fetchPendingParents = async () => {
      try {
        setLoadingPendingParents(true);
        const res = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/mapping/user-mapping/probable-parents`);
        const mapped = res.data.map(item => ({
          id: item.parent_id,
          name: item.name,
          username: item.email || item.phone_number || item.parent_id,
          // pick first associated child's name for quick display
          child: Array.isArray(item.associations) && item.associations.length > 0 ? item.associations.map(a => a.student_name).join(', ') : '',
          raw: item,
        }));
        setParentPending(mapped);
      } catch (error) {
        console.error('Failed to fetch pending parents', error);
      } finally {
        setLoadingPendingParents(false);
      }
    };

    fetchPendingParents();
  }, []);

  const makeParentDisabled = (user) => {
    setParentActive(prev => prev.filter(u => u.id !== user.id));
    setParentPending(prev => [user, ...prev]);
  };

  const makeParentActive = (user) => {
    setParentPending(prev => prev.filter(u => u.id !== user.id));
    setParentActive(prev => [user, ...prev]);
  };

  return (
    <Container sx={{ mt: 10, mb: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
        User Mapping (Administrative)
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Staff User Mapping</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Active Users</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {staffActive.map(u => (
                  <TableRow key={u.id}>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.username}</TableCell>
                    <TableCell>{u.role}</TableCell>
                    <TableCell align="right">
                      <Button size="small" color="error" variant="contained" onClick={() => makeStaffDisabled(u)}>Make Disabled</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {staffActive.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4}>No active staff users</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Pending Users</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {staffPending.map(u => (
                  <TableRow key={u.id}>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.username}</TableCell>
                    <TableCell>{u.role}</TableCell>
                    <TableCell align="right">
                      <Button size="small" color="primary" variant="contained" onClick={() => makeStaffActive(u)}>Make Active</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {staffPending.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4}>No pending staff users</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Parent User Mapping</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Active Users</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Child</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {parentActive.map(u => (
                  <TableRow key={u.id}>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.username}</TableCell>
                    <TableCell>{u.child}</TableCell>
                    <TableCell align="right">
                      <Button size="small" color="error" variant="contained" onClick={() => makeParentDisabled(u)}>Make Disabled</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {parentActive.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4}>No active parent users</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Pending Users</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Child</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {parentPending.map(u => (
                  <TableRow key={u.id}>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.username}</TableCell>
                    <TableCell>{u.child}</TableCell>
                    <TableCell align="right">
                      <Button size="small" color="primary" variant="contained" onClick={() => makeParentActive(u)}>Make Active</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {parentPending.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4}>No pending parent users</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default UserMapping;
