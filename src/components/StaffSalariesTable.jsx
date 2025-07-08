// src/components/StaffSalariesTable.jsx
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Container, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Tooltip, Select, FormControl, InputLabel
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material'; // Added ArrowBackIcon
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import axiosInstance from '../utils/axiosConfig';

// Enum values for SalaryMonth (from your backend)
const SalaryMonthEnum = {
    JANUARY: "JANUARY",
    FEBRUARY: "FEBRUARY",
    MARCH: "MARCH",
    APRIL: "APRIL",
    MAY: "MAY",
    JUNE: "JUNE",
    JULY: "JULY",
    AUGUST: "AUGUST",
    SEPTEMBER: "SEPTEMBER",
    OCTOBER: "OCTOBER",
    NOVEMBER: "NOVEMBER",
    DECEMBER: "DECEMBER",
};

const PaySalarySchema = Yup.object().shape({
  academic_year_id: Yup.string().required('Academic Year is required'),
  base_salary_amount: Yup.number().positive('Amount must be positive').required('Amount is required'),
  salary_month: Yup.string().oneOf(Object.values(SalaryMonthEnum)).required('Month is required'),
  description: Yup.string().max(255, 'Description too long').nullable(),
  // school_expenditure_id is optional and can be managed backend side if auto-linking
});

const StaffSalariesTable = ({ staff, onBack }) => {
  const [salaries, setSalaries] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openPayDialog, setOpenPayDialog] = useState(false);

  const fetchDependencies = async () => {
    try {
      const academicYearsRes =   axiosInstance.get(`${appConfig.API_PREFIX_V1}/timetable/academic-years/`); // Assuming you have an endpoint for ALL academic years
      // If '/academic-years/all' doesn't exist, you'll need to fetch active and handle it.
      // For now, assuming it returns an array of academic year objects.
      setAcademicYears(academicYearsRes.data);
    } catch (error) {
      toast.error('Failed to load academic years.');
      console.error('Error fetching academic years:', error);
    }
  };

  const fetchSalaries = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/staff/${staff.id}/salaries/`);
      setSalaries(response.data);
      toast.success(`Salaries for ${staff.name} loaded successfully!`);
    } catch (error) {
      toast.error(`Failed to load salaries for ${staff.name}.`);
      console.error('Error fetching salaries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
    if (staff && staff.id) {
      fetchSalaries();
    }
  }, [staff]); // Re-fetch when staff prop changes

  const handleOpenPayDialog = () => {
    setOpenPayDialog(true);
  };

  const handleClosePayDialog = () => {
    setOpenPayDialog(false);
  };

  const handlePaySalary = async (values, { setSubmitting, resetForm }) => {
    try {
      const payload = {
        ...values,
        staff_id: staff.id, // Ensure staff_id is included
        base_salary_amount: parseFloat(values.base_salary_amount), // Ensure number type
      };
      await axiosInstance.post('/staff/salaries/', payload);
      toast.success('Salary paid successfully!');
      handleClosePayDialog();
      fetchSalaries(); // Refresh salaries list
      resetForm();
    } catch (error) {
      toast.error('Failed to pay salary.');
      console.error('Pay Salary error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSalary = async (salaryId) => {
    if (window.confirm('Are you sure you want to delete this salary entry?')) {
      try {
        await axiosInstance.delete(`/staff/salaries/${salaryId}`);
        toast.success('Salary entry deleted successfully!');
        fetchSalaries();
      } catch (error) {
        toast.error('Failed to delete salary entry.');
        console.error('Delete salary error:', error);
      }
    }
  };

  const getAcademicYearName = (academicYearId) => {
    const year = academicYears.find(ay => ay.id === academicYearId);
    return year ? (year.year_name || year.start_date.substring(0,4)) : 'N/A';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ my: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h2" gutterBottom>
          <IconButton onClick={onBack} color="primary" sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          Salaries for {staff.name}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenPayDialog}
        >
          Pay Salary
        </Button>
      </Box>

      <Paper elevation={3} sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader aria-label="staff salaries table">
            <TableHead>
              <TableRow>
                <TableCell>Amount</TableCell>
                <TableCell>Month</TableCell>
                <TableCell>Academic Year</TableCell>
                <TableCell>Payment Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {salaries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No salary entries found for this staff member.
                  </TableCell>
                </TableRow>
              ) : (
                salaries.map((salary) => (
                  <TableRow key={salary.id}>
                    <TableCell>${parseFloat(salary.base_salary_amount).toFixed(2)}</TableCell>
                    <TableCell>{salary.salary_month}</TableCell>
                    <TableCell>{getAcademicYearName(salary.academic_year_id)}</TableCell>
                    <TableCell>{new Date(salary.payment_date).toLocaleDateString()}</TableCell>
                    <TableCell>{salary.description || 'N/A'}</TableCell>
                    <TableCell align="center">
                      {/* Delete is usually the main action for individual payments */}
                      <Tooltip title="Delete">
                        <IconButton color="secondary" onClick={() => handleDeleteSalary(salary.id)}>
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

      <Dialog open={openPayDialog} onClose={handleClosePayDialog} fullWidth maxWidth="sm">
        <DialogTitle>Pay Salary for {staff.name}</DialogTitle>
        <Formik
          initialValues={{
            academic_year_id: '',
            base_salary_amount: staff.actual_salary || '', // Pre-fill with actual_salary if available
            salary_month: '',
            description: '',
            // school_expenditure_id: '' // Not required in UI for now
          }}
          validationSchema={PaySalarySchema}
          onSubmit={handlePaySalary}
          enableReinitialize={true} // Reinitialize if staff prop changes
        >
          {({ errors, touched, isSubmitting }) => (
            <Form>
              <DialogContent dividers>
                <FormControl fullWidth margin="normal" error={touched.academic_year_id && !!errors.academic_year_id}>
                  <InputLabel id="academic-year-label">Academic Year</InputLabel>
                  <Field
                    as={Select}
                    labelId="academic-year-label"
                    name="academic_year_id"
                    label="Academic Year"
                  >
                    {academicYears.map((ay) => (
                      <MenuItem key={ay.id} value={ay.id}>
                        {ay.year_name || ay.start_date.substring(0,4)}
                      </MenuItem>
                    ))}
                  </Field>
                  {touched.academic_year_id && errors.academic_year_id && (
                    <Typography color="error" variant="caption">{errors.academic_year_id}</Typography>
                  )}
                </FormControl>
                <Field
                  as={TextField}
                  name="base_salary_amount"
                  label="Amount Paid"
                  type="number"
                  fullWidth
                  margin="normal"
                  error={touched.base_salary_amount && !!errors.base_salary_amount}
                  helperText={touched.base_salary_amount && errors.base_salary_amount}
                />
                <FormControl fullWidth margin="normal" error={touched.salary_month && !!errors.salary_month}>
                  <InputLabel id="salary-month-label">Salary Month</InputLabel>
                  <Field
                    as={Select}
                    labelId="salary-month-label"
                    name="salary_month"
                    label="Salary Month"
                  >
                    {Object.values(SalaryMonthEnum).map((month) => (
                      <MenuItem key={month} value={month}>
                        {month.charAt(0).toUpperCase() + month.slice(1).toLowerCase()}
                      </MenuItem>
                    ))}
                  </Field>
                  {touched.salary_month && errors.salary_month && (
                    <Typography color="error" variant="caption">{errors.salary_month}</Typography>
                  )}
                </FormControl>
                <Field
                  as={TextField}
                  name="description"
                  label="Description"
                  fullWidth
                  margin="normal"
                  multiline
                  rows={2}
                  error={touched.description && !!errors.description}
                  helperText={touched.description && errors.description}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={handleClosePayDialog} color="secondary">
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={isSubmitting}>
                  {isSubmitting ? <CircularProgress size={24} /> : 'Pay Salary'}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </Box>
  );
};

export default StaffSalariesTable;