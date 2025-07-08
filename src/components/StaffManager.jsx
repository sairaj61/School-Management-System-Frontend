// src/components/StaffManager.jsx
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Container, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Tooltip, Select, FormControl, InputLabel,
  Tabs, Tab
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import axiosInstance from '../utils/axiosConfig';
import appConfig from '../config/appConfig';

import StaffSalariesTable from './StaffSalariesTable';

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
  phone_number: Yup.string().max(20, 'Phone number too long').nullable(),
  address: Yup.string().max(255, 'Address too long').nullable(),
  qualification: Yup.string().max(255, 'Qualification too long').nullable(),
  actual_salary: Yup.number().positive('Salary must be positive').required('Actual salary is required'),
  // Conditionally require licence field based on staff_type
  licence_number: Yup.string().when('staff_type', {
    is: StaffTypeEnum.DRIVER,
    then: (schema) => schema.required('Licence is required for drivers').max(50, 'Licence too long'),
    otherwise: (schema) => schema.nullable(),
  }),
});

const StaffManager = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  const [currentTab, setCurrentTab] = useState('staffList');
  const [selectedStaffForSalaries, setSelectedStaffForSalaries] = useState(null);

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

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    if (newValue === 'staffList') {
      setSelectedStaffForSalaries(null); // Clear selected staff when going back to list
      fetchStaff(); // Re-fetch staff list if needed
    }
  };

  const handleViewSalaries = (staff) => {
    setSelectedStaffForSalaries(staff);
    setCurrentTab('salaries');
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
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange} aria-label="staff management tabs">
          <Tab label="Staff List" value="staffList" />
          <Tab label="Staff Salaries" value="salaries" />
        </Tabs>
      </Box>

      {currentTab === 'staffList' && (
        <Box>
          <Box sx={{ my: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Staff List
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add Staff
            </Button>
          </Box>

          <Paper elevation={3} sx={{ width: '100%', overflowX: 'auto' }}>
            <TableContainer sx={{ minWidth: 1100, width: '100%' }}>
              <Table stickyHeader aria-label="staff table" sx={{ tableLayout: 'auto', width: '100%' }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Qualification</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Licence</TableCell>
                    <TableCell align="right">Salary</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {staffList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center"> {/* Updated colspan */}
                        No staff members found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    staffList.map((staff) => (
                      <TableRow key={staff.id}>
                        <TableCell>{staff.name}</TableCell>
                        <TableCell>{staff.staff_type}</TableCell>
                        <TableCell>{staff.email}</TableCell>
                        <TableCell>{staff.phone_number || 'N/A'}</TableCell>
                        <TableCell>{staff.qualification || 'N/A'}</TableCell>
                         <TableCell>{staff.status}</TableCell>
                         <TableCell>{staff.licence_number || 'N/A'}</TableCell> {/* Display licence */}
                        <TableCell align="right">${staff.actual_salary ? parseFloat(staff.actual_salary).toFixed(2) : '0.00'}</TableCell>
                        <TableCell align="center">
                          <Tooltip title="Edit">
                            <IconButton color="primary" onClick={() => handleOpenDialog(staff)}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Salaries">
                            <IconButton color="info" onClick={() => handleViewSalaries(staff)}>
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton color="secondary" onClick={() => handleDelete(staff.id)}>
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}

      {currentTab === 'salaries' && (
        <Box>
          {selectedStaffForSalaries ? (
            <StaffSalariesTable staff={selectedStaffForSalaries} onBack={() => setCurrentTab('staffList')} />
          ) : (
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                Please select a staff member from the "Staff List" tab to view their salaries.
              </Typography>
              <Button
                variant="outlined"
                sx={{ mt: 2 }}
                onClick={() => setCurrentTab('staffList')}
              >
                Go to Staff List
              </Button>
            </Box>
          )}
        </Box>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle>
        <Formik
          initialValues={editingStaff ? {
            ...editingStaff,
            actual_salary: editingStaff.actual_salary ? parseFloat(editingStaff.actual_salary) : '',
            licence: editingStaff.licence || '', // Initialize licence field
          } : {
            name: '',
            staff_type: StaffTypeEnum.TEACHING,
            email: '',
            phone_number: '',
            address: '',
            qualification: '',
            actual_salary: '',
            licence_number: '', // Initialize licence field
          }}
          validationSchema={StaffSchema}
          onSubmit={handleSubmit}
          enableReinitialize={true}
        >
          {({ errors, touched, isSubmitting, values }) => ( // Added 'values' to destructuring
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
                <Field
                  as={TextField}
                  name="actual_salary"
                  label="Actual Salary"
                  type="number"
                  fullWidth
                  margin="normal"
                  error={touched.actual_salary && !!errors.actual_salary}
                  helperText={touched.actual_salary && errors.actual_salary}
                />
                {/* Conditionally render licence field */}
                {values.staff_type === StaffTypeEnum.DRIVER && (
                  <Field
                    as={TextField}
                    name="licence_number" // Changed from licence to licence_number
                    label="Licence Number" // You might want to update the label as well for clarity
                    fullWidth
                    margin="normal"
                    error={touched.licence_number && !!errors.licence_number} // Changed from licence to licence_number
                    helperText={touched.licence_number && errors.licence_number} // Changed from licence to licence_number
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