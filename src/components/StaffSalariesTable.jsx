// src/components/StaffSalariesTable.jsx
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Container, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Tooltip, Select, FormControl, InputLabel
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import axiosInstance from '../utils/axiosConfig';
import appConfig from '../config/appConfig';

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
  // CTC Structure
  const [ctcStructures, setCtcStructures] = useState([]);
  const [openCtcDialog, setOpenCtcDialog] = useState(false);
  const [ctcForm, setCtcForm] = useState({ total_ctc: '', effective_from: '', effective_to: '' });
  const [selectedCtcId, setSelectedCtcId] = useState(null);
  const [ctcComponents, setCtcComponents] = useState([]);
  const [openCtcComponentDialog, setOpenCtcComponentDialog] = useState(false);
  const [ctcComponentForm, setCtcComponentForm] = useState({ name: '', amount: '', component_type: 'Allowance' });

  const fetchDependencies = async () => {
    try {
  const academicYearsRes = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/timetable/academic-years/`);
      setAcademicYears(academicYearsRes.data);
    } catch (error) {
      toast.error('Failed to load academic years.');
      console.error('Error fetching academic years:', error);
    }
  };

  const fetchSalaries = async () => {
    try {
      setLoading(true);
  const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/administrative/staff/${staff.id}/salaries/`);
      setSalaries(response.data);
      toast.success(`Salaries for ${staff.name} loaded successfully!`);
    } catch (error) {
      toast.error(`Failed to load salaries for ${staff.name}.`);
      console.error('Error fetching salaries:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCtcStructures = async () => {
    try {
  const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/administrative/staff/${staff.id}/ctc-structures`);
      setCtcStructures(response.data);
    } catch (error) {
      toast.error('Failed to load CTC structures.');
      console.error('Error fetching CTC structures:', error);
    }
  };

  const fetchCtcComponents = async (ctcId) => {
    try {
  const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/administrative/staff/ctc-structure/${ctcId}/components`);
      setCtcComponents(response.data);
    } catch (error) {
      toast.error('Failed to load CTC components.');
      console.error('Error fetching CTC components:', error);
    }
  };

  useEffect(() => {
    fetchDependencies();
    if (staff && staff.id) {
      fetchSalaries();
      fetchCtcStructures();
    }
  }, [staff]);

  // Salary Payment Dialog
  const handleOpenPayDialog = () => setOpenPayDialog(true);
  const handleClosePayDialog = () => setOpenPayDialog(false);
  const handlePaySalary = async (values, { setSubmitting, resetForm }) => {
    try {
      const payload = {
        ...values,
        staff_id: staff.id,
        base_salary_amount: parseFloat(values.base_salary_amount),
      };
  await axiosInstance.post(`${appConfig.API_PREFIX_V1}/administrative/staff/salaries/`, payload);
      toast.success('Salary paid successfully!');
      handleClosePayDialog();
      fetchSalaries();
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
  await axiosInstance.delete(`${appConfig.API_PREFIX_V1}/administrative/staff/salaries/${salaryId}`);
        toast.success('Salary entry deleted successfully!');
        fetchSalaries();
      } catch (error) {
        toast.error('Failed to delete salary entry.');
        console.error('Delete salary error:', error);
      }
    }
  };

  // CTC Structure Dialog
  const handleOpenCtcDialog = () => setOpenCtcDialog(true);
  const handleCloseCtcDialog = () => setOpenCtcDialog(false);
  const handleCreateCtc = async () => {
    try {
      const payload = {
        staff_id: staff.id,
        total_ctc: parseFloat(ctcForm.total_ctc),
        effective_from: ctcForm.effective_from,
        effective_to: ctcForm.effective_to,
      };
  await axiosInstance.post(`${appConfig.API_PREFIX_V1}/administrative/staff/ctc-structure/`, payload);
      toast.success('CTC structure created!');
      handleCloseCtcDialog();
      fetchCtcStructures();
      setCtcForm({ total_ctc: '', effective_from: '', effective_to: '' });
    } catch (error) {
      toast.error('Failed to create CTC structure.');
      console.error('Create CTC error:', error);
    }
  };

  // CTC Component Dialog
  const handleOpenCtcComponentDialog = (ctcId) => {
    setSelectedCtcId(ctcId);
    setOpenCtcComponentDialog(true);
    fetchCtcComponents(ctcId);
  };
  const handleCloseCtcComponentDialog = () => {
    setOpenCtcComponentDialog(false);
    setCtcComponentForm({ name: '', amount: '', component_type: 'Allowance' });
  };
  const handleCreateCtcComponent = async () => {
    try {
      const payload = {
        name: ctcComponentForm.name,
        amount: parseFloat(ctcComponentForm.amount),
        component_type: ctcComponentForm.component_type,
      };
  await axiosInstance.post(`${appConfig.API_PREFIX_V1}/administrative/staff/ctc-structure/${selectedCtcId}/component`, payload);
      toast.success('CTC component added!');
      fetchCtcComponents(selectedCtcId);
      setCtcComponentForm({ name: '', amount: '', component_type: 'Allowance' });
    } catch (error) {
      toast.error('Failed to add CTC component.');
      console.error('Add CTC component error:', error);
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
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenPayDialog}>Pay Salary</Button>
          <Button variant="outlined" onClick={handleOpenCtcDialog}>Add CTC Structure</Button>
        </Box>
      </Box>

      {/* Salary Payment Records Table */}
      <Paper elevation={3} sx={{ mb: 4 }}>
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

      {/* CTC Structures Table with inline components */}
      <Paper elevation={3} sx={{ mb: 4 }}>
        <TableContainer>
          <Table stickyHeader aria-label="ctc structures table">
            <TableHead>
              <TableRow>
                <TableCell>Total CTC</TableCell>
                <TableCell>Effective From</TableCell>
                <TableCell>Effective To</TableCell>
                <TableCell>Components</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ctcStructures.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">No CTC structures found.</TableCell>
                </TableRow>
              ) : (
                ctcStructures.map((ctc) => (
                  <React.Fragment key={ctc.id}>
                    <TableRow>
                      <TableCell>${parseFloat(ctc.total_ctc).toFixed(2)}</TableCell>
                      <TableCell>{ctc.effective_from ? new Date(ctc.effective_from).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>{ctc.effective_to ? new Date(ctc.effective_to).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>
                        <Table size="small" sx={{ mb: 1 }}>
                          <TableHead>
                            <TableRow>
                              <TableCell>Name</TableCell>
                              <TableCell>Amount</TableCell>
                              <TableCell>Type</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {ctcComponents && selectedCtcId === ctc.id && ctcComponents.length > 0 ? (
                              ctcComponents.map((comp) => (
                                <TableRow key={comp.id}>
                                  <TableCell>{comp.name}</TableCell>
                                  <TableCell>${parseFloat(comp.amount).toFixed(2)}</TableCell>
                                  <TableCell>{comp.component_type}</TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={3} align="center">No components found.</TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                        <Button variant="contained" size="small" onClick={() => { setSelectedCtcId(ctc.id); setOpenCtcComponentDialog(true); fetchCtcComponents(ctc.id); }}>Add Component</Button>
                      </TableCell>
                      <TableCell align="center">
                        {/* ...existing actions if any... */}
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* CTC Component Breakdown Table & Dialog */}
      <Dialog open={openCtcComponentDialog} onClose={handleCloseCtcComponentDialog} fullWidth maxWidth="sm">
        <DialogTitle>CTC Components</DialogTitle>
        <DialogContent dividers>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Type</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ctcComponents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">No components found.</TableCell>
                  </TableRow>
                ) : (
                  ctcComponents.map((comp) => (
                    <TableRow key={comp.id}>
                      <TableCell>{comp.name}</TableCell>
                      <TableCell>${parseFloat(comp.amount).toFixed(2)}</TableCell>
                      <TableCell>{comp.component_type}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1">Add Component</Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
              <TextField
                label="Name"
                size="small"
                value={ctcComponentForm.name}
                onChange={e => setCtcComponentForm({ ...ctcComponentForm, name: e.target.value })}
              />
              <TextField
                label="Amount"
                size="small"
                type="number"
                value={ctcComponentForm.amount}
                onChange={e => setCtcComponentForm({ ...ctcComponentForm, amount: e.target.value })}
              />
              <FormControl size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={ctcComponentForm.component_type}
                  label="Type"
                  onChange={e => setCtcComponentForm({ ...ctcComponentForm, component_type: e.target.value })}
                >
                  <MenuItem value="Allowance">Allowance</MenuItem>
                  <MenuItem value="Deduction">Deduction</MenuItem>
                  <MenuItem value="Bonus">Bonus</MenuItem>
                  <MenuItem value="Reimbursement">Reimbursement</MenuItem>
                  <MenuItem value="Tax">Tax</MenuItem>
                  <MenuItem value="House Rent Allowance">House Rent Allowance</MenuItem>
                  <MenuItem value="Basic Salary">Basic Salary</MenuItem>
                  <MenuItem value="Medical Allowance">Medical Allowance</MenuItem>
                  <MenuItem value="Transport Allowance">Transport Allowance</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
              <Button variant="contained" size="small" onClick={handleCreateCtcComponent}>Add</Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCtcComponentDialog} color="secondary">Close</Button>
        </DialogActions>
      </Dialog>

      {/* CTC Structure Creation Dialog */}
      <Dialog open={openCtcDialog} onClose={handleCloseCtcDialog} fullWidth maxWidth="sm">
        <DialogTitle>Add CTC Structure</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Total CTC"
              type="number"
              value={ctcForm.total_ctc}
              onChange={e => setCtcForm({ ...ctcForm, total_ctc: e.target.value })}
            />
            <TextField
              label="Effective From"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={ctcForm.effective_from}
              onChange={e => setCtcForm({ ...ctcForm, effective_from: e.target.value })}
            />
            <TextField
              label="Effective To"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={ctcForm.effective_to}
              onChange={e => setCtcForm({ ...ctcForm, effective_to: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCtcDialog} color="secondary">Cancel</Button>
          <Button variant="contained" onClick={handleCreateCtc}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Salary Payment Dialog (existing) */}
      <Dialog open={openPayDialog} onClose={handleClosePayDialog} fullWidth maxWidth="sm">
        <DialogTitle>Pay Salary for {staff.name}</DialogTitle>
        <Formik
          initialValues={{
            academic_year_id: '',
            base_salary_amount: staff.actual_salary || '',
            salary_month: '',
            description: '',
          }}
          validationSchema={PaySalarySchema}
          onSubmit={handlePaySalary}
          enableReinitialize={true}
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
                <Button onClick={handleClosePayDialog} color="secondary">Cancel</Button>
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