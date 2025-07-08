import React, { useEffect, useState } from 'react';
import { Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, CircularProgress, Drawer, Box, Button } from '@mui/material';
import axiosInstance from '../utils/axiosConfig';
import appConfig from '../config/appConfig';

const TenantManagement = () => {
  const [tenants, setTenants] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [loading, setLoading] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [tenantDetail, setTenantDetail] = useState(null);

  const fetchTenants = async (page, rowsPerPage) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/auth/tenants/?skip=${page * rowsPerPage}&limit=${rowsPerPage}`);
      setTenants(res.data);
    } catch (err) {
      setTenants([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTenantDetail = async (id) => {
    try {
      const res = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/auth/tenants/${id}`);
      setTenantDetail(res.data);
    } catch (err) {
      setTenantDetail(null);
    }
  };

  useEffect(() => {
    fetchTenants(page, rowsPerPage);
  }, [page, rowsPerPage]);

  useEffect(() => {
    if (selectedTenant) fetchTenantDetail(selectedTenant.id);
    else setTenantDetail(null);
  }, [selectedTenant]);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Tenant Management</Typography>
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Address</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={3}><CircularProgress /></TableCell></TableRow>
              ) : tenants.map(tenant => (
                <TableRow key={tenant.id} hover onClick={() => setSelectedTenant(tenant)} style={{ cursor: 'pointer' }}>
                  <TableCell>{tenant.name}</TableCell>
                  <TableCell>{tenant.email_id}</TableCell>
                  <TableCell>{tenant.address}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={-1}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          labelDisplayedRows={({ from, to }) => `${from}-${to}`}
          nextIconButtonProps={{ disabled: tenants.length < rowsPerPage }}
        />
      </Paper>
      <Drawer anchor="right" open={!!selectedTenant} onClose={() => setSelectedTenant(null)}>
        <Box sx={{ width: 350, p: 3 }}>
          {tenantDetail ? (
            <>
              <Typography variant="h6">{tenantDetail.name}</Typography>
              <Typography>Email: {tenantDetail.email_id}</Typography>
              <Typography>Address: {tenantDetail.address}</Typography>
              <Button sx={{ mt: 2 }} variant="contained" onClick={() => setSelectedTenant(null)}>Close</Button>
            </>
          ) : (
            <Typography>Loading...</Typography>
          )}
        </Box>
      </Drawer>
    </Box>
  );
};

export default TenantManagement;
