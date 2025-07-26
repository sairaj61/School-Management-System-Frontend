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
  TableRow
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

const HeaderCard = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  marginBottom: theme.spacing(3),
}));

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`student-tabpanel-${index}`}
    aria-labelledby={`student-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const StudentDetails = ({ student, onBack, onEdit }) => {
  const [tabValue, setTabValue] = useState(0);
  const [studentFacilities, setStudentFacilities] = useState([]);
  const [studentFixedFees, setStudentFixedFees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [facilityToDelete, setFacilityToDelete] = useState(null);

  useEffect(() => {
    if (student?.id) {
      fetchStudentFacilities();
      fetchStudentFixedFees();
    }
  }, [student?.id]);

  const fetchStudentFacilities = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `${appConfig.API_PREFIX_V1}/students-managements/student-fee-categories/${student.id}`
      );
      setStudentFacilities(response.data || []);
    } catch (error) {
      console.error('Error fetching student facilities:', error);
      showAlert('Failed to fetch student facilities', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentFixedFees = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `${appConfig.API_PREFIX_V1}/students-managements/student-fixed-fees/${student.id}`
      );
      setStudentFixedFees(response.data || []);
    } catch (error) {
      console.error('Error fetching student fixed fees:', error);
      showAlert('Failed to fetch student fixed fees', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFacility = async (facilityId) => {
    try {
      await axiosInstance.delete(
        `${appConfig.API_PREFIX_V1}/students-managements/student-fee-categories/${facilityId}`
      );
      showAlert('Facility removed successfully', 'success');
      fetchStudentFacilities();
      setDeleteDialogOpen(false);
      setFacilityToDelete(null);
    } catch (error) {
      console.error('Error deleting facility:', error);
      showAlert('Failed to remove facility', 'error');
    }
  };

  const showAlert = (message, severity = 'success') => {
    setAlert({ open: true, message, severity });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getStatusChip = (status) => {
    const statusColors = {
      ACTIVE: { color: 'success', label: 'Active' },
      INACTIVE: { color: 'error', label: 'Inactive' },
      DROPOUT: { color: 'warning', label: 'Dropout' },
    };
    
    const config = statusColors[status] || { color: 'default', label: status };
    
    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        variant="outlined"
      />
    );
  };

  const fixedFeesColumns = [
    { field: 'fee_category_name', headerName: 'Fee Category', width: 150 },
    { field: 'fee_description', headerName: 'Fee Name', width: 200 },
    { field: 'concession_amount', headerName: 'Concession', width: 120 },
    { field: 'actual_amount', headerName: 'Actual Amount', width: 120 },
    { field: 'created_at', headerName: 'Created At', width: 150 },
    { field: 'status', headerName: 'Status', width: 100 },
  ];

  const facilityColumns = [
    { field: 'fee_category_name', headerName: 'Facility Type', width: 150 },
    { field: 'start_date', headerName: 'Start Date', width: 120 },
    { field: 'end_date', headerName: 'End Date', width: 120 },
    { field: 'concession_amount', headerName: 'Concession', width: 120 },
    { field: 'amount', headerName: 'Fee Amount', width: 100 },
    { field: 'status', headerName: 'Status', width: 100 },
    { field: 'created_at', headerName: 'Created At', width: 150 },
  ];

  if (!student) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6">No student selected</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      {/* Header with Back Button */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={onBack} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Student Details
        </Typography>
      </Box>

      {/* Student Info Header */}
      <HeaderCard>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              mr: 3,
              bgcolor: 'rgba(255,255,255,0.2)',
              fontSize: '2rem'
            }}
          >
            {student.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
              {student.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="subtitle1">
                Roll No: {student.roll_number}
              </Typography>
              <Typography variant="subtitle1">
                Class: {student.class_name} - {student.section_name}
              </Typography>
              {getStatusChip(student.status)}
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Academic Year: {student.academic_year_name}
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
            Edit Student
          </Button>
        </Box>
      </HeaderCard>

      {/* Tabs */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'primary.main',
            '& .MuiTab-root': { color: 'white' },
            '& .Mui-selected': { color: 'white !important' },
            '& .MuiTabs-indicator': { bgcolor: 'white' }
          }}
        >
          <Tab label="Personal Information" />
          <Tab label="Fixed Fees" />
          <Tab label="Facilities" />
          <Tab label="Attendance" />
        </Tabs>

        {/* Personal Information Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <StyledCard>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <PersonIcon sx={{ mr: 1 }} />
                    Basic Information
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Father's Name"
                        secondary={student.father_name || 'N/A'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Mother's Name"
                        secondary={student.mother_name || 'N/A'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Date of Birth"
                        secondary={student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'N/A'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Gender"
                        secondary={student.gender || 'N/A'}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </StyledCard>
            </Grid>

            <Grid item xs={12} md={6}>
              <StyledCard>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <HomeIcon sx={{ mr: 1 }} />
                    Contact Information
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <EmailIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Email"
                        secondary={student.email || 'N/A'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <PhoneIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Phone"
                        secondary={student.phone_number || 'N/A'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <PhoneIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Emergency Contact"
                        secondary={student.emergency_contact_number || 'N/A'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <HomeIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Address"
                        secondary={student.address || 'N/A'}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </StyledCard>
            </Grid>

            <Grid item xs={12}>
              <StyledCard>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <SchoolIcon sx={{ mr: 1 }} />
                    Academic Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Previous School
                        </Typography>
                        <Typography variant="body1">
                          {student.old_school_name || 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={9}>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Medical History
                        </Typography>
                        <Typography variant="body1">
                          {student.medical_history || 'No medical history recorded'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </StyledCard>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Fixed Fees Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <PaymentIcon sx={{ mr: 1 }} />
              Fixed Fees
            </Typography>
          </Box>
          
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell>Fee Category</TableCell>
                  <TableCell>Fee Name</TableCell>
                  <TableCell align="right">Concession</TableCell>
                  <TableCell align="right">Actual Amount</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {studentFixedFees.map((fee, index) => (
                  <TableRow key={index} hover>
                    <TableCell>{fee.fee_category?.category_name || 'N/A'}</TableCell>
                    <TableCell>{fee.fee?.description || 'N/A'}</TableCell>
                    <TableCell align="right">
                      ₹{parseFloat(fee.concession_amount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                    </TableCell>
                    <TableCell align="right">
                      ₹{parseFloat((fee.amount || 0) - (fee.concession_amount || 0)).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                    </TableCell>
                    <TableCell>{new Date(fee.created_at).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell>{getStatusChip(fee.status)}</TableCell>
                  </TableRow>
                ))}
                {studentFixedFees.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No fixed fees found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Facilities Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <BusIcon sx={{ mr: 1 }} />
              Student Facilities
            </Typography>
          </Box>
          
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell>Facility Type</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell align="right">Concession</TableCell>
                  <TableCell align="right">Fee Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {studentFacilities.map((facility) => (
                  <TableRow key={facility.id} hover>
                    <TableCell>{facility.fee_category?.category_name || 'N/A'}</TableCell>
                    <TableCell>{new Date(facility.start_date).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell>{facility.end_date ? new Date(facility.end_date).toLocaleDateString('en-IN') : 'N/A'}</TableCell>
                    <TableCell align="right">
                      ₹{parseFloat(facility.concession_amount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                    </TableCell>
                    <TableCell align="right">
                      {facility.fee_category?.fees?.length > 0 
                        ? `₹${parseFloat(facility.fee_category.fees[0].amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}` 
                        : 'N/A'
                      }
                    </TableCell>
                    <TableCell>{getStatusChip(facility.status || 'ACTIVE')}</TableCell>
                    <TableCell>{new Date(facility.created_at).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Remove Facility">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => {
                            setFacilityToDelete(facility);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {studentFacilities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No facilities found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Attendance Tab */}
        <TabPanel value={tabValue} index={3}>
          <StudentAttendance studentId={student.id} />
        </TabPanel>
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove this facility? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => handleDeleteFacility(facilityToDelete?.id)}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alert Snackbar */}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, open: false })}
      >
        <Alert
          onClose={() => setAlert({ ...alert, open: false })}
          severity={alert.severity}
          sx={{ width: '100%' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StudentDetails;
