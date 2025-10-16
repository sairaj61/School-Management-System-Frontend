// src/components/ExpenditureManager.jsx
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Container, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Tooltip, Select, FormControl, InputLabel
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify'; // Import toast
import axiosInstance from '../utils/axiosConfig';
import appConfig from '../config/appConfig';

const ExpenditureSchema = Yup.object().shape({
  amount: Yup.number().positive('Amount must be positive').required('Amount is required'),
  description: Yup.string().max(500, 'Description too long').nullable(),
  expenditure_category_id: Yup.string().required('Category is required'),
  academic_year_id: Yup.string().required('Academic Year is required'),
});

const ExpenditureManager = () => {
  const [expenditures, setExpenditures] = useState([]);
  const [categories, setCategories] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingExpenditure, setEditingExpenditure] = useState(null);

  const fetchDependencies = async () => {
    try {
      const [categoriesRes, academicYearsRes] = await Promise.all([
        axiosInstance.get(`${appConfig.API_PREFIX_V1}/administrative/expenditures/categories/`),
        // IMPORTANT: Your backend provides 'active_academic_years' not all.
        // If you need a list of ALL academic years for the dropdown,
        // you MUST have an endpoint in your backend like /academic-years/
        // For now, I'm using '/academic-years/' assuming you have or will create it.
        // If not, you'll only be able to select the *active* year.
        axiosInstance.get(`${appConfig.API_PREFIX_V1}/timetable/academic-years/`), // Assuming this endpoint exists and returns ALL academic years
      ]);
      setCategories(categoriesRes.data);
      setAcademicYears(academicYearsRes.data);
      // If api.get('/academic-years/') only returns the active one,
      // and you need all years for selection, you'd do:
      // setAcademicYears(Array.isArray(academicYearsRes.data) ? academicYearsRes.data : [academicYearsRes.data]);
      // But ideally, the backend endpoint should return a list for a dropdown.

    } catch (error) {
      toast.error('Failed to load dependencies (categories or academic years).');
      console.error('Dependency fetch error:', error);
    }
  };

  const fetchExpenditures = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/administrative/expenditures/`);
      setExpenditures(response.data);
      // toast.success('Expenditures loaded successfully!'); // Can be noisy on initial load
    } catch (error) {
      toast.error('Failed to load expenditures.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
    fetchExpenditures();
  }, []);

  const handleOpenDialog = (expenditure = null) => {
    setEditingExpenditure(expenditure);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingExpenditure(null);
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      if (editingExpenditure) {
        // Update existing expenditure
        await axiosInstance.put(`${appConfig.API_PREFIX_V1}/administrative/expenditures/${editingExpenditure.id}`, values);
        toast.success('Expenditure updated successfully!');
      } else {
        // Create new expenditure
        await axiosInstance.post(`${appConfig.API_PREFIX_V1}/administrative/expenditures/`, values);
        toast.success('Expenditure added successfully!');
      }
      handleCloseDialog(); // Close modal on success
      fetchExpenditures(); // Refresh the list on success
      resetForm(); // Reset form values after successful submission
    } catch (error) {
      toast.error(`Failed to ${editingExpenditure ? 'update' : 'add'} expenditure.`);
      console.error('Submission error:', error);
    } finally {
      setSubmitting(false);
      // Removed resetForm() here to only reset on success.
    }
  };

  const handleDelete = async (expenditureId) => {
    if (window.confirm('Are you sure you want to delete this expenditure?')) {
      try {
        await axiosInstance.delete(`${appConfig.API_PREFIX_V1}/administrative/expenditures/${expenditureId}`);
        toast.success('Expenditure deleted successfully!');
        fetchExpenditures(); // Refresh the list
      }
      catch (error) {
        toast.error('Failed to delete expenditure.');
        console.error('Delete error:', error);
      }
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.category_name : 'Unknown Category';
  };

  const getAcademicYearName = (academicYearId) => {
    const year = academicYears.find(ay => ay.id === academicYearId);
    // The backend provides 'year_name' and 'start_date'/'end_date' for active academic year.
    // Assuming a 'year_name' or 'year' field is consistently available if fetching all years.
    return year ? (year.year_name || year.year || year.start_date.substring(0,4)) : 'Unknown Year';
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
          School Expenditures
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Expenditure
        </Button>
      </Box>

      <Paper elevation={3} sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader aria-label="expenditures table">
            <TableHead>
              <TableRow>
                <TableCell>Amount</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Academic Year</TableCell>
                <TableCell>Date</TableCell>
                 <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {expenditures.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No expenditures found.
                  </TableCell>
                </TableRow>
              ) : (
                expenditures.map((exp) => (
                  <TableRow key={exp.id}>
                    <TableCell>${exp.amount.toFixed(2)}</TableCell>
                    <TableCell>{exp.description || 'N/A'}</TableCell>
                    <TableCell>{getCategoryName(exp.expenditure_category_id)}</TableCell>
                    <TableCell>{getAcademicYearName(exp.academic_year_id)}</TableCell>
                    <TableCell>{new Date(exp.expenditure_date).toLocaleDateString()}</TableCell>
                    <TableCell>{exp.status || 'N/A'}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit">
                        <IconButton color="primary" onClick={() => handleOpenDialog(exp)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton color="secondary" onClick={() => handleDelete(exp.id)}>
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

      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editingExpenditure ? 'Edit Expenditure' : 'Add New Expenditure'}</DialogTitle>
        <Formik
          initialValues={editingExpenditure || {
            amount: '',
            description: '',
            expenditure_category_id: '',
            academic_year_id: '',
          }}
          validationSchema={ExpenditureSchema}
          onSubmit={handleSubmit}
          enableReinitialize={true}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form>
              <DialogContent dividers>
                <Field
                  as={TextField}
                  name="amount"
                  label="Amount"
                  type="number"
                  fullWidth
                  margin="normal"
                  error={touched.amount && !!errors.amount}
                  helperText={touched.amount && errors.amount}
                />
                <Field
                  as={TextField}
                  name="description"
                  label="Description"
                  fullWidth
                  margin="normal"
                  multiline
                  rows={3}
                  error={touched.description && !!errors.description}
                  helperText={touched.description && errors.description}
                />
                <FormControl fullWidth margin="normal" error={touched.expenditure_category_id && !!errors.expenditure_category_id}>
                  <InputLabel id="category-label">Expenditure Category</InputLabel>
                  <Field
                    as={Select}
                    labelId="category-label"
                    name="expenditure_category_id"
                    label="Expenditure Category"
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>
                        {cat.category_name}
                      </MenuItem>
                    ))}
                  </Field>
                  {touched.expenditure_category_id && errors.expenditure_category_id && (
                    <Typography color="error" variant="caption">{errors.expenditure_category_id}</Typography>
                  )}
                </FormControl>
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
                        {ay.year_name || ay.start_date.substring(0,4)} {/* Use year_name or derive from start_date */}
                      </MenuItem>
                    ))}
                  </Field>
                  {touched.academic_year_id && errors.academic_year_id && (
                    <Typography color="error" variant="caption">{errors.academic_year_id}</Typography>
                  )}
                </FormControl>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseDialog} color="secondary">
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={isSubmitting}>
                  {isSubmitting ? <CircularProgress size={24} /> : (editingExpenditure ? 'Update' : 'Add')}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </Container>
  );
};

export default ExpenditureManager;