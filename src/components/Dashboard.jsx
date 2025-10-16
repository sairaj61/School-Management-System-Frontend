import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import {
  Container, Grid, Card, CardContent, Typography, Snackbar, Alert, CircularProgress, Box,
  Tabs, Tab, List, ListItem, ListItemText, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axiosInstance from '../utils/axiosConfig';
import appConfig from '../config/appConfig';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [tabValue, setTabValue] = useState(0);
  const [modalOpen, setModalOpen] = useState({ type: '', open: false });

  // State for data
  const [enrollmentAttendance, setEnrollmentAttendance] = useState({
    total_students: 0,
    academic_year: '',
    class_enrollment: [],
  });
  const [feeCollection, setFeeCollection] = useState({
    total_fees_billed: 0,
    total_fees_collected: 0,
    total_outstanding_fees: 0,
    collection_percentage: 0,
    payment_status_breakdown: {},
    fee_category_breakdown: [],
  });
  const [financialSummary, setFinancialSummary] = useState({
    total_revenue: 0,
    total_expenditure: 0,
    net_financial_position: 0,
    revenue_breakdown: {},
  });
  const [facilitiesUsage, setFacilitiesUsage] = useState({ facility_usage: [] });
  const [transportSummary, setTransportSummary] = useState({
    total_students_transport: 0,
    route_utilization: [],
    drivers_overview: [],
  });

  useEffect(() => {
    fetchAllDashboardData();
  }, []);

  const fetchAllDashboardData = async () => {
    setLoading(true);
    try {
      const [enrollmentRes, feeCollectionRes, financialRes, facilitiesRes, transportRes] = await Promise.all([
        axiosInstance.get(`${appConfig.API_PREFIX_V1}/administrative/dashboard/enrollment-attendance-summary`),
        axiosInstance.get(`${appConfig.API_PREFIX_V1}/administrative/dashboard/finance/fee-collection-summary`),
        axiosInstance.get(`${appConfig.API_PREFIX_V1}/administrative/dashboard/finance/revenue-expenditure-summary`),
        axiosInstance.get(`${appConfig.API_PREFIX_V1}/administrative/dashboard/student-facilities-usage`),
        axiosInstance.get(`${appConfig.API_PREFIX_V1}/administrative/dashboard/transport-summary`),
      ]);
      setEnrollmentAttendance(enrollmentRes.data);
      setFeeCollection(feeCollectionRes.data);
      setFinancialSummary(financialRes.data);
      setFacilitiesUsage(facilitiesRes.data);
      setTransportSummary(transportRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setAlert({ open: true, message: 'Error fetching dashboard data. Please try again.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAlert = () => setAlert({ ...alert, open: false });
  const handleTabChange = (event, newValue) => setTabValue(newValue);
  const handleModalOpen = (type) => setModalOpen({ type, open: true });
  const handleModalClose = () => setModalOpen({ type: '', open: false });

  const formatCurrency = (value) => {
    value = parseFloat(value);
    return isNaN(value) ? '₹0.00' : `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const formatPercentage = (value) => {
    value = parseFloat(value);
    return isNaN(value) ? '0.00%' : `${value.toFixed(2)}%`;
  };

  // Chart Data
  const paymentStatusChartData = {
    labels: Object.keys(feeCollection.payment_status_breakdown),
    datasets: [{
      label: 'Amount (₹)',
      data: Object.values(feeCollection.payment_status_breakdown),
      backgroundColor: ['rgba(75, 192, 192, 0.7)', 'rgba(255, 206, 86, 0.7)', 'rgba(255, 99, 132, 0.7)', 'rgba(153, 102, 255, 0.7)'],
      borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 206, 86, 1)', 'rgba(255, 99, 132, 1)', 'rgba(153, 102, 255, 1)'],
      borderWidth: 1,
    }],
  };

  const revenueChartData = {
    labels: Object.keys(financialSummary.revenue_breakdown),
    datasets: [{
      label: 'Revenue (₹)',
      data: Object.values(financialSummary.revenue_breakdown),
      backgroundColor: ['rgba(54, 162, 235, 0.7)', 'rgba(255, 159, 64, 0.7)', 'rgba(192, 192, 192, 0.7)'],
      borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 159, 64, 1)', 'rgba(192, 192, 192, 1)'],
      borderWidth: 1,
    }],
  };

  // DataGrid Columns
  const classEnrollmentColumns = [
    { field: 'class_name', headerName: 'Class', width: 120 },
    { field: 'total_students', headerName: 'Students', width: 100 },
    { field: 'sections', headerName: 'Sections', width: 200, renderCell: ({ value }) => value.map(s => `${s.name} (${s.students})`).join(', ') },
  ];

  const feeCategoryColumns = [
    { field: 'category', headerName: 'Category', width: 150 },
    { field: 'billed', headerName: 'Billed', width: 100, valueFormatter: ({ value }) => formatCurrency(value) },
    { field: 'collected', headerName: 'Collected', width: 100, valueFormatter: ({ value }) => formatCurrency(value) },
    { field: 'outstanding', headerName: 'Outstanding', width: 100, valueFormatter: ({ value }) => formatCurrency(value) },
  ];

  const facilitiesUsageColumns = [
    { field: 'facility_type', headerName: 'Facility', width: 150 },
    { field: 'students_count', headerName: 'Students', width: 100 },
  ];

  const routeUtilizationColumns = [
    { field: 'route_name', headerName: 'Route', width: 120 },
    { field: 'students_count', headerName: 'Students', width: 100 },
    { field: 'driver', headerName: 'Driver', width: 120 },
  ];

  const driversOverviewColumns = [
    { field: 'driver_name', headerName: 'Driver', width: 120 },
    { field: 'assigned_routes', headerName: 'Routes', width: 150, renderCell: ({ value }) => value.join(', ') },
    { field: 'students_count', headerName: 'Students', width: 100 },
  ];

  // Prepare DataGrid Rows
  const classEnrollmentRows = enrollmentAttendance.class_enrollment.map((row, index) => ({ ...row, id: row.class_name + index }));
  const feeCategoryRows = feeCollection.fee_category_breakdown.map((row, index) => ({ ...row, id: row.category + index }));
  const facilitiesUsageRows = facilitiesUsage.facility_usage.map((row, index) => ({ ...row, id: row.facility_type + index }));
  const routeUtilizationRows = transportSummary.route_utilization.map((row, index) => ({ ...row, id: row.route_name + index }));
  const driversOverviewRows = transportSummary.drivers_overview.map((row, index) => ({ ...row, id: row.driver_name + index }));

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="subtitle1" sx={{ ml: 2 }}>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 2, mb: 2, p: 1, maxWidth: '100vw' }}>
      {/* Summary Bar */}
      <Grid container spacing={1} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={2.4}>
          <Card sx={{ p: 1, bgcolor: 'primary.light', color: 'white' }}>
            <Typography variant="caption">Students</Typography>
            <Typography variant="subtitle1">{enrollmentAttendance.total_students}</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={2.4}>
          <Card sx={{ p: 1, bgcolor: 'success.light', color: 'white' }}>
            <Typography variant="caption">Fees Collected</Typography>
            <Typography variant="subtitle1">{formatCurrency(feeCollection.total_fees_collected)}</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={2.4}>
          <Card sx={{ p: 1, bgcolor: 'error.light', color: 'white' }}>
            <Typography variant="caption">Fees Outstanding</Typography>
            <Typography variant="subtitle1">{formatCurrency(feeCollection.total_outstanding_fees)}</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={2.4}>
          <Card sx={{ p: 1, bgcolor: financialSummary.net_financial_position >= 0 ? 'success.main' : 'error.main', color: 'white' }}>
            <Typography variant="caption">Net Position</Typography>
            <Typography variant="subtitle1">{formatCurrency(financialSummary.net_financial_position)}</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={2.4}>
          <Card sx={{ p: 1, bgcolor: 'info.light', color: 'white' }}>
            <Typography variant="caption">Transport Users</Typography>
            <Typography variant="subtitle1">{transportSummary.total_students_transport}</Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Tabbed Sections */}
      <Card sx={{ p: 1 }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab label="Enrollment" />
          <Tab label="Finance" />
          <Tab label="Facilities & Transport" />
        </Tabs>

        {/* Enrollment Tab */}
        {tabValue === 0 && (
          <Box sx={{ p: 1 }}>
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>Class Enrollment</Typography>
                <List dense sx={{ maxHeight: 150, overflow: 'auto' }}>
                  {enrollmentAttendance.class_enrollment.slice(0, 5).map((item, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={`${item.class_name}: ${item.total_students} students`}
                        secondary={`Sections: ${item.sections.map(s => `${s.name} (${s.students})`).join(', ')}`}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                </List>
                {enrollmentAttendance.class_enrollment.length > 5 && (
                  <Button size="small" onClick={() => handleModalOpen('classEnrollment')}>
                    View All
                  </Button>
                )}
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Finance Tab */}
        {tabValue === 1 && (
          <Box sx={{ p: 1 }}>
            <Grid container spacing={1}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" gutterBottom>Fee Collection</Typography>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption">Billed: {formatCurrency(feeCollection.total_fees_billed)}</Typography>
                  <Typography variant="caption" sx={{ ml: 2 }}>Collected: {formatCurrency(feeCollection.total_fees_collected)}</Typography>
                  <Typography variant="caption" sx={{ ml: 2 }}>Rate: {formatPercentage(feeCollection.collection_percentage)}</Typography>
                </Box>
                <Box sx={{ height: 200 }}>
                  <Bar
                    data={paymentStatusChartData}
                    options={{
                      indexAxis: 'y',
                      responsive: true,
                      plugins: { legend: { display: false } },
                      scales: { x: { beginAtZero: true, ticks: { callback: (value) => `₹${value}` } } },
                    }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" gutterBottom>Financial Summary</Typography>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption">Revenue: {formatCurrency(financialSummary.total_revenue)}</Typography>
                  <Typography variant="caption" sx={{ ml: 2 }}>Expenditure: {formatCurrency(financialSummary.total_expenditure)}</Typography>
                </Box>
                <Box sx={{ height: 200 }}>
                  <Bar
                    data={revenueChartData}
                    options={{
                      indexAxis: 'y',
                      responsive: true,
                      plugins: { legend: { display: false } },
                      scales: { x: { beginAtZero: true, ticks: { callback: (value) => `₹${value}` } } },
                    }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>Fee Categories</Typography>
                <List dense sx={{ maxHeight: 100, overflow: 'auto' }}>
                  {feeCollection.fee_category_breakdown.slice(0, 3).map((item, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={`${item.category}`}
                        secondary={`Billed: ${formatCurrency(item.billed)} | Collected: ${formatCurrency(item.collected)}`}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                </List>
                {feeCollection.fee_category_breakdown.length > 3 && (
                  <Button size="small" onClick={() => handleModalOpen('feeCategories')}>
                    View All
                  </Button>
                )}
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Facilities & Transport Tab */}
        {tabValue === 2 && (
          <Box sx={{ p: 1 }}>
            <Grid container spacing={1}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" gutterBottom>Facility Usage</Typography>
                <List dense sx={{ maxHeight: 150, overflow: 'auto' }}>
                  {facilitiesUsage.facility_usage.slice(0, 5).map((item, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={`${item.facility_type}: ${item.students_count} students`}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
                {facilitiesUsage.facility_usage.length > 5 && (
                  <Button size="small" onClick={() => handleModalOpen('facilities')}>
                    View All
                  </Button>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" gutterBottom>Transport</Typography>
                <Typography variant="caption">Total Users: {transportSummary.total_students_transport}</Typography>
                <List dense sx={{ maxHeight: 100, overflow: 'auto' }}>
                  {transportSummary.route_utilization.slice(0, 3).map((item, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={`${item.route_name}: ${item.students_count} students`}
                        secondary={`Driver: ${item.driver}`}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                </List>
                {transportSummary.route_utilization.length > 3 && (
                  <Button size="small" onClick={() => handleModalOpen('routes')}>
                    View All Routes
                  </Button>
                )}
                {transportSummary.drivers_overview.length > 0 && (
                  <Button size="small" onClick={() => handleModalOpen('drivers')}>
                    View Drivers
                  </Button>
                )}
              </Grid>
            </Grid>
          </Box>
        )}
      </Card>

      {/* Modals for Detailed Data */}
      <Dialog open={modalOpen.open} onClose={handleModalClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {modalOpen.type === 'classEnrollment' && 'Class Enrollment Details'}
          {modalOpen.type === 'feeCategories' && 'Fee Category Details'}
          {modalOpen.type === 'facilities' && 'Facility Usage Details'}
          {modalOpen.type === 'routes' && 'Route Utilization Details'}
          {modalOpen.type === 'drivers' && 'Drivers Overview'}
          <IconButton sx={{ position: 'absolute', right: 8, top: 8 }} onClick={handleModalClose}>
            <ExpandMoreIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ height: 400, width: '100%' }}>
            {modalOpen.type === 'classEnrollment' && (
              <DataGrid rows={classEnrollmentRows} columns={classEnrollmentColumns} pageSizeOptions={[5, 10]} />
            )}
            {modalOpen.type === 'feeCategories' && (
              <DataGrid rows={feeCategoryRows} columns={feeCategoryColumns} pageSizeOptions={[5, 10]} />
            )}
            {modalOpen.type === 'facilities' && (
              <DataGrid rows={facilitiesUsageRows} columns={facilitiesUsageColumns} pageSizeOptions={[5, 10]} />
            )}
            {modalOpen.type === 'routes' && (
              <DataGrid rows={routeUtilizationRows} columns={routeUtilizationColumns} pageSizeOptions={[5, 10]} />
            )}
            {modalOpen.type === 'drivers' && (
              <DataGrid rows={driversOverviewRows} columns={driversOverviewColumns} pageSizeOptions={[5, 10]} />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleModalClose}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={alert.open} autoHideDuration={3000} onClose={handleCloseAlert}>
        <Alert onClose={handleCloseAlert} severity={alert.severity} sx={{ width: '100%' }}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Dashboard;