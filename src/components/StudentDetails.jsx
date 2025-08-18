import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Avatar,
  Chip,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select, // <-- already present
  MenuItem, // <-- add this import
  TextField
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  School as SchoolIcon,
  CalendarToday as CalendarIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Payment as PaymentIcon,
  DirectionsBus as BusIcon,
  Restaurant as RestaurantIcon,
  LocalLibrary as LibraryIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { DataGrid } from '@mui/x-data-grid';
import axiosInstance from '../utils/axiosConfig';
import appConfig from '../config/appConfig';
import StudentAttendance from './StudentAttendance';

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
  },
}));

const StudentDetails = ({ student, onBack, onEdit }) => {
  const [tabValue, setTabValue] = useState(0);
  const [fixedFees, setFixedFees] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);

  // Add state for add facility modal and form
  const [addFacilityOpen, setAddFacilityOpen] = useState(false);
  const [optionalFees, setOptionalFees] = useState([]);
  const [concessionTypes, setConcessionTypes] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [facilityForm, setFacilityForm] = useState({
    fee_category_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    concession_type_id: '',
    concession_amount: 0,
    route_id: '',
    driver_id: ''
  });
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });

  // Fetch fixed fees and facilities when student changes
  useEffect(() => {
    if (!student?.id) return;
    setLoading(true);
    axiosInstance
      .get(`${appConfig.API_PREFIX_V1}/students-managements/students/${student.id}/fees`)
      .then((feesRes) => {
        // The API returns { student_details, fixed_fees }
        setFixedFees(Array.isArray(feesRes.data.fixed_fees) ? feesRes.data.fixed_fees : []);
      })
      .catch(() => {
        setFixedFees([]);
      })
      .finally(() => setLoading(false));

    // Facilities API is separate
    axiosInstance
      .get(`${appConfig.API_PREFIX_V1}/students-managements/students-facility/${student.id}/facilities`)
      .then((facilitiesRes) => {
        setFacilities(Array.isArray(facilitiesRes.data) ? facilitiesRes.data : []);
      })
      .catch(() => {
        setFacilities([]);
      });
  }, [student?.id]);

  // Fetch optional fees, concession types, routes, drivers when modal opens
  useEffect(() => {
    if (!addFacilityOpen || !student?.class_id) return;
    axiosInstance.get(`${appConfig.API_PREFIX_V1}/fees/by-class/${student.class_id}`)
      .then(res => setOptionalFees(res.data.filter(fee => fee.is_optional)))
      .catch(() => setOptionalFees([]));
    axiosInstance.get(`${appConfig.API_PREFIX_V1}/concessions-management/concession-types/`)
      .then(res => setConcessionTypes(res.data))
      .catch(() => setConcessionTypes([]));
    axiosInstance.get(`${appConfig.API_PREFIX_V1}/students-managements/transport/routes`)
      .then(res => setRoutes(res.data))
      .catch(() => setRoutes([]));
    axiosInstance.get(`${appConfig.API_PREFIX_V1}/students-managements/transport/drivers/`)
      .then(res => setDrivers(res.data))
      .catch(() => setDrivers([]));
    setFacilityForm({
      fee_category_id: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      concession_type_id: '',
      concession_amount: 0,
      route_id: '',
      driver_id: ''
    });
  }, [addFacilityOpen, student?.class_id]);

  // Columns for fixed fees
  const fixedFeesColumns = [
    { field: 'fee_category', headerName: 'Fee Category', width: 150, valueGetter: (params) => params.row.fee_category?.category_name || 'N/A' },
    { field: 'fee_description', headerName: 'Fee Name (Description)', width: 250, valueGetter: (params) => params.row.fee?.description || 'N/A' },
    { field: 'concession_amount', headerName: 'Concession Amt', width: 130, valueFormatter: (params) => `₹${parseFloat(params.value || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}` },
    { field: 'actual_amount', headerName: 'Actual Amount', width: 120, valueGetter: (params) => (params.row.amount || 0) - (params.row.concession_amount || 0), valueFormatter: (params) => `₹${parseFloat(params.value || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}` },
    { field: 'created_at', headerName: 'Created At', width: 150, valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString('en-IN') : 'N/A' },
    { field: 'status', headerName: 'Status', width: 100 },
  ];

  // Columns for facilities
  const facilityColumns = [
    { field: 'fee_category', headerName: 'Facility Type', width: 150, valueGetter: (params) => params.row.fee_category?.category_name || 'N/A' },
    { field: 'start_date', headerName: 'Start Date', width: 120, valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString('en-IN') : 'N/A' },
    { field: 'end_date', headerName: 'End Date', width: 120, valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString('en-IN') : 'N/A' },
    { field: 'concession_amount', headerName: 'Concession Amt', width: 130, valueFormatter: (params) => `₹${parseFloat(params.value || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}` },
    { field: 'amount', headerName: 'Fee Amount', width: 100, valueGetter: (params) => params.row.amount || (params.row.fee && params.row.fee.amount) || 'N/A', valueFormatter: (params) => params.value !== 'N/A' ? `₹${parseFloat(params.value).toLocaleString('en-IN', {minimumFractionDigits: 2})}` : 'N/A' },
    { field: 'status', headerName: 'Status', width: 100, valueGetter: (params) => params.row.status || 'N/A' },
    { field: 'created_at', headerName: 'Created At', width: 150, valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString('en-IN') : 'N/A' },
  ];

  // Helper: get fee category name
  const getFeeCategoryName = (fee_category_id) => {
    const fee = optionalFees.find(f => f.id === fee_category_id);
    return fee ? fee.fee_category?.category_name || 'N/A' : 'N/A';
  };

  // Helper: is selected facility transport
  const isFacilityTransport = (() => {
    const selectedFee = optionalFees.find(f => f.id === facilityForm.fee_category_id);
    if (!selectedFee) return false;
    return selectedFee.fee_category?.category_name === 'TRANSPORT';
  })();

  // Handle add facility form change
  const handleFacilityFormChange = (e) => {
    const { name, value } = e.target;
    setFacilityForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle add facility submit
  const handleAddFacility = async (e) => {
    e.preventDefault();
    const selectedFee = optionalFees.find(f => f.id === facilityForm.fee_category_id);
    if (!selectedFee) {
      setAlert({ open: true, message: 'Please select a facility.', severity: 'error' });
      return;
    }
    try {
      if (selectedFee.fee_category?.category_name === 'TRANSPORT') {
        // Transport assignment
        await axiosInstance.post(
          `${appConfig.API_PREFIX_V1}/students-managements/students-facility/${student.id}/transport-assignment`,
          {
            student_id: student.id,
            route_id: facilityForm.route_id,
            driver_id: facilityForm.driver_id,
            fee_categories_with_concession: {
              start_date: facilityForm.start_date,
              end_date: facilityForm.end_date || null,
              fee_category_id: selectedFee.fee_category_id,
              concession_type_id: facilityForm.concession_type_id || null,
              concession_amount: parseFloat(facilityForm.concession_amount) || 0
            }
          }
        );
      } else {
        // Generic facility
        await axiosInstance.post(
          `${appConfig.API_PREFIX_V1}/students-managements/students-facility/${student.id}/facilities`,
          {
            student_id: student.id,
            fee_categories_with_concession: [{
              start_date: facilityForm.start_date,
              end_date: facilityForm.end_date || null,
              fee_category_id: selectedFee.fee_category_id,
              concession_type_id: facilityForm.concession_type_id || null,
              concession_amount: parseFloat(facilityForm.concession_amount) || 0
            }]
          }
        );
      }
      setAlert({ open: true, message: 'Facility added successfully!', severity: 'success' });
      setAddFacilityOpen(false);
      // Refresh data
      axiosInstance
        .get(`${appConfig.API_PREFIX_V1}/students-managements/students-facility/${student.id}/facilities`)
        .then((facilitiesRes) => {
          setFacilities(Array.isArray(facilitiesRes.data) ? facilitiesRes.data : []);
        });
      axiosInstance
        .get(`${appConfig.API_PREFIX_V1}/students-managements/students/${student.id}/fees`)
        .then((feesRes) => {
          setFixedFees(Array.isArray(feesRes.data.fixed_fees) ? feesRes.data.fixed_fees : []);
        });
    } catch (error) {
      setAlert({ open: true, message: 'Failed to add facility.', severity: 'error' });
    }
  };

  if (!student) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6">No student selected</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Compact Header - Fixed Height */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        p: 2,
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <IconButton onClick={onBack} sx={{ color: 'white', mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Avatar sx={{ width: 50, height: 50, mr: 2, bgcolor: 'rgba(255,255,255,0.3)' }}>
          {student.name.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
            {student.name}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Roll No: {student.roll_number} • Class: {student.class_name} - {student.section_name} • Status: {student.status}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => onEdit(student)}
          sx={{ 
            bgcolor: 'rgba(255,255,255,0.2)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
          }}
        >
          Edit
        </Button>
      </Box>

      {/* Main Content Area - Horizontal Layout */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Sidebar - Personal Info (Fixed Width) */}
        <Box sx={{ 
          width: '350px', 
          bgcolor: 'grey.50', 
          p: 2, 
          overflowY: 'auto',
          borderRight: 1,
          borderColor: 'divider',
          flexShrink: 0
        }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <PersonIcon sx={{ mr: 1 }} />
            Personal Information
          </Typography>
          {/* Basic Info */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600, mb: 1 }}>
              Basic Details
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {/* Only show basic fields, not fees/facilities */}
              <Box>
                <Typography variant="caption" color="textSecondary">Date of Birth</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">Gender</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{student.gender || 'N/A'}</Typography>
              </Box>
            </Box>
          </Box>
          {/* Contact Info */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600, mb: 1 }}>
              Contact Details
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <EmailIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="caption" color="textSecondary">Email</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{student.email || 'N/A'}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PhoneIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="caption" color="textSecondary">Phone</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{student.phone_number || 'N/A'}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PhoneIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="caption" color="textSecondary">Emergency Contact</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{student.emergency_contact_number || 'N/A'}</Typography>
                </Box>
              </Box>
            </Box>
          </Box>
          {/* Address & Academic */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600, mb: 1 }}>
              Other Details
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box>
                <Typography variant="caption" color="textSecondary">Address</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{student.address || 'N/A'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">Previous School</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{student.old_school_name || 'N/A'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">Medical History</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{student.medical_history || 'None'}</Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Right Content Area - Tabs */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'white' }}>
            <Tabs
              value={tabValue}
              onChange={(e, v) => setTabValue(v)}
              sx={{ minHeight: '48px' }}
            >
              <Tab label="Fee Details" sx={{ minHeight: '48px' }} />
              <Tab label="Attendance" sx={{ minHeight: '48px' }} />
            </Tabs>
          </Box>
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            {/* Fee Details Tab */}
            {tabValue === 0 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>Fixed Fees</Typography>
                <Box sx={{ height: Math.min((fixedFees.length || 1) * 52 + 56, 300), width: '100%', mb: 4 }}>
                  <DataGrid
                    rows={fixedFees.map(fee => ({ ...fee, id: fee.id }))}
                    columns={fixedFeesColumns}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10, 20]}
                    disableSelectionOnClick
                    loading={loading}
                    getRowId={(row) => row.id}
                    sx={{
                      '& .MuiDataGrid-row:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                  />
                  {(!loading && fixedFees.length === 0) && (
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                      No fixed fees found for this student.
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Facilities</Typography>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => setAddFacilityOpen(true)}
                  >
                    Add Facility
                  </Button>
                </Box>
                <Box sx={{ height: Math.min((facilities.length || 1) * 52 + 56, 300), width: '100%' }}>
                  <DataGrid
                    rows={facilities.map(facility => ({
                      ...facility,
                      id: facility.id,
                      amount: facility.amount || (facility.fee && facility.fee.amount) || 'N/A',
                      concession_amount: facility.concession_amount || 0,
                      status: facility.status || 'ACTIVE'
                    }))}
                    columns={facilityColumns}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10, 20]}
                    disableSelectionOnClick
                    loading={loading}
                    getRowId={(row) => row.id}
                    sx={{
                      '& .MuiDataGrid-row:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                  />
                  {(!loading && facilities.length === 0) && (
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                      No facilities found for this student.
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
            {/* Attendance Tab */}
            {tabValue === 1 && (
              <Box sx={{ height: '100%' }}>
                <StudentAttendance studentId={student.id} />
              </Box>
            )}
          </Box>
        </Box>
      </Box>
      {/* Add Facility Modal */}
      <Dialog open={addFacilityOpen} onClose={() => setAddFacilityOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Add Facility for {student.name}
        </DialogTitle>
        <form onSubmit={handleAddFacility}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel id="facility-category-label">Select Facility (Optional Fee)</InputLabel>
                  <Select
                    labelId="facility-category-label"
                    name="fee_category_id"
                    value={facilityForm.fee_category_id}
                    onChange={handleFacilityFormChange}
                    label="Select Facility (Optional Fee)"
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {optionalFees.map((fee) => (
                      <MenuItem key={fee.id} value={fee.id}>
                        {fee.fee_category?.category_name || 'N/A'} (Amount: ₹{fee.amount})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  name="start_date"
                  type="date"
                  value={facilityForm.start_date}
                  onChange={handleFacilityFormChange}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="End Date (Optional)"
                  name="end_date"
                  type="date"
                  value={facilityForm.end_date}
                  onChange={handleFacilityFormChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="concession-type-label">Concession Type (Optional)</InputLabel>
                  <Select
                    labelId="concession-type-label"
                    name="concession_type_id"
                    value={facilityForm.concession_type_id}
                    onChange={handleFacilityFormChange}
                    label="Concession Type (Optional)"
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {concessionTypes.map((concession) => (
                      <MenuItem key={concession.id} value={concession.id}>
                        {concession.concession_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Concession Amount (Optional)"
                  name="concession_amount"
                  type="number"
                  value={facilityForm.concession_amount}
                  onChange={handleFacilityFormChange}
                  inputProps={{ min: 0, step: "0.01" }}
                />
              </Grid>
              {isFacilityTransport && (
                <>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel id="route-label">Transport Route</InputLabel>
                      <Select
                        labelId="route-label"
                        name="route_id"
                        value={facilityForm.route_id}
                        onChange={handleFacilityFormChange}
                        label="Transport Route"
                      >
                        <MenuItem value=""><em>None</em></MenuItem>
                        {routes.map((route) => (
                          <MenuItem key={route.id} value={route.id}>
                            {route.route_name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel id="driver-label">Assign Driver</InputLabel>
                      <Select
                        labelId="driver-label"
                        name="driver_id"
                        value={facilityForm.driver_id}
                        onChange={handleFacilityFormChange}
                        label="Assign Driver"
                      >
                        <MenuItem value=""><em>None</em></MenuItem>
                        {drivers.map((driver) => (
                          <MenuItem key={driver.id} value={driver.id}>
                            {driver.driver_name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddFacilityOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary" startIcon={<AddIcon />}>
              Add Facility
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
    </Box>
  );
};

export default StudentDetails;
