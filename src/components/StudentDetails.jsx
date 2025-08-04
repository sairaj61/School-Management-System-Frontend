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
              <Box>
                <Typography variant="caption" color="textSecondary">Father's Name</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{student.father_name || 'N/A'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">Mother's Name</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{student.mother_name || 'N/A'}</Typography>
              </Box>
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

        {/* Right Content Area - Tabbed Content */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Compact Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'white' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              sx={{ minHeight: '48px' }}
            >
              <Tab label="Fixed Fees" sx={{ minHeight: '48px' }} />
              <Tab label="Facilities" sx={{ minHeight: '48px' }} />
              <Tab label="Attendance" sx={{ minHeight: '48px' }} />
            </Tabs>
          </Box>

          {/* Tab Content */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            {/* Fixed Fees Tab */}
            {tabValue === 0 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <PaymentIcon sx={{ mr: 1 }} />
                  Fixed Fees
                </Typography>
                
                <TableContainer component={Paper} sx={{ borderRadius: 1 }}>
                  <Table size="small">
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
                          <TableCell>
                            <Chip
                              label={fee.status}
                              color={fee.status === 'ACTIVE' ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
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
              </Box>
            )}

            {/* Facilities Tab */}
            {tabValue === 1 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                    <BusIcon sx={{ mr: 1 }} />
                    Student Facilities
                  </Typography>
                </Box>
                
                <TableContainer component={Paper} sx={{ borderRadius: 1 }}>
                  <Table size="small">
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
                          <TableCell>
                            <Chip
                              label={facility.status || 'ACTIVE'}
                              color={facility.status === 'ACTIVE' ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
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
              </Box>
            )}

            {/* Attendance Tab */}
            {tabValue === 2 && (
              <Box sx={{ height: '100%' }}>
                <StudentAttendance studentId={student.id} />
              </Box>
            )}
          </Box>
        </Box>
      </Box>

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
