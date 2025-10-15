// src/components/ExpenditureCategoryManager.jsx
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Container, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Tooltip
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import axiosInstance from '../utils/axiosConfig';
import appConfig from '../config/appConfig';

const CategorySchema = Yup.object().shape({
  category_name: Yup.string().required('Category name is required').max(255, 'Category name too long'),
  description: Yup.string().max(255, 'Description too long').nullable(),
});

const ExpenditureCategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null); // null for create, object for edit

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/administrative/expenditure-management/expenditures/categories/`);
      setCategories(response.data);
      toast.success('Expenditure categories loaded successfully!');
    } catch (error) {
      toast.error('Failed to load expenditure categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenDialog = (category = null) => {
    setEditingCategory(category);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCategory(null);
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      if (editingCategory) {
        // Update existing category
        await axiosInstance.put(`${appConfig.API_PREFIX_V1}/administrative/expenditure-management/expenditures/categories/${editingCategory.id}`, values);
        toast.success('Category updated successfully!');
      } else {
        // Create new category
        await axiosInstance.post(`${appConfig.API_PREFIX_V1}/administrative/expenditure-management/expenditures/categories/`, values);
        toast.success('Category added successfully!');
      }
      handleCloseDialog();
      fetchCategories(); // Refresh the list
    } catch (error) {
      toast.error(`Failed to ${editingCategory ? 'update' : 'add'} category.`);
    } finally {
      setSubmitting(false);
      resetForm();
    }
  };

  const handleDelete = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this expenditure category?')) {
      try {
        await axiosInstance.delete(`${appConfig.API_PREFIX_V1}/administrative/expenditure-management/expenditures/categories/${categoryId}`);
        toast.success('Category deleted successfully!');
        fetchCategories(); // Refresh the list
      } catch (error) {
        toast.error('Failed to delete category.');
      }
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
          Expenditure Categories
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Category
        </Button>
      </Box>

      <Paper elevation={3} sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader aria-label="expenditure categories table">
            <TableHead>
              <TableRow>
                <TableCell>Category Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No expenditure categories found.
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>{category.category_name}</TableCell>
                    <TableCell>{category.description || 'N/A'}</TableCell>
                    <TableCell>{new Date(category.created_at).toLocaleDateString()}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit">
                        <IconButton color="primary" onClick={() => handleOpenDialog(category)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton color="secondary" onClick={() => handleDelete(category.id)}>
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
        <DialogTitle>{editingCategory ? 'Edit Expenditure Category' : 'Add New Expenditure Category'}</DialogTitle>
        <Formik
          initialValues={editingCategory || {
            category_name: '',
            description: '',
          }}
          validationSchema={CategorySchema}
          onSubmit={handleSubmit}
          enableReinitialize={true}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form>
              <DialogContent dividers>
                <Field
                  as={TextField}
                  name="category_name"
                  label="Category Name"
                  fullWidth
                  margin="normal"
                  error={touched.category_name && !!errors.category_name}
                  helperText={touched.category_name && errors.category_name}
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
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseDialog} color="secondary">
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={isSubmitting}>
                  {isSubmitting ? <CircularProgress size={24} /> : (editingCategory ? 'Update' : 'Add')}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </Container>
  );
};

export default ExpenditureCategoryManager;