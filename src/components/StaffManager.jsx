// src/components/StaffManager.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Container, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Tooltip, Select, FormControl, InputLabel
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon, GetApp as ExportIcon, Publish as ImportIcon } from '@mui/icons-material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import axiosInstance from '../utils/axiosConfig';
import appConfig from '../config/appConfig';

const StaffTypeEnum = {
  TEACHING : "TEACHING",
  NON_TEACHING : "NON_TEACHING",
  ADMIN : "ADMIN",
  DRIVER : "DRIVER",
  OTHER : "OTHER",
};

const StaffSchema = Yup.object().shape({
  name: Yup.string().required('Name is required').max(255, 'Name too long'),
  staff_type: Yup.string().oneOf(Object.values(StaffTypeEnum)).required('Staff type is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  phone_number: Yup.string().max(20, 'Phone number too long').matches(/^(?:\d{10}|\+91\d{10})$/, 'Phone number must be 10 digits or +91 followed by 10 digits').nullable(),
  address: Yup.string().max(255, 'Address too long').nullable(),
  qualification: Yup.string().max(255, 'Qualification too long').nullable(),
  license_number: Yup.string().when('staff_type', {
    is: StaffTypeEnum.DRIVER,
    then: () => Yup.string().required('License number is required').max(50, 'License number too long'),
    otherwise: () => Yup.string().nullable(),
  }),
});

const StaffManager = () => {
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/staff/`);
      setStaffList(response.data);
    } catch (error) {
      toast.error('Failed to load staff.');
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredStaff(staffList);
    } else {
      setFilteredStaff(
        staffList.filter(
          staff =>
            staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            staff.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [searchTerm, staffList]);

  const handleOpenDialog = (staff = null) => {
    setEditingStaff(staff);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingStaff(null);
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      if (editingStaff) {
        await axiosInstance.put(`${appConfig.API_PREFIX_V1}/staff/${editingStaff.id}`, values);
        toast.success('Staff updated successfully!');
      } else {
        await axiosInstance.post(`${appConfig.API_PREFIX_V1}/staff/`, values);
        toast.success('Staff added successfully!');
      }
      handleCloseDialog();
      fetchStaff();
      resetForm();
    } catch (error) {
      toast.error(`Failed to ${editingStaff ? 'update' : 'add'} staff.`);
      console.error('Staff submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (staffId) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        await axiosInstance.delete(`${appConfig.API_PREFIX_V1}/staff/${staffId}`);
        toast.success('Staff deleted successfully!');
        fetchStaff();
      } catch (error) {
        toast.error('Failed to delete staff.');
        console.error('Staff delete error:', error);
      }
    }
  };

  const handleExportStaff = async () => {
    try {
      setExporting(true);
      const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/staff/export/csv`, {
        responseType: 'blob' // Important for file download
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'staff_export.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Staff data exported successfully!');
    } catch (error) {
      toast.error('Failed to export staff data.');
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleImportStaff = async (file) => {
    if (!file) return;

    try {
      setImporting(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await axiosInstance.post(`${appConfig.API_PREFIX_V1}/staff/import/csv`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Staff data imported successfully!');
      fetchStaff(); // Refresh the staff list
    } catch (error) {
      toast.error('Failed to import staff data. Please check the file format.');
      console.error('Import error:', error);
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ my: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Staff List
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            size="small"
            variant="outlined"
            placeholder="Search by name or email"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            sx={{ minWidth: 220 }}
          />
          <Button
            variant="contained"
            onClick={() => setSearchTerm(searchTerm)}
          >
            Search
          </Button>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExportStaff}
            disabled={exporting}
            sx={{ minWidth: 120 }}
          >
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<ImportIcon />}
            component="label"
            disabled={importing}
            sx={{ minWidth: 120 }}
          >
            {importing ? 'Importing...' : 'Import CSV'}
            <input
              type="file"
              hidden
              accept=".csv"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  handleImportStaff(file);
                }
                // Reset input
                e.target.value = '';
              }}
            />
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Staff
          </Button>
        </Box>
      </Box>

      <Paper elevation={3} sx={{ width: '100%', overflowX: 'auto' }}>
        <TableContainer sx={{ minWidth: 1100, width: '100%' }}>
          <Table stickyHeader aria-label="staff table" sx={{ tableLayout: 'auto', width: '100%' }}>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Staff Type</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Qualification</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No staff members found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStaff.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell>{staff.name}</TableCell>
                    <TableCell>{staff.staff_type}</TableCell>
                    <TableCell>{staff.email}</TableCell>
                    <TableCell>{staff.phone_number || 'N/A'}</TableCell>
                    <TableCell>{staff.address || 'N/A'}</TableCell>
                    <TableCell>{staff.qualification || 'N/A'}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <Tooltip title="Edit">
                          <IconButton color="primary" onClick={() => handleOpenDialog(staff)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View Details">
                          <IconButton color="success" onClick={() => navigate(`/staff/${staff.id}`)}>
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton color="secondary" onClick={() => handleDelete(staff.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle>
        <Formik
          initialValues={editingStaff ? {
            name: editingStaff.name || '',
            staff_type: editingStaff.staff_type || StaffTypeEnum.TEACHING,
            email: editingStaff.email || '',
            phone_number: editingStaff.phone_number || '',
            address: editingStaff.address || '',
            qualification: editingStaff.qualification || '',
            license_number: editingStaff.license_number || '',
          } : {
            name: '',
            staff_type: StaffTypeEnum.TEACHING,
            email: '',
            phone_number: '',
            address: '',
            qualification: '',
            license_number: '',
          }}
          validationSchema={StaffSchema}
          onSubmit={handleSubmit}
          enableReinitialize={true}
        >
          {({ errors, touched, isSubmitting, values }) => (
            <Form>
              <DialogContent dividers>
                <Field
                  as={TextField}
                  name="name"
                  label="Name"
                  fullWidth
                  margin="normal"
                  error={touched.name && !!errors.name}
                  helperText={touched.name && errors.name}
                />
                <FormControl fullWidth margin="normal" error={touched.staff_type && !!errors.staff_type}>
                  <InputLabel id="staff-type-label">Staff Type</InputLabel>
                  <Field
                    as={Select}
                    labelId="staff-type-label"
                    name="staff_type"
                    label="Staff Type"
                  >
                    {Object.values(StaffTypeEnum).map((type) => (
                      <MenuItem key={type} value={type}>
                        {type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1).toLowerCase()}
                      </MenuItem>
                    ))}
                  </Field>
                  {touched.staff_type && errors.staff_type && (
                    <Typography color="error" variant="caption">{errors.staff_type}</Typography>
                  )}
                </FormControl>
                <Field
                  as={TextField}
                  name="email"
                  label="Email"
                  type="email"
                  fullWidth
                  margin="normal"
                  error={touched.email && !!errors.email}
                  helperText={touched.email && errors.email}
                />
                <Field
                  as={TextField}
                  name="phone_number"
                  label="Phone Number"
                  fullWidth
                  margin="normal"
                  error={touched.phone_number && !!errors.phone_number}
                  helperText={touched.phone_number && errors.phone_number}
                />
                <Field
                  as={TextField}
                  name="address"
                  label="Address"
                  fullWidth
                  margin="normal"
                  error={touched.address && !!errors.address}
                  helperText={touched.address && errors.address}
                />
                <Field
                  as={TextField}
                  name="qualification"
                  label="Qualification"
                  fullWidth
                  margin="normal"
                  error={touched.qualification && !!errors.qualification}
                  helperText={touched.qualification && errors.qualification}
                />
                {values.staff_type === StaffTypeEnum.DRIVER && (
                  <Field
                    as={TextField}
                    name="license_number"
                    label="License Number"
                    fullWidth
                    margin="normal"
                    error={touched.license_number && !!errors.license_number}
                    helperText={touched.license_number && errors.license_number}
                  />
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseDialog} color="secondary">
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={isSubmitting}>
                  {isSubmitting ? <CircularProgress size={24} /> : (editingStaff ? 'Update' : 'Add')}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </Container>
  );
};

export default StaffManager;