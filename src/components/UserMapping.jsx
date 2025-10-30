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
  Tabs,
  Tab,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import axiosInstance from '../utils/axiosConfig';
import appConfig from '../config/appConfig';

const UserMapping = () => {
  // Active users (will be loaded from API)
  const [staffActive, setStaffActive] = useState([]);
  const [loadingActiveUsers, setLoadingActiveUsers] = useState(false);

  const [staffPending, setStaffPending] = useState([]);
  const [loadingPendingStaff, setLoadingPendingStaff] = useState(false);
  const [staffFilter, setStaffFilter] = useState('');
  const [selectedPendingStaff, setSelectedPendingStaff] = useState([]);
  const [staffPageSize, setStaffPageSize] = useState(25);
  const [staffFormPending, setStaffFormPending] = useState([]);
  const [staffStatusIndex, setStaffStatusIndex] = useState(0); // 0:Active,1:Pending,2:FormAdminPending,3:Disabled

  const [parentActive, setParentActive] = useState([
    { id: 21, name: 'David Parent', username: 'dparent', child: 'John D.' },
  ]);
  const [parentPending, setParentPending] = useState([]);
  const [loadingPendingParents, setLoadingPendingParents] = useState(false);
  const [parentFilter, setParentFilter] = useState('');
  const [selectedPendingParents, setSelectedPendingParents] = useState([]);
  const [parentPageSize, setParentPageSize] = useState(25);
  const [parentFormPending, setParentFormPending] = useState([]);
  const [parentStatusIndex, setParentStatusIndex] = useState(0); // 0:Active,1:Pending,2:FormAdminPending,3:Disabled
  const [actionLoadingIds, setActionLoadingIds] = useState([]);
  const [disabledStaff, setDisabledStaff] = useState([]);
  const [disabledParents, setDisabledParents] = useState([]);
  const [loadingDisabled, setLoadingDisabled] = useState(false);

  const makeStaffDisabled = (user) => {
    // Call backend to disable active staff (POST /mapping/user-mapping/disable/{id}/STAFF)
    (async () => {
      const id = user.id;
      try {
        setActionLoadingIds(prev => [...prev, id]);
        await axiosInstance.post(`${appConfig.API_PREFIX_V1}/mapping/user-mapping/disable/${id}/STAFF`);
        // Move to pending on success
        setStaffActive(prev => prev.filter(u => u.id !== id));
        // normalize pending shape
        const pendingObj = {
          id: id,
          name: user.name,
          username: user.username || (user.raw && (user.raw.email || user.raw.phone_number)) || id,
          role: user.role || (user.raw && user.raw.staff_type) || 'UNKNOWN',
          raw: user.raw || null,
        };
        setStaffPending(prev => [pendingObj, ...prev]);
        window.dispatchEvent(new CustomEvent('global-alert', { detail: { message: 'Staff disabled successfully', severity: 'success' } }));
      } catch (error) {
        console.error('Disable staff failed', error);
      } finally {
        setActionLoadingIds(prev => prev.filter(i => i !== id));
      }
    })();
  };

  const makeStaffActive = (user) => {
    // Call backend to activate pending staff (POST /mapping/user-mapping/activate/{id}/STAFF)
    (async () => {
      const id = user.id;
      try {
        setActionLoadingIds(prev => [...prev, id]);
        await axiosInstance.post(`${appConfig.API_PREFIX_V1}/mapping/user-mapping/activate/${id}/STAFF`);
        // On success, move from pending to active
        setStaffPending(prev => prev.filter(u => u.id !== id));
        const activeObj = {
          id: id,
          name: user.name,
          username: user.username,
          role: user.role || (user.raw && user.raw.staff_type) || 'UNKNOWN',
          raw: user.raw || null,
        };
        setStaffActive(prev => [activeObj, ...prev]);
        window.dispatchEvent(new CustomEvent('global-alert', { detail: { message: 'Staff activated successfully', severity: 'success' } }));
      } catch (error) {
        console.error('Activate staff failed', error);
      } finally {
        setActionLoadingIds(prev => prev.filter(i => i !== id));
      }
    })();
  };

  // Create a user from the probable/pending staff list (calls make_user)
  const makeStaffFromProbable = (user) => {
    (async () => {
      const id = user.id;
      try {
        setActionLoadingIds(prev => [...prev, id]);
        await axiosInstance.post(`${appConfig.API_PREFIX_V1}/mapping/user-mapping/make_user`, {
          tenant_user_id: id,
          user_type: 'STAFF',
        });
        // On success, remove from probable pending and add to active
        setStaffPending(prev => prev.filter(u => u.id !== id));
        const activeObj = {
          id: id,
          name: user.name,
          username: user.username,
          role: user.role || (user.raw && user.raw.staff_type) || 'UNKNOWN',
          raw: user.raw || null,
        };
        setStaffActive(prev => [activeObj, ...prev]);
        window.dispatchEvent(new CustomEvent('global-alert', { detail: { message: 'Staff user created successfully', severity: 'success' } }));
      } catch (error) {
        console.error('Create staff user failed', error);
      } finally {
        setActionLoadingIds(prev => prev.filter(i => i !== id));
      }
    })();
  };

  const makeStaffEnable = (user) => {
    // Call backend to enable a disabled staff user (POST /mapping/user-mapping/enable/{id}/STAFF)
    (async () => {
      const id = user.id;
      try {
        setActionLoadingIds(prev => [...prev, id]);
        await axiosInstance.post(`${appConfig.API_PREFIX_V1}/mapping/user-mapping/enable/${id}/STAFF`);
        // remove from disabled list
        setDisabledStaff(prev => prev.filter(u => u.id !== id));
        const activeObj = {
          id: id,
          name: user.name,
          username: user.username,
          role: user.role || (user.raw && user.raw.staff_type) || 'UNKNOWN',
          raw: user.raw || null,
        };
        setStaffActive(prev => [activeObj, ...prev]);
        window.dispatchEvent(new CustomEvent('global-alert', { detail: { message: 'Staff enabled successfully', severity: 'success' } }));
      } catch (error) {
        console.error('Enable staff failed', error);
      } finally {
        setActionLoadingIds(prev => prev.filter(i => i !== id));
      }
    })();
  };

  const activateSelectedStaff = () => {
    // Activate each selected pending staff row
    const toActivate = staffPending.filter(r => selectedPendingStaff.includes(r.id));
    toActivate.forEach(u => makeStaffFromProbable(u));
    // clear selection
    setSelectedPendingStaff([]);
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

  // Fetch pending users intended for Form Admin Pending tab (staff + parents)
  useEffect(() => {
    const fetchFormAdminPending = async () => {
      try {
        const res = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/mapping/user-mapping/pending-user`);

        const pendingStaffRaw = Array.isArray(res.data.pending_staff) ? res.data.pending_staff : [];
        const pendingParentsRaw = Array.isArray(res.data.pending_parents) ? res.data.pending_parents : [];

        const mappedStaffForm = pendingStaffRaw.map(item => ({
          id: item.id,
          name: item.name,
          username: item.email || item.phone_number || item.id,
          role: item.staff_type || 'UNKNOWN',
          raw: item,
        }));

        const mappedParentsForm = pendingParentsRaw.map(item => ({
          id: item.parent_id || item.id,
          name: item.name,
          username: item.email || item.phone_number || item.parent_id || item.id,
          child: Array.isArray(item.associations) && item.associations.length > 0 ? item.associations.map(a => a.student_name).join(', ') : '',
          raw: item,
        }));

        // Populate the Form Admin Pending lists (do NOT alter the regular pending lists)
        setStaffFormPending(mappedStaffForm);
        setParentFormPending(mappedParentsForm);
      } catch (error) {
        console.error('Failed to fetch form-admin pending users', error);
      }
    };

    fetchFormAdminPending();
  }, []);

  const makeParentDisabled = (user) => {
    // Call backend to disable parent
    (async () => {
      const id = user.id;
      try {
        setActionLoadingIds(prev => [...prev, id]);
        await axiosInstance.post(`${appConfig.API_PREFIX_V1}/mapping/user-mapping/disable/${id}/PARENT`);
        setParentActive(prev => prev.filter(u => u.id !== id));
        const pendingObj = {
          id: id,
          name: user.name,
          username: user.username || (user.raw && (user.raw.email || user.raw.phone_number)) || id,
          child: user.child || (user.raw && Array.isArray(user.raw.associations) ? user.raw.associations.map(a => a.student_name).join(', ') : ''),
          raw: user.raw || null,
        };
        setParentPending(prev => [pendingObj, ...prev]);
        window.dispatchEvent(new CustomEvent('global-alert', { detail: { message: 'Parent disabled successfully', severity: 'success' } }));
      } catch (error) {
        console.error('Disable parent failed', error);
      } finally {
        setActionLoadingIds(prev => prev.filter(i => i !== id));
      }
    })();
  };

  const makeParentActive = (user) => {
    // Call backend to activate parent
    (async () => {
      const id = user.id;
      try {
        setActionLoadingIds(prev => [...prev, id]);
        await axiosInstance.post(`${appConfig.API_PREFIX_V1}/mapping/user-mapping/activate/${id}/PARENT`);
        setParentPending(prev => prev.filter(u => u.id !== id));
        const activeObj = {
          id: id,
          name: user.name,
          username: user.username,
          child: user.child || (user.raw && Array.isArray(user.raw.associations) ? user.raw.associations.map(a => a.student_name).join(', ') : ''),
          raw: user.raw || null,
        };
        setParentActive(prev => [activeObj, ...prev]);
        window.dispatchEvent(new CustomEvent('global-alert', { detail: { message: 'Parent activated successfully', severity: 'success' } }));
      } catch (error) {
        console.error('Activate parent failed', error);
      } finally {
        setActionLoadingIds(prev => prev.filter(i => i !== id));
      }
    })();
  };

  // Create a user from the probable/pending parent list (calls make_user)
  const makeParentFromProbable = (user) => {
    (async () => {
      const id = user.id;
      try {
        setActionLoadingIds(prev => [...prev, id]);
        await axiosInstance.post(`${appConfig.API_PREFIX_V1}/mapping/user-mapping/make_user`, {
          tenant_user_id: id,
          user_type: 'PARENT',
        });

        setParentPending(prev => prev.filter(u => u.id !== id));
        const activeObj = {
          id: id,
          name: user.name,
          username: user.username,
          child: user.child || (user.raw && Array.isArray(user.raw.associations) ? user.raw.associations.map(a => a.student_name).join(', ') : ''),
          raw: user.raw || null,
        };
        setParentActive(prev => [activeObj, ...prev]);
        window.dispatchEvent(new CustomEvent('global-alert', { detail: { message: 'Parent user created successfully', severity: 'success' } }));
      } catch (error) {
        console.error('Create parent user failed', error);
      } finally {
        setActionLoadingIds(prev => prev.filter(i => i !== id));
      }
    })();
  };

  const makeParentEnable = (user) => {
    // Call backend to enable a disabled parent user (POST /mapping/user-mapping/enable/{id}/PARENT)
    (async () => {
      const id = user.id;
      try {
        setActionLoadingIds(prev => [...prev, id]);
        await axiosInstance.post(`${appConfig.API_PREFIX_V1}/mapping/user-mapping/enable/${id}/PARENT`);
        // remove from disabled list
        setDisabledParents(prev => prev.filter(u => u.id !== id));
        const activeObj = {
          id: id,
          name: user.name,
          username: user.username,
          child: user.child || (user.raw && Array.isArray(user.raw.associations) ? user.raw.associations.map(a => a.student_name).join(', ') : ''),
          raw: user.raw || null,
        };
        setParentActive(prev => [activeObj, ...prev]);
        window.dispatchEvent(new CustomEvent('global-alert', { detail: { message: 'Parent enabled successfully', severity: 'success' } }));
      } catch (error) {
        console.error('Enable parent failed', error);
      } finally {
        setActionLoadingIds(prev => prev.filter(i => i !== id));
      }
    })();
  };

  const activateSelectedParents = () => {
    const toActivate = parentPending.filter(r => selectedPendingParents.includes(r.id));
    toActivate.forEach(u => makeParentFromProbable(u));
    setSelectedPendingParents([]);
  };

  // Tabs state
  const [tabIndex, setTabIndex] = React.useState(0);
  const handleTabChange = (e, newIndex) => setTabIndex(newIndex);

  function a11yProps(index) {
    return {
      id: `user-mapping-tab-${index}`,
      'aria-controls': `user-mapping-tabpanel-${index}`,
    };
  }

  // Fetch active users (staff + parents)
  useEffect(() => {
    const fetchActiveUsers = async () => {
      try {
        setLoadingActiveUsers(true);
        const res = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/mapping/user-mapping/active-user`);
        const activeStaff = Array.isArray(res.data.active_staff) ? res.data.active_staff.map(item => ({
          id: item.id,
          name: item.name,
          username: item.email || item.phone_number || item.id,
          role: item.staff_type || 'UNKNOWN',
          raw: item,
        })) : [];

        const activeParents = Array.isArray(res.data.active_parents) ? res.data.active_parents.map(item => ({
          id: item.parent_id || item.id,
          name: item.name,
          username: item.email || item.phone_number || item.parent_id || item.id,
          child: Array.isArray(item.associations) && item.associations.length > 0 ? item.associations.map(a => a.student_name).join(', ') : '',
          raw: item,
        })) : [];

        setStaffActive(activeStaff);
        setParentActive(activeParents);
      } catch (error) {
        console.error('Failed to fetch active users', error);
      } finally {
        setLoadingActiveUsers(false);
      }
    };

    fetchActiveUsers();
    // also fetch disabled users
    const fetchDisabledUsers = async () => {
      try {
        setLoadingDisabled(true);
        const res = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/mapping/user-mapping/disabled-user`);
        const dStaff = Array.isArray(res.data.disabled_staff) ? res.data.disabled_staff.map(item => ({
          id: item.id,
          name: item.name,
          username: item.email || item.phone_number || item.id,
          role: item.staff_type || 'UNKNOWN',
          raw: item,
        })) : [];
        const dParents = Array.isArray(res.data.disabled_parents) ? res.data.disabled_parents.map(item => ({
          id: item.parent_id || item.id,
          name: item.name,
          username: item.email || item.phone_number || item.parent_id || item.id,
          child: Array.isArray(item.associations) && item.associations.length > 0 ? item.associations.map(a => a.student_name).join(', ') : '',
          raw: item,
        })) : [];
        setDisabledStaff(dStaff);
        setDisabledParents(dParents);
      } catch (error) {
        console.error('Failed to fetch disabled users', error);
      } finally {
        setLoadingDisabled(false);
      }
    };

    fetchDisabledUsers();
  }, []);

  return (
    <Container sx={{ mt: 10, mb: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
        User Mapping (Administrative)
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Tabs value={tabIndex} onChange={handleTabChange} aria-label="User mapping tabs">
          <Tab label={`Staff (${staffActive.length + staffPending.length + staffFormPending.length + disabledStaff.length})`} {...a11yProps(0)} />
          <Tab label={`Parents (${parentActive.length + parentPending.length + parentFormPending.length + disabledParents.length})`} {...a11yProps(1)} />
        </Tabs>

        <Box role="tabpanel" hidden={tabIndex !== 0} id={`user-mapping-tabpanel-0`} aria-labelledby={`user-mapping-tab-0`} sx={{ pt: 2 }}>
          <Tabs value={staffStatusIndex} onChange={(e, v) => setStaffStatusIndex(v)} aria-label="staff status tabs" sx={{ mb: 2 }}>
            <Tab label={`Active (${staffActive.length})`} />
            <Tab label={`Pending (${staffPending.length})`} />
            <Tab label={`Form Admin Pending (${staffFormPending.length})`} />
            <Tab label={`Disabled (${disabledStaff.length})`} />
          </Tabs>

          {/* Active */}
          <Box role="tabpanel" hidden={staffStatusIndex !== 0} sx={{ pt: 1 }}>
            <DataGrid
              autoHeight
              rows={staffActive}
              columns={[
                { field: 'name', headerName: 'Name', flex: 1, minWidth: 160 },
                { field: 'username', headerName: 'Username', width: 180 },
                { field: 'role', headerName: 'User Type', width: 140 },
                { field: 'actions', headerName: 'Action', width: 160, sortable: false, filterable: false,
                  renderCell: (params) => (
                    <Button size="small" color="error" variant="contained" onClick={() => makeStaffDisabled(params.row)} disabled={actionLoadingIds.includes(params.row.id)}>Make Disabled</Button>
                  )
                }
              ]}
              pageSize={5}
              rowsPerPageOptions={[5, 10, 25]}
              disableSelectionOnClick
              density="compact"
              getRowId={(row) => row.id}
            />
          </Box>

          {/* Pending */}
          <Box role="tabpanel" hidden={staffStatusIndex !== 1} sx={{ pt: 1 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
              <input
                placeholder="Search pending staff..."
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', minWidth: 220 }}
              />
              <Button size="small" variant="contained" onClick={activateSelectedStaff} disabled={selectedPendingStaff.length === 0}>Activate Selected ({selectedPendingStaff.length})</Button>
            </Box>
            <div style={{ height: 520, width: '100%' }}>
              <DataGrid
                rows={staffPending.filter(r => {
                  if (!staffFilter) return true;
                  const q = staffFilter.toLowerCase();
                  return (`${r.name} ${r.username} ${r.role}`).toLowerCase().includes(q);
                })}
                columns={[
                  { field: 'name', headerName: 'Name', flex: 1, minWidth: 160 },
                  { field: 'username', headerName: 'Username', width: 200 },
                  { field: 'role', headerName: 'User Type', width: 140 },
                  { field: 'actions', headerName: 'Action', width: 260, sortable: false, filterable: false,
                    renderCell: (params) => (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" color="primary" variant="contained" onClick={() => makeStaffFromProbable(params.row)} disabled={actionLoadingIds.includes(params.row.id)}>Make Active</Button>
                      </Box>
                    )
                  }
                ]}
                checkboxSelection
                onSelectionModelChange={(sel) => setSelectedPendingStaff(sel)}
                selectionModel={selectedPendingStaff}
                pageSize={staffPageSize}
                onPageSizeChange={(newSize) => setStaffPageSize(newSize)}
                rowsPerPageOptions={[10, 25, 50, 100]}
                pagination
                loading={loadingPendingStaff}
                getRowId={(row) => row.id}
                density="standard"
              />
            </div>
          </Box>

          {/* Form Admin Pending */}
          <Box role="tabpanel" hidden={staffStatusIndex !== 2} sx={{ pt: 1 }}>
            <div style={{ height: 520, width: '100%' }}>
              <DataGrid
                rows={staffFormPending}
                columns={[
                  { field: 'name', headerName: 'Name', flex: 1, minWidth: 160 },
                  { field: 'username', headerName: 'Username', width: 200 },
                  { field: 'role', headerName: 'User Type', width: 140 }
                ]}
                pageSize={25}
                rowsPerPageOptions={[10, 25, 50]}
                disableSelectionOnClick
                getRowId={(row) => row.id}
                density="standard"
              />
            </div>
          </Box>

          {/* Disabled */}
          <Box role="tabpanel" hidden={staffStatusIndex !== 3} sx={{ pt: 1 }}>
            <DataGrid
              autoHeight
              rows={disabledStaff}
              columns={[
                { field: 'name', headerName: 'Name', flex: 1, minWidth: 160 },
                { field: 'username', headerName: 'Username', width: 200 },
                { field: 'role', headerName: 'User Type', width: 140 },
                { field: 'actions', headerName: 'Action', width: 160, sortable: false, filterable: false,
                  renderCell: (params) => (
                    <Button size="small" color="primary" variant="contained" onClick={() => makeStaffActive(params.row)} disabled={actionLoadingIds.includes(params.row.id)}>Make Active</Button>
                  )
                }
              ]}
              pageSize={5}
              rowsPerPageOptions={[5, 10, 25]}
              disableSelectionOnClick
              density="compact"
              getRowId={(row) => row.id}
            />
          </Box>
        </Box>

        <Box role="tabpanel" hidden={tabIndex !== 1} id={`user-mapping-tabpanel-1`} aria-labelledby={`user-mapping-tab-1`} sx={{ pt: 2 }}>
          <Tabs value={parentStatusIndex} onChange={(e, v) => setParentStatusIndex(v)} aria-label="parent status tabs" sx={{ mb: 2 }}>
            <Tab label={`Active (${parentActive.length})`} />
            <Tab label={`Pending (${parentPending.length})`} />
            <Tab label={`Form Admin Pending (${parentFormPending.length})`} />
            <Tab label={`Disabled (${disabledParents.length})`} />
          </Tabs>

          {/* Active */}
          <Box role="tabpanel" hidden={parentStatusIndex !== 0} sx={{ pt: 1 }}>
            <DataGrid
              autoHeight
              rows={parentActive}
              columns={[
                { field: 'name', headerName: 'Name', flex: 1, minWidth: 160 },
                { field: 'username', headerName: 'Username', width: 200 },
                { field: 'child', headerName: 'Child(ren)', flex: 1, minWidth: 160 },
                { field: 'actions', headerName: 'Action', width: 160, sortable: false, filterable: false,
                  renderCell: (params) => (
                    <Button size="small" color="error" variant="contained" onClick={() => makeParentDisabled(params.row)} disabled={actionLoadingIds.includes(params.row.id)}>Make Disabled</Button>
                  )
                }
              ]}
              pageSize={5}
              rowsPerPageOptions={[5, 10, 25]}
              disableSelectionOnClick
              density="compact"
              getRowId={(row) => row.id}
            />
          </Box>

          {/* Pending */}
          <Box role="tabpanel" hidden={parentStatusIndex !== 1} sx={{ pt: 1 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
              <input
                placeholder="Search pending parents..."
                value={parentFilter}
                onChange={(e) => setParentFilter(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', minWidth: 220 }}
              />
              <Button size="small" variant="contained" onClick={activateSelectedParents} disabled={selectedPendingParents.length === 0}>Activate Selected ({selectedPendingParents.length})</Button>
            </Box>
            <div style={{ height: 520, width: '100%' }}>
              <DataGrid
                rows={parentPending.filter(r => {
                  if (!parentFilter) return true;
                  const q = parentFilter.toLowerCase();
                  return (`${r.name} ${r.username} ${r.child}`).toLowerCase().includes(q);
                })}
                columns={[
                  { field: 'name', headerName: 'Name', flex: 1, minWidth: 160 },
                  { field: 'username', headerName: 'Username', width: 200 },
                  { field: 'child', headerName: 'Child(ren)', flex: 1, minWidth: 160 },
                  { field: 'actions', headerName: 'Action', width: 260, sortable: false, filterable: false,
                    renderCell: (params) => (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" color="primary" variant="contained" onClick={() => makeParentFromProbable(params.row)} disabled={actionLoadingIds.includes(params.row.id)}>Make Active</Button>
                    
                      </Box>
                    )
                  }
                ]}
                checkboxSelection
                onSelectionModelChange={(sel) => setSelectedPendingParents(sel)}
                selectionModel={selectedPendingParents}
                pageSize={parentPageSize}
                onPageSizeChange={(newSize) => setParentPageSize(newSize)}
                rowsPerPageOptions={[10, 25, 50, 100]}
                pagination
                loading={loadingPendingParents}
                getRowId={(row) => row.id}
                density="standard"
              />
            </div>
          </Box>

          {/* Form Admin Pending */}
          <Box role="tabpanel" hidden={parentStatusIndex !== 2} sx={{ pt: 1 }}>
            <div style={{ height: 520, width: '100%' }}>
              <DataGrid
                rows={parentFormPending}
                columns={[
                  { field: 'name', headerName: 'Name', flex: 1, minWidth: 160 },
                  { field: 'username', headerName: 'Username', width: 200 },
                  { field: 'child', headerName: 'Child(ren)', flex: 1, minWidth: 160 },
                  { field: 'actions', headerName: 'Action', width: 260, sortable: false, filterable: false,
                    renderCell: (params) => (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" color="primary" variant="contained" onClick={() => makeParentActive(params.row)} disabled={actionLoadingIds.includes(params.row.id)}>Make Active</Button>
                      </Box>
                    )
                  }
                ]}
                pageSize={25}
                rowsPerPageOptions={[10, 25, 50]}
                disableSelectionOnClick
                getRowId={(row) => row.id}
                density="standard"
              />
            </div>
          </Box>

          {/* Disabled */}
          <Box role="tabpanel" hidden={parentStatusIndex !== 3} sx={{ pt: 1 }}>
            <DataGrid
              rows={disabledParents}
              columns={[
                { field: 'name', headerName: 'Name', flex: 1, minWidth: 160 },
                { field: 'username', headerName: 'Username', width: 200 },
                { field: 'child', headerName: 'Child(ren)', flex: 1, minWidth: 160 },
                { field: 'actions', headerName: 'Action', width: 140, sortable: false, filterable: false,
                  renderCell: (params) => (
                    <Button size="small" color="primary" variant="contained" onClick={() => makeParentActive(params.row)} disabled={actionLoadingIds.includes(params.row.id)}>Make Active</Button>
                  )
                }
              ]}
              checkboxSelection={false}
              pageSize={parentPageSize}
              onPageSizeChange={(newSize) => setParentPageSize(newSize)}
              rowsPerPageOptions={[10, 25, 50]}
              pagination
              loading={loadingDisabled}
              getRowId={(row) => row.id}
              density="standard"
            />
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default UserMapping;
