import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosConfig';
import appConfig from '../config/appConfig';
import {
  Container, Typography, TextField, Button, Grid, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Card, CardContent, Box,
  Checkbox, FormControlLabel, Select, MenuItem, InputLabel, FormControl
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { handleApiError } from '../utils/errorHandler';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CategoryIcon from '@mui/icons-material/Category';
import ScheduleIcon from '@mui/icons-material/Schedule';
import OptionalIcon from '@mui/icons-material/FactCheck'; // Using FactCheck for optional

const FeeCategoryManager = () => {
  const [feeCategories, setFeeCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    category_name: '',
    payment_schedule: '', // This will be a number
    is_optional: false,
    is_class_specific_fee: false,
    core_fee: false,
    educational_supplies: false,
  });
  const [stats, setStats] = useState({
    totalCategories: 0,
    coreFees: 0,
    optionalFees: 0,
    educationalSuppliesFees: 0,
  });

  useEffect(() => {
    fetchFeeCategories();
  }, []);

  const fetchFeeCategories = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/fees-management/fee-categories/`);
      setFeeCategories(response.data);
    } catch (error) {
      handleApiError(error, setAlert);
    } finally {
      setLoading(false);
    }
  };

  const handleModalOpen = (category = null) => {
    if (category) {
      setSelectedCategory(category);
      setFormData({
        category_name: category.category_name,
        payment_schedule: category.payment_schedule,
        is_optional: category.is_optional,
        is_class_specific_fee: category.is_class_specific_fee,
        core_fee: category.core_fee,
        educational_supplies: category.educational_supplies,
      });
    } else {
      setSelectedCategory(null);
      setFormData({
        category_name: '',
        payment_schedule: '',
        is_optional: false,
        is_class_specific_fee: false,
        core_fee: false,
        educational_supplies: false,
      });
    }
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedCategory(null);
    setFormData({
      category_name: '',
      payment_schedule: '',
      is_optional: false,
      is_class_specific_fee: false,
      core_fee: false,
      educational_supplies: false,
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const categoryData = {
        category_name: formData.category_name.trim(),
        payment_schedule: parseInt(formData.payment_schedule, 10), // Ensure it's an integer
        is_optional: formData.is_optional,
        is_class_specific_fee: formData.is_class_specific_fee,
        core_fee: formData.core_fee,
        educational_supplies: formData.educational_supplies,
      };

      if (selectedCategory) {
        await axiosInstance.put(`${appConfig.API_PREFIX_V1}/fees-management/fee-categories/${selectedCategory.id}`, categoryData);
        setAlert({ open: true, message: 'Fee Category updated successfully!', severity: 'success' });
      } else {
        await axiosInstance.post(`${appConfig.API_PREFIX_V1}/fees-management/fee-categories/`, categoryData);
        setAlert({ open: true, message: 'Fee Category added successfully!', severity: 'success' });
      }

      handleModalClose();
      fetchFeeCategories();
    } catch (error) {
      handleApiError(error, setAlert);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this fee category?')) {
      try {
        await axiosInstance.delete(`${appConfig.API_PREFIX_V1}/fees-management/fee-categories/${id}`);
        setAlert({ open: true, message: 'Fee Category deleted successfully!', severity: 'success' });
        fetchFeeCategories();
      } catch (error) {
        handleApiError(error, setAlert);
      }
    }
  };

  const filteredCategories = feeCategories.filter(category =>
    category.category_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateStats = () => {
    try {
      const totalCategories = feeCategories.length;
      const coreFees = feeCategories.filter(cat => cat.core_fee).length;
      const optionalFees = feeCategories.filter(cat => cat.is_optional).length;
      const educationalSuppliesFees = feeCategories.filter(cat => cat.educational_supplies).length;

      setStats({
        totalCategories,
        coreFees,
        optionalFees,
        educationalSuppliesFees,
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };

  useEffect(() => {
    if (feeCategories.length > 0) {
      calculateStats();
    } else {
      setStats({
        totalCategories: 0,
        coreFees: 0,
        optionalFees: 0,
        educationalSuppliesFees: 0,
      });
    }
  }, [feeCategories]);

  const columns = [
    { field: 'category_name', headerName: 'Category Name', width: 200 },
    { field: 'payment_schedule', headerName: 'Payment Schedule (Months)', width: 180 },
    { field: 'is_optional', headerName: 'Optional', width: 100, type: 'boolean' },
    { field: 'is_class_specific_fee', headerName: 'Class Specific', width: 130, type: 'boolean' },
    { field: 'core_fee', headerName: 'Core Fee', width: 100, type: 'boolean' },
    { field: 'educational_supplies', headerName: 'Educational Supplies', width: 170, type: 'boolean' },
    { field: 'status', headerName: 'Status', width: 100 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      renderCell: (params) => (
        <div>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => handleModalOpen(params.row)}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={() => handleDelete(params.row.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const paymentScheduleOptions = Array.from({ length: 12 }, (_, i) => i + 1); // 1 to 12 months

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <CategoryIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Total Categories</Typography>
              </Box>
              <Typography variant="h4">{stats.totalCategories}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <AttachMoneyIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Core Fees</Typography>
              </Box>
              <Typography variant="h4">{stats.coreFees}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.light', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <OptionalIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Optional Fees</Typography>
              </Box>
              <Typography variant="h4">{stats.optionalFees}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.light', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <ScheduleIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Educational Supplies</Typography>
              </Box>
              <Typography variant="h4">{stats.educationalSuppliesFees}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs>
          <Typography variant="h4">Fee Categories</Typography>
        </Grid>
        <Grid item>
          <TextField
            size="small"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            onClick={() => handleModalOpen()}
          >
            Add Fee Category
          </Button>
        </Grid>
      </Grid>

      <div style={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={filteredCategories}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5]}
          disableSelectionOnClick
          loading={loading}
          getRowId={(row) => row.id}
        />
      </div>

      <Dialog open={modalOpen} onClose={handleModalClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedCategory ? 'Edit Fee Category' : 'Add Fee Category'}
          <Button
            onClick={handleModalClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            Close
          </Button>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Category Name"
                  name="category_name"
                  value={formData.category_name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel id="payment-schedule-label">Payment Schedule (Months)</InputLabel>
                  <Select
                    labelId="payment-schedule-label"
                    id="payment_schedule"
                    name="payment_schedule"
                    value={formData.payment_schedule}
                    onChange={handleInputChange}
                    label="Payment Schedule (Months)"
                  >
                    {paymentScheduleOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.is_optional}
                      onChange={handleInputChange}
                      name="is_optional"
                    />
                  }
                  label="Is Optional"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.is_class_specific_fee}
                      onChange={handleInputChange}
                      name="is_class_specific_fee"
                    />
                  }
                  label="Is Class Specific Fee"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.core_fee}
                      onChange={handleInputChange}
                      name="core_fee"
                    />
                  }
                  label="Core Fee"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.educational_supplies}
                      onChange={handleInputChange}
                      name="educational_supplies"
                    />
                  }
                  label="Educational Supplies"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleModalClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {selectedCategory ? 'Update' : 'Add'} Category
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, open: false })}
      >
        <Alert
          onClose={() => setAlert({ ...alert, open: false })}
          severity={alert.severity}
          sx={{ width: '100%', whiteSpace: 'pre-line' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default FeeCategoryManager;