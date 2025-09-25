import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../utils/axiosConfig';
import appConfig from '../config/appConfig';
import {
  Container, Typography, TextField, Button, Grid, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Card, CardContent, Box,
  Checkbox, FormControlLabel, Select, MenuItem, InputLabel, FormControl, Divider
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid'; // Ensure this is the correct import for DataGrid
import { handleApiError } from '../utils/errorHandler';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ClassIcon from '@mui/icons-material/Class';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DescriptionIcon from '@mui/icons-material/Description';
import RouteIcon from '@mui/icons-material/Route';
import PersonIcon from '@mui/icons-material/Person';
import MapIcon from '@mui/icons-material/Map';
import VisibilityIcon from '@mui/icons-material/Visibility'; // Icon for view details button
import Papa from 'papaparse'; // Add at the top for CSV parsing

const ClassFeeManager = () => {
  // Define constant for transport fee category name to avoid hardcoding
  const TRANSPORT_FEE_NAME = 'Transport Fee';

  const [fees, setFees] = useState([]);
  const [feeCategories, setFeeCategories] = useState([]);
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [modalOpen, setModalOpen] = useState(false); // For Add/Edit Fee
  const [routeDetailsModalOpen, setRouteDetailsModalOpen] = useState(false); // New state for Route Details modal
  const [selectedRouteDetails, setSelectedRouteDetails] = useState(null); // State to hold route/driver data for detail modal
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFee, setSelectedFee] = useState(null); // For Add/Edit Fee
  const [formData, setFormData] = useState({
    fee_category_id: '',
    class_id: '',
    amount: '',
    description: '',
    payment_schedule: '',
    is_optional: false,
    academic_year_id: '',
    route_id: null,
  });
  const [stats, setStats] = useState({
    totalFees: 0,
    totalClassSpecificFees: 0,
    totalOptionalFees: 0,
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [
        feesResponse,
        feeCategoriesResponse,
        classesResponse,
        academicYearsResponse,
        routesResponse,
        driversResponse
      ] = await Promise.all([
        axiosInstance.get(`${appConfig.API_PREFIX_V1}/fees/`),
        axiosInstance.get(`${appConfig.API_PREFIX_V1}/fees-management/fee-categories/`),
        axiosInstance.get(`${appConfig.API_PREFIX_V1}/students-managements/classes/`),
        axiosInstance.get(`${appConfig.API_PREFIX_V1}/timetable/academic-years/`),
        axiosInstance.get(`${appConfig.API_PREFIX_V1}/students-managements/transport/routes`),
        axiosInstance.get(`${appConfig.API_PREFIX_V1}/students-managements/transport/drivers/`)
      ]);

      setFees(feesResponse.data);
      setFeeCategories(feeCategoriesResponse.data);
      setClasses(classesResponse.data);
      setAcademicYears(academicYearsResponse.data);
      setRoutes(routesResponse.data);
      setDrivers(driversResponse.data);
    } catch (error) {
      handleApiError(error, setAlert);
    } finally {
      setLoading(false);
    }
  };

  const handleModalOpen = (feeItem = null) => {
    if (feeItem) {
      setSelectedFee(feeItem);
      setFormData({
        fee_category_id: feeItem.fee_category_id,
        class_id: feeItem.class_id,
        amount: feeItem.amount,
        description: feeItem.description || '',
        payment_schedule: feeItem.payment_schedule,
        is_optional: feeItem.is_optional,
        academic_year_id: feeItem.academic_year_id,
        route_id: feeItem.route_id || null,
      });
    } else {
      setSelectedFee(null);
      setFormData({
        fee_category_id: '',
        class_id: '',
        amount: '',
        description: '',
        payment_schedule: '',
        is_optional: false,
        academic_year_id: '',
        route_id: null,
      });
    }
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedFee(null);
    setFormData({
      fee_category_id: '',
      class_id: '',
      amount: '',
      description: '',
      payment_schedule: '',
      is_optional: false,
      academic_year_id: '',
      route_id: null,
    });
  };

  const handleViewRouteDetails = (feeItem) => {
    const category = feeCategories.find(cat => cat.id === feeItem.fee_category_id);
    if (category && category.category_name === TRANSPORT_FEE_NAME && feeItem.route_id) {
      const route = routes.find(r => r.id === feeItem.route_id);
      const driver = route ? drivers.find(d => d.id === route.driver_id) : null;
      setSelectedRouteDetails({ route, driver });
      setRouteDetailsModalOpen(true);
    } else {
      setAlert({ open: true, message: 'No transport details available for this fee.', severity: 'info' });
    }
  };

  const handleRouteDetailsModalClose = () => {
    setRouteDetailsModalOpen(false);
    setSelectedRouteDetails(null);
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
      const feeData = {
        fee_category_id: formData.fee_category_id,
        class_id: formData.class_id,
        amount: parseFloat(formData.amount),
        description: formData.description.trim(),
        payment_schedule: parseInt(formData.payment_schedule, 10),
        is_optional: formData.is_optional,
        academic_year_id: formData.academic_year_id,
        route_id: formData.route_id,
      };

      if (selectedFee) {
        await axiosInstance.put(`${appConfig.API_PREFIX_V1}/fees/${selectedFee.id}`, feeData);
        setAlert({ open: true, message: 'Fee updated successfully!', severity: 'success' });
      } else {
        await axiosInstance.post(`${appConfig.API_PREFIX_V1}/fees/`, feeData);
        setAlert({ open: true, message: 'Fee added successfully!', severity: 'success' });
      }

      handleModalClose();
      fetchInitialData();
    } catch (error) {
      handleApiError(error, setAlert);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this fee entry?')) {
      try {
        await axiosInstance.delete(`${appConfig.API_PREFIX_V1}/fees/${id}`);
        setAlert({ open: true, message: 'Fee deleted successfully!', severity: 'success' });
        fetchInitialData();
      } catch (error) {
        handleApiError(error, setAlert);
      }
    }
  };

  const isTransportFee = feeCategories.find(
    cat => cat.id === formData.fee_category_id
  )?.category_name === TRANSPORT_FEE_NAME;

  const filteredFees = fees.filter(fee => {
    const categoryName = feeCategories.find(cat => cat.id === fee.fee_category_id)?.category_name || '';
    const className = classes.find(cls => cls.id === fee.class_id)?.class_name || '';
    const academicYear = academicYears.find(year => year.id === fee.academic_year_id)?.year_name || '';

    let routeInfo = '';
    if (categoryName === TRANSPORT_FEE_NAME && fee.route_id) {
      const route = routes.find(r => r.id === fee.route_id);
      if (route) {
        const driver = drivers.find(d => d.id === route.driver_id);
        routeInfo = `${route.route_name || ''} ${driver ? driver.driver_name : ''}`;
      }
    }

    const searchString = `${categoryName} ${className} ${academicYear} ${fee.description} ${fee.amount} ${routeInfo}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const calculateStats = () => {
    try {
      const totalFees = fees.length;
      const totalClassSpecificFees = fees.filter(fee => {
        const category = feeCategories.find(cat => cat.id === fee.fee_category_id);
        return category && category.is_class_specific_fee;
      }).length;
      const totalOptionalFees = fees.filter(fee => fee.is_optional).length;

      setStats({
        totalFees,
        totalClassSpecificFees,
        totalOptionalFees,
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };

  useEffect(() => {
    if (fees.length > 0 || feeCategories.length > 0) {
      calculateStats();
    } else {
      setStats({
        totalFees: 0,
        totalClassSpecificFees: 0,
        totalOptionalFees: 0,
      });
    }
  }, [fees, feeCategories]);

  const columns = [
    {
      field: 'fee_category',
      headerName: 'Fee Category',
      width: 150,
      valueGetter: (params) => {
        const category = feeCategories.find(cat => cat.id === params.row.fee_category_id);
        return category ? category.category_name : 'N/A';
      },
    },
    {
      field: 'class_name',
      headerName: 'Class',
      width: 120,
      valueGetter: (params) => {
        const cls = classes.find(c => c.id === params.row.class_id);
        return cls ? cls.class_name : 'N/A';
      },
    },
    { field: 'amount', headerName: 'Amount', width: 100 },
    { field: 'description', headerName: 'Description', flex: 1, minWidth: 200 },
    { field: 'payment_schedule', headerName: 'Schedule (Months)', width: 150 },
    { field: 'is_optional', headerName: 'Optional', width: 100, type: 'boolean' },
    {
      field: 'academic_year',
      headerName: 'Academic Year',
      width: 150,
      valueGetter: (params) => {
        const year = academicYears.find(y => y.id === params.row.academic_year_id);
        return year ? year.year_name : 'N/A';
      },
    },
    { field: 'status', headerName: 'Status', width: 100 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 280, // Increased width to accommodate the new button
      renderCell: (params) => {
        const category = feeCategories.find(cat => cat.id === params.row.fee_category_id);
        const isTransportFeeCategory = category && category.category_name === TRANSPORT_FEE_NAME;
        const hasRouteId = !!params.row.route_id;

        return (
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
            {isTransportFeeCategory && hasRouteId && (
              <Button
                variant="outlined" // Changed to outlined for distinction
                color="info" // A distinct color
                size="small"
                onClick={() => handleViewRouteDetails(params.row)}
                sx={{ mr: 1 }}
                startIcon={<VisibilityIcon />} // Icon for view details
              >
                View Route
              </Button>
            )}
            <Button
              variant="contained"
              color="error"
              size="small"
              onClick={() => handleDelete(params.row.id)}
            >
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  const paymentScheduleOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  // CSV Download Handler
  const handleDownloadCSV = () => {
    const csvData =
      filteredFees.length > 0
        ? filteredFees.map(fee => {
            const category = feeCategories.find(cat => cat.id === fee.fee_category_id);
            const cls = classes.find(c => c.id === fee.class_id);
            const year = academicYears.find(y => y.id === fee.academic_year_id);
            return {
              fee_category: category ? category.category_name : '',
              class_name: cls ? cls.class_name : '',
              amount: fee.amount,
              description: fee.description,
              payment_schedule: fee.payment_schedule,
              is_optional: fee.is_optional,
              academic_year: year ? year.year_name : '',
              status: fee.status,
            };
          })
        : [{
            fee_category: '',
            class_name: '',
            amount: '',
            description: '',
            payment_schedule: '',
            is_optional: '',
            academic_year: '',
            status: '',
          }];
    const csv = Papa.unparse(csvData, {
      header: true,
      skipEmptyLines: true,
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'class_fees.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // CSV Upload Handler
  const handleUploadCSV = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file, file.name);

    try {
      await axiosInstance.post(
        `${appConfig.API_PREFIX_V1}/fees/bulk-csv`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setAlert({ open: true, message: 'Class fees uploaded successfully!', severity: 'success' });
      fetchInitialData();
    } catch (error) {
      handleApiError(error, setAlert);
    }
    // Reset input value so the same file can be uploaded again if needed
    event.target.value = '';
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <AttachMoneyIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Total Fee Entries</Typography>
              </Box>
              <Typography variant="h4">{stats.totalFees}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <ClassIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Class Specific Fees</Typography>
              </Box>
              <Typography variant="h4">{stats.totalClassSpecificFees}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ bgcolor: 'info.light', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <DescriptionIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Optional Fees</Typography>
              </Box>
              <Typography variant="h4">{stats.totalOptionalFees}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs>
          <Typography variant="h4">Fee Structure</Typography>
        </Grid>
        <Grid item>
          <TextField
            size="small"
            placeholder="Search fees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            onClick={() => handleModalOpen()}
          >
            Add Fee
          </Button>
        </Grid>
        <Grid item>
          <Button variant="outlined" onClick={handleDownloadCSV}>
            Download CSV
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="outlined"
            component="label"
          >
            Upload CSV
            <input
              type="file"
              accept=".csv"
              hidden
              onChange={handleUploadCSV}
              data-testid="upload-csv-input"
            />
          </Button>
        </Grid>
      </Grid>

      <div style={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={filteredFees}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5]}
          disableSelectionOnClick
          loading={loading}
          getRowId={(row) => row.id}
          // Removed DataGrid specific detail panel props
        />
      </div>

      <Dialog open={modalOpen} onClose={handleModalClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedFee ? 'Edit Fee' : 'Add Fee'}
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
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel id="fee-category-label">Fee Category</InputLabel>
                  <Select
                    labelId="fee-category-label"
                    id="fee_category_id"
                    name="fee_category_id"
                    value={formData.fee_category_id}
                    onChange={handleInputChange}
                    label="Fee Category"
                  >
                    {feeCategories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.category_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel id="class-label">Class</InputLabel>
                  <Select
                    labelId="class-label"
                    id="class_id"
                    name="class_id"
                    value={formData.class_id}
                    onChange={handleInputChange}
                    label="Class"
                  >
                    {classes.map((cls) => (
                      <MenuItem key={cls.id} value={cls.id}>
                        {cls.class_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel id="academic-year-label">Academic Year</InputLabel>
                  <Select
                    labelId="academic-year-label"
                    id="academic_year_id"
                    name="academic_year_id"
                    value={formData.academic_year_id}
                    onChange={handleInputChange}
                    label="Academic Year"
                  >
                    {academicYears.map((year) => (
                      <MenuItem key={year.id} value={year.id}>
                        {year.year_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Amount"
                  name="amount"
                  type="number"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                  inputProps={{ step: "0.01" }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
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
              {isTransportFee && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="route-label">Transport Route (Driver)</InputLabel>
                    <Select
                      labelId="route-label"
                      id="route_id"
                      name="route_id"
                      value={formData.route_id || ''}
                      onChange={handleInputChange}
                      label="Transport Route (Driver)"
                    >
                      <MenuItem value={null}>
                        <em>None</em>
                      </MenuItem>
                      {routes.map((route) => {
                        const driver = drivers.find(d => d.id === route.driver_id);
                        return (
                          <MenuItem key={route.id} value={route.id}>
                            {route.route_name || 'N/A'} ({driver ? driver.driver_name : 'No Driver'})
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleModalClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {selectedFee ? 'Update' : 'Add'} Fee
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* New Dialog for Route Details */}
      <Dialog open={routeDetailsModalOpen} onClose={handleRouteDetailsModalClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Route Details
          <Button
            onClick={handleRouteDetailsModalClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            Close
          </Button>
        </DialogTitle>
        <DialogContent dividers>
          {selectedRouteDetails ? (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <RouteIcon sx={{ mr: 1 }} />
                  Route Information
                </Typography>
                <Typography variant="body1"><strong>Name:</strong> {selectedRouteDetails.route?.route_name || 'N/A'}</Typography>
                <Typography variant="body1"><strong>Distance:</strong> {selectedRouteDetails.route?.distance ? `${selectedRouteDetails.route.distance} km` : 'N/A'}</Typography>
                <Typography variant="body1"><strong>Description:</strong> {selectedRouteDetails.route?.description || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PersonIcon sx={{ mr: 1 }} />
                  Driver Information
                </Typography>
                <Typography variant="body1"><strong>Name:</strong> {selectedRouteDetails.driver?.driver_name || 'N/A'}</Typography>
                <Typography variant="body1"><strong>License:</strong> {selectedRouteDetails.driver?.license_number || 'N/A'}</Typography>
                <Typography variant="body1"><strong>Contact:</strong> {selectedRouteDetails.driver?.contact_number || 'N/A'}</Typography>
                <Typography variant="body1"><strong>Address:</strong> {selectedRouteDetails.driver?.address || 'N/A'}</Typography>
              </Grid>
            </Grid>
          ) : (
            <Typography>No route details available.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRouteDetailsModalClose} color="primary" variant="contained">
            OK
          </Button>
        </DialogActions>
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

export default ClassFeeManager;