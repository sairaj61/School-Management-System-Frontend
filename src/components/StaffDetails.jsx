import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Avatar, Grid, Chip, IconButton, Tooltip, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Tabs, Tab,
  List, ListItem, ListItemIcon, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions,TextField
} from '@mui/material';
import {
  CloudUpload, Visibility, Download, Email, Phone, Home, School, Person, AttachFile, Work, CalendarToday, AccountBalance, ArrowBackIosNew, Paid, Close, Delete
} from '@mui/icons-material';
import appConfig from '../config/appConfig';
import axiosInstance from '../utils/axiosConfig';

const staffTypeColors = {
  TEACHING: 'primary',
  NON_TEACHING: 'success',
  ADMIN: 'warning',
  DRIVER: 'info',
  OTHER: 'default',
};

const defaultStaff = {
  id: '',
  name: '',
  staff_type: '',
  email: '',
  phone_number: '',
  address: '',
  qualification: '',
  date_of_joining: '',
  date_of_termination: null,
  profile_image: '',
};

const StaffDetails = () => {
  // CTC Component Types
  const CTC_COMPONENT_TYPES = [
    "Allowance",
    "Deduction",
    "Bonus",
    "Reimbursement",
    "Tax",
    "House Rent Allowance",
    "Basic Salary",
    "Medical Allowance",
    "Transport Allowance",
    "Other"
  ];

  // State for CTC component dialog
  const [openComponentDialog, setOpenComponentDialog] = useState(false);
  const [componentCtcId, setComponentCtcId] = useState(null);
  const [componentTotal, setComponentTotal] = useState(0);
  const [componentsForm, setComponentsForm] = useState([
    { name: '', amount: '', component_type: '' }
  ]);
  const [componentError, setComponentError] = useState('');

  // Handler for adding/removing component rows
  const addComponentRow = () => setComponentsForm([...componentsForm, { name: '', amount: '', component_type: '' }]);
  const removeComponentRow = idx => setComponentsForm(componentsForm.filter((_, i) => i !== idx));

  // Handler for changing component values
  const handleComponentChange = (idx, field, value) => {
    const updated = [...componentsForm];
    updated[idx][field] = value;
    // If name is empty, use type as name
    if (field === 'component_type' && !updated[idx].name) {
      updated[idx].name = value;
    }
    setComponentsForm(updated);
  };

  // Handler for submitting components
  const submitComponents = async () => {
    setComponentError('');
    // Validate sum
    const sum = componentsForm.reduce((acc, c) => acc + Number(c.amount), 0);
    if (sum !== Number(componentTotal)) {
      setComponentError(`Sum of all components (${sum}) must match total CTC (${componentTotal})`);
      return;
    }
    // Validate required fields
    for (const comp of componentsForm) {
      if (!comp.component_type || comp.amount === '' || comp.name === '') {
        setComponentError('All fields are required for each component.');
        return;
      }
    }
    try {
      await axiosInstance.post(`${appConfig.API_PREFIX_V1}/administrative/staff/ctc-structure/${componentCtcId}/components/bulk`, {
        components: componentsForm.map(c => ({
          name: c.name,
          amount: Number(c.amount),
          component_type: c.component_type
        }))
      });
      setOpenComponentDialog(false);
      setComponentsForm([{ name: '', amount: '', component_type: '' }]);
      // Refresh CTC history
      const ctcHistoryRes = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/administrative/staff/${staff.id}/ctc-structures`);
      setCtcHistory(ctcHistoryRes.data);
      // Refresh active CTC to reflect component updates in Overview tab
      try {
        const activeCtcRes = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/administrative/staff/${staff.id}/ctc-structure/active`);
        setActiveCTC(activeCtcRes.data);
      } catch (ctcErr) {
        setActiveCTC(null);
      }
    } catch (err) {
      setComponentError('Failed to create components.');
    }
  };

  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [staff, setStaff] = useState(defaultStaff);
  const [profileImage, setProfileImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeCTC, setActiveCTC] = useState(null);
  const [ctcHistory, setCtcHistory] = useState([]);
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [openSalaryDialog, setOpenSalaryDialog] = useState(false);
  const [openCtcDialog, setOpenCtcDialog] = useState(false);
  const [ctcForm, setCtcForm] = useState({ total_ctc: '', effective_from: '' });
  const [salaryForm, setSalaryForm] = useState({
    salary_month: new Date().toLocaleString('default', { month: 'long' }).toUpperCase(),
    payment_date: new Date().toISOString().split('T')[0],
    description: ''
  });
  const [payingSalary, setPayingSalary] = useState(false);
  const [loadingSalaryHistory, setLoadingSalaryHistory] = useState(false);
  const [activeAcademicYear, setActiveAcademicYear] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [monthlyAttendance, setMonthlyAttendance] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [openSelfieModal, setOpenSelfieModal] = useState(false);
  const [currentSelfieUrl, setCurrentSelfieUrl] = useState('');
  const [loadingSelfie, setLoadingSelfie] = useState(false);
  const [staffDocuments, setStaffDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [openDocumentModal, setOpenDocumentModal] = useState(false);
  const [currentDocumentUrl, setCurrentDocumentUrl] = useState('');
  const [currentDocumentName, setCurrentDocumentName] = useState('');
  const [currentDocumentId, setCurrentDocumentId] = useState('');

  // Get current academic year (April to March)
  const getCurrentAcademicYear = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11
    
    // If current month is April (4) or later, academic year is currentYear-(currentYear+1)
    // Otherwise, it's (currentYear-1)-currentYear
    if (currentMonth >= 4) {
      return `${currentYear}-${currentYear + 1}`;
    } else {
      return `${currentYear - 1}-${currentYear}`;
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      let timeoutId;
      try {
        // Set a timeout to avoid infinite loading
        timeoutId = setTimeout(() => {
          setLoading(false);
          console.error('API timeout: Backend may be down or endpoint misconfigured.');
        }, 10000); // 10 seconds

        // Staff details
        const staffRes = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/administrative/staff/${id}`);
        setStaff(staffRes.data);
        // Fetch profile photo URL
        try {
          const photoRes = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/administrative/staff/${id}/profile-photo`);
          setProfileImage(photoRes.data.profile_photo_url || '');
        } catch (photoErr) {
          console.error('Error fetching profile photo:', photoErr);
          setProfileImage(staffRes.data.profile_image || '');
        }
        // Active CTC
        try {
          const activeCtcRes = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/administrative/staff/${id}/ctc-structure/active`);
          setActiveCTC(activeCtcRes.data);
        } catch (ctcErr) {
          if (ctcErr?.response?.status === 404) {
            setActiveCTC(null);
          } else {
            console.error('Error fetching active CTC:', ctcErr);
            throw ctcErr;
          }
        }
        // CTC history
        const ctcHistoryRes = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/administrative/staff/${id}/ctc-structures`);
        setCtcHistory(ctcHistoryRes.data);
        
        // Salary payment records
        fetchSalaryHistory(staffRes.data.id);
        
        // Active academic year
        fetchActiveAcademicYear();
        
        // Attendance records
        fetchMonthlyAttendance(staffRes.data.id, selectedYear, selectedMonth);
        
        // Staff documents
        fetchStaffDocuments(staffRes.data.id);
      } catch (error) {
        console.error('Error in fetchAll:', error);
        setStaff(defaultStaff);
        setActiveCTC(null);
        setCtcHistory([]);
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };
    if (id) fetchAll();
  }, [id]);

  // Effect to fetch attendance when month/year changes
  useEffect(() => {
    if (staff.id && selectedMonth && selectedYear) {
      fetchMonthlyAttendance(staff.id, selectedYear, selectedMonth);
    }
  }, [selectedMonth, selectedYear, staff.id]);

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Ensure it's an image file
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Upload the file
      await axiosInstance.post(`${appConfig.API_PREFIX_V1}/administrative/staff/${staff.id}/profile-photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Fetch the updated profile photo URL
      const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/administrative/staff/${staff.id}/profile-photo`);
      setProfileImage(response.data.profile_photo_url || '');
    } catch (error) {
      console.error('Error uploading profile image:', error);
      alert('Failed to upload profile image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Fetch salary payment records
  const fetchSalaryHistory = async (staffId = staff.id) => {
    if (!staffId) {
      console.log('No staff ID available for fetching salary history');
      return;
    }

    try {
      setLoadingSalaryHistory(true);
      console.log('Fetching salary history for staff:', staffId);
      const apiUrl = `${appConfig.API_PREFIX_V1}/administrative/staff/payment/records/${staffId}`;
      console.log('API URL:', apiUrl);

      const response = await axiosInstance.get(apiUrl);
      console.log('Salary history API response:', response.data);

      // Ensure we have an array
      const historyData = Array.isArray(response.data) ? response.data : [];
      setSalaryHistory(historyData);
      console.log('✅ Salary history loaded:', historyData.length, 'records');
    } catch (error) {
      console.error('❌ Error fetching salary history:', error);
      console.error('Error details:', error.response?.data || error.message);
      setSalaryHistory([]);
    } finally {
      setLoadingSalaryHistory(false);
    }
  };

  // Fetch daily attendance records
  const fetchDailyAttendance = async (staffId) => {
    try {
      console.log('Fetching daily attendance for staff:', staffId);
      const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/administrative/staff/attendance/staff/${staffId}`);
      console.log('Daily attendance API response:', response.data);
      setAttendanceRecords(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching daily attendance:', error);
      setAttendanceRecords([]);
    }
  };

  // Fetch monthly attendance records
  const fetchMonthlyAttendance = async (staffId, year, month) => {
    try {
      setLoadingAttendance(true);
      console.log('Fetching monthly attendance for staff:', staffId, 'Year:', year, 'Month:', month);
      const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/administrative/staff/attendance/staff/${staffId}/month/${year}/${month}`);
      console.log('Monthly attendance API response:', response.data);
      const data = Array.isArray(response.data) ? response.data : [];
      setMonthlyAttendance(data);
    } catch (error) {
      console.error('Error fetching monthly attendance:', error);
      setMonthlyAttendance([]);
    } finally {
      setLoadingAttendance(false);
    }
  };

  // Fetch selfie URL for attendance record
  const fetchSelfieUrl = async (attendanceId) => {
    try {
      setLoadingSelfie(true);
      console.log('Fetching selfie URL for attendance ID:', attendanceId);
      const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/administrative/staff/attendance/${attendanceId}/selfie`);
      console.log('Selfie URL API response:', response.data);

      if (response.data && response.data.selfie_url) {
        setCurrentSelfieUrl(response.data.selfie_url);
        setOpenSelfieModal(true);
      } else {
        alert('Selfie URL not available for this attendance record.');
      }
    } catch (error) {
      console.error('Error fetching selfie URL:', error);
      alert('Failed to load selfie. Please try again.');
    } finally {
      setLoadingSelfie(false);
    }
  };

  // Document management functions
  const fetchStaffDocuments = async (staffId) => {
    try {
      setLoadingDocuments(true);
      console.log('Fetching documents for staff:', staffId);
      const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/administrative/user-file/owner/STAFF/${staffId}`);
      console.log('Staff documents API response:', response.data);
      setStaffDocuments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching staff documents:', error);
      setStaffDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const uploadDocument = async (file) => {
    try {
      setUploadingDocument(true);
      console.log('Uploading document:', file.name);

      const formData = new FormData();
      formData.append('owner_type', 'STAFF');
      formData.append('owner_id_uuid', staff.id);
      formData.append('file', file);

      const response = await axiosInstance.post(`${appConfig.API_PREFIX_V1}/administrative/user-file/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Upload response:', response.data);
      alert('Document uploaded successfully!');
      
      // Refresh documents list
      fetchStaffDocuments(staff.id);
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document. Please try again.');
    } finally {
      setUploadingDocument(false);
    }
  };

  const fetchDocumentUrl = async (documentId) => {
    try {
      console.log('Fetching document URL for ID:', documentId);
      const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/administrative/user-file/${documentId}/url`);
      console.log('Document URL API response:', response.data);

      if (response.data && response.data.file_url) {
        return response.data.file_url;
      } else {
        throw new Error('Document URL not available');
      }
    } catch (error) {
      console.error('Error fetching document URL:', error);
      throw error;
    }
  };

  const viewDocument = async (documentId, documentName) => {
    try {
      const documentUrl = await fetchDocumentUrl(documentId);
      setCurrentDocumentUrl(documentUrl);
      setCurrentDocumentName(documentName);
      setCurrentDocumentId(documentId);
      setOpenDocumentModal(true);
    } catch (error) {
      alert('Failed to load document. Please try again.');
    }
  };

  const downloadDocument = async (documentId, documentName) => {
    try {
      const documentUrl = await fetchDocumentUrl(documentId);
      
      // Use the same download method as selfie
      if (documentUrl.includes('s3.amazonaws.com') || documentUrl.includes('AWSAccessKeyId')) {
        // For S3 URLs, open in new tab to trigger download
        const link = document.createElement('a');
        link.href = documentUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // For regular URLs
        const link = document.createElement('a');
        link.href = documentUrl;
        link.download = documentName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download the document. Please try again.');
    }
  };

  const deleteDocument = async (documentId, documentName) => {
    if (!window.confirm(`Are you sure you want to delete "${documentName}"?`)) {
      return;
    }

    try {
      console.log('Deleting document:', documentId);
      const response = await axiosInstance.delete(`${appConfig.API_PREFIX_V1}/administrative/user-file/${documentId}`);
      console.log('Delete response:', response.data);
      
      alert('Document deleted successfully!');
      
      // Refresh documents list
      fetchStaffDocuments(staff.id);
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document. Please try again.');
    }
  };

  // Fetch active academic year
  const fetchActiveAcademicYear = async () => {
    try {
      console.log('🔄 Fetching active academic year from API...');
      const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/timetable/academic-years/active_academic_years`);
      console.log('📥 Academic year API response:', response.data);

      if (response.data && response.data.id) {
        const academicYear = response.data;
        setActiveAcademicYear(academicYear);
        console.log('✅ Active academic year loaded:', academicYear.year_name, 'ID:', academicYear.id);
        console.log('📤 Will include academic_year_id in salary payments:', academicYear.id);
      } else {
        console.log('⚠️ No active academic year found in API response');
        setActiveAcademicYear(null);
        console.log('📤 academic_year_id will be omitted from salary payments');
      }
    } catch (error) {
      console.error('❌ Error fetching active academic year:', error);
      console.error('📤 academic_year_id will be omitted from salary payments');
      setActiveAcademicYear(null);
    }
  };

  // Create salary payment
  const createSalaryPayment = async () => {
    if (!activeCTC || !activeCTC.components || activeCTC.components.length === 0) {
      alert('No active CTC structure with components found. Please create CTC components first.');
      return;
    }

    setPayingSalary(true);
    try {
      const totalPaid = activeCTC.components.reduce((sum, comp) => sum + parseFloat(comp.amount), 0);
      const breakdowns = activeCTC.components.map(comp => ({
        ctc_component_id: comp.id,
        amount_paid: parseFloat(comp.amount)
      }));

      const payload = {
        staff_id: staff.id,
        ctc_structure_id: activeCTC.id,
        salary_month: salaryForm.salary_month,
        payment_date: new Date(salaryForm.payment_date).toISOString(),
        total_paid: totalPaid,
        is_partial: false,
        description: salaryForm.description || 'Monthly salary payment',
        breakdowns: breakdowns
      };

      // Always include academic_year_id when available
      if (activeAcademicYear?.id) {
        payload.academic_year_id = activeAcademicYear.id;
        console.log('✅ Including academic_year_id:', activeAcademicYear.id);
      } else {
        console.warn('⚠️ No active academic year available, academic_year_id will be omitted');
      }

      console.log('Final salary payment payload:', payload);

      await axiosInstance.post(`${appConfig.API_PREFIX_V1}/administrative/staff/payment/record/`, payload);
      
      setOpenSalaryDialog(false);
      setSalaryForm({
        salary_month: new Date().toLocaleString('default', { month: 'long' }).toUpperCase(),
        payment_date: new Date().toISOString().split('T')[0],
        description: ''
      });
      
      // Refresh salary history
      fetchSalaryHistory(staff.id);
      
    } catch (error) {
      console.error('Error creating salary payment:', error);
      alert('Failed to create salary payment. Please try again.');
    } finally {
      setPayingSalary(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eef2f6' }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100vh', background: '#eef2f6', p: { xs: 2, md: 4 }, overflow: 'hidden' }}>
      <Card sx={{ p: { xs: 2, md: 4 }, borderRadius: 3, boxShadow: 6, position: 'relative', height: '100%' }}>
        {/* Back Button */}
        <Tooltip title="Go Back">
          <Button
            variant="outlined"
            startIcon={<ArrowBackIosNew />}
            onClick={() => navigate(-1)}
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              borderColor: 'primary.main',
              color: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.main',
                color: 'white',
                borderColor: 'primary.main',
              }
            }}
          >
            Back
          </Button>
        </Tooltip>

        <Box sx={{ display: 'flex', flexDirection: 'row', height: 'calc(100vh - 32px)' }}>
          {/* Sidebar: Staff Details */}
          <Box sx={{ width: { xs: '100%', md: '22%' }, minWidth: 220, maxWidth: 340, pr: { md: 3 }, borderRight: { md: '1px solid #e0e0e0' }, display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 2 }}>
            <Avatar src={profileImage} sx={{ width: 120, height: 120, bgcolor: 'primary.main', border: '3px solid', borderColor: 'primary.light', mb: 2 }}>
              <Person fontSize="large" sx={{ fontSize: 60 }} />
            </Avatar>
            <IconButton
              component="label"
              sx={{ position: 'relative', background: 'rgba(0,0,0,0.1)', color: 'primary.main', mb: 2 }}
              disabled={uploading}
            >
              {uploading ? <CircularProgress size={20} /> : <CloudUpload fontSize="small" />}
              <input type="file" hidden accept="image/*" onChange={handleProfileImageUpload} />
            </IconButton>
            <Typography variant="h5" fontWeight={700} color="text.primary" sx={{ mb: 1 }}>{staff.name}</Typography>
            <Chip
              label={staff.staff_type.replace('_', ' ')}
              color={staffTypeColors[staff.staff_type] || 'default'}
              sx={{ mb: 2, fontWeight: 600, fontSize: 14 }}
            />
            <Button variant="outlined" startIcon={<Email />} sx={{ mb: 1, width: '100%' }}>{staff.email}</Button>
            <Button variant="outlined" startIcon={<Phone />} sx={{ mb: 1, width: '100%' }}>{staff.phone_number}</Button>
            <Paper elevation={1} sx={{ p: 2, mt: 2, width: '100%' }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>Personal Info</Typography>
              <Box sx={{ maxHeight: 220, overflowY: 'auto' }}>
                <List dense sx={{ pr: 1, pb: 1, maxHeight: 320, overflowY: 'auto' }}>
                  <ListItem>
                    <ListItemIcon><School color="primary" /></ListItemIcon>
                    <ListItemText primary="Qualification" secondary={staff.qualification} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Home color="warning" /></ListItemIcon>
                    <ListItemText primary="Address" secondary={staff.address} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CalendarToday color="info" /></ListItemIcon>
                    <ListItemText primary="Date of Joining" secondary={staff.date_of_joining ? new Date(staff.date_of_joining).toLocaleDateString() : 'N/A'} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CalendarToday color="error" /></ListItemIcon>
                    <ListItemText primary="Date of Termination" secondary={staff.date_of_termination ? new Date(staff.date_of_termination).toLocaleDateString() : 'N/A'} />
                  </ListItem>
                </List>
              </Box>
            </Paper>
          </Box>

          {/* Main Content: Tabs and Panels */}
          <Box sx={{ flex: 1, pl: { md: 4 }, pt: 2, overflowY: 'auto' }}>
            <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 3 }}>
              <Tab label="Overview" icon={<Work />} iconPosition="start" />
              <Tab label="Salary Structure" icon={<Paid />} iconPosition="start" />
              <Tab label="Salary History" icon={<AccountBalance />} iconPosition="start" />
              <Tab label="Attendance" icon={<CalendarToday />} iconPosition="start" />
              <Tab label="Documents" icon={<AttachFile />} iconPosition="start" />
            </Tabs>
            {/* Tab Panels */}
            {tab === 0 && (
              <Grid container spacing={4} alignItems="flex-start">
                <Grid item xs={12} md={6}>
                  <Paper elevation={2} sx={{ p: 3, borderRadius: 2, display: 'flex', flexDirection: 'column', alignSelf: 'flex-start' }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>Personal Information</Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon><School color="primary" /></ListItemIcon>
                        <ListItemText primary="Qualification" secondary={staff.qualification} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><Home color="warning" /></ListItemIcon>
                        <ListItemText primary="Address" secondary={staff.address} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CalendarToday color="info" /></ListItemIcon>
                        <ListItemText primary="Date of Joining" secondary={staff.date_of_joining ? new Date(staff.date_of_joining).toLocaleDateString() : 'N/A'} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CalendarToday color="error" /></ListItemIcon>
                        <ListItemText primary="Date of Termination" secondary={staff.date_of_termination ? new Date(staff.date_of_termination).toLocaleDateString() : 'N/A'} />
                      </ListItem>
                    </List>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper elevation={2} sx={{ p: 3, borderRadius: 2, display: 'flex', flexDirection: 'column', alignSelf: 'flex-start', maxHeight: 500, overflowY: 'auto' }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>Active CTC Structure</Typography>
                    {activeCTC ? (
                      <>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                          <Typography variant="body1" sx={{ mb: 1 }}>Total CTC: <b>₹{parseFloat(activeCTC.total_ctc).toLocaleString()}</b></Typography>
                        </Box>
                        <Typography variant="body2" sx={{ mb: 1 }}>Effective From: {new Date(activeCTC.effective_from).toLocaleDateString()}</Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>Effective To: {activeCTC.effective_to ? new Date(activeCTC.effective_to).toLocaleDateString() : 'N/A'}</Typography>
                        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Components:</Typography>
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
                              {activeCTC.components.map(comp => (
                                <TableRow key={comp.id}>
                                  <TableCell>{comp.name}</TableCell>
                                  <TableCell>₹{parseFloat(comp.amount).toLocaleString()}</TableCell>
                                  <TableCell>{comp.component_type}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </>
                    ) : (
                      <Typography color="text.secondary">No active CTC structure found.</Typography>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            )}
            {tab === 1 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h5" fontWeight={700} color="primary">
                    CTC Structure History
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="contained" color="primary" onClick={() => setOpenCtcDialog(true)}>
                      Add Salary Structure
                    </Button>
                    {/* Terminate Active CTC Structure button, only if any active CTC exists */}
                    {ctcHistory.some(ctc => !ctc.effective_to) && (
                      <Button
                        variant="contained"
                        color="error"
                        onClick={async () => {
                          try {
                            await axiosInstance.post(`${appConfig.API_PREFIX_V1}/administrative/staff/${staff.id}/ctc-structure/terminate`);
                            // Refresh active CTC and history
                            try {
                              const activeCtcRes = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/administrative/staff/${staff.id}/ctc-structure/active`);
                              setActiveCTC(activeCtcRes.data);
                            } catch (ctcErr) {
                              setActiveCTC(null);
                            }
                            const ctcHistoryRes = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/administrative/staff/${staff.id}/ctc-structures`);
                            setCtcHistory(ctcHistoryRes.data);
                          } catch (err) {
                            // Optionally show error
                          }
                        }}
                      >
                        Terminate Active CTC Structure
                      </Button>
                    )}
                  </Box>
                </Box>
                {ctcHistory.length === 0 ? (
                  <Typography color="text.secondary">No CTC history found.</Typography>
                ) : (
                  <TableContainer component={Paper} sx={{ mt: 2, boxShadow: 2, borderRadius: 2 }}>
                    <Table>
                      <TableHead sx={{ backgroundColor: 'primary.light' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Total CTC</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Effective From</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Effective To</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Components</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {[...ctcHistory]
                          .sort((a, b) => {
                            // Put active (effective_to=null) at top
                            if (!a.effective_to && b.effective_to) return -1;
                            if (a.effective_to && !b.effective_to) return 1;
                            // Otherwise, sort by effective_from descending
                            return new Date(b.effective_from) - new Date(a.effective_from);
                          })
                          .map((ctc, idx, arr) => (
                            <TableRow key={ctc.id} hover>
                              <TableCell>₹{parseFloat(ctc.total_ctc).toLocaleString()}</TableCell>
                              <TableCell>{new Date(ctc.effective_from).toLocaleDateString()}</TableCell>
                              <TableCell>{ctc.effective_to ? new Date(ctc.effective_to).toLocaleDateString() : 'N/A'}</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                  <Table size="small" sx={{ mt: 1 }}>
                                    <TableHead>
                                      <TableRow>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Amount</TableCell>
                                        <TableCell>Type</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {ctc.components.map(comp => (
                                        <TableRow key={comp.id}>
                                          <TableCell>{comp.name}</TableCell>
                                          <TableCell>₹{parseFloat(comp.amount).toLocaleString()}</TableCell>
                                          <TableCell>{comp.component_type}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                  {/* Show create components button for any active CTC with no components (robust null check) */}
                                  {(ctc.effective_to == null && ctc.components.length === 0) && (
                                    <Button variant="outlined" color="primary" size="small" sx={{ mt: 1 }} onClick={() => {
                                      setOpenComponentDialog(true);
                                      setComponentCtcId(ctc.id);
                                      setComponentTotal(ctc.total_ctc);
                                    }}>Create CTC Components</Button>
                                  )}
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
                {/* Dialog for creating new CTC structure */}
                <Dialog open={openCtcDialog || false} onClose={() => setOpenCtcDialog(false)} fullWidth maxWidth="sm">
                  <DialogTitle>Add Salary Structure</DialogTitle>
                  <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField
                        label="Total CTC"
                        type="number"
                        value={ctcForm.total_ctc}
                        onChange={e => setCtcForm({ ...ctcForm, total_ctc: e.target.value })}
                        fullWidth
                      />
                      <TextField
                        label="Effective From"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        value={ctcForm.effective_from}
                        onChange={e => setCtcForm({ ...ctcForm, effective_from: e.target.value })}
                        fullWidth
                      />
                    </Box>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={() => setOpenCtcDialog(false)} color="secondary">Cancel</Button>
                    <Button variant="contained" onClick={async () => {
                      try {
                        await axiosInstance.post(`${appConfig.API_PREFIX_V1}/administrative/staff/ctc-structure/`, {
                          staff_id: staff.id,
                          total_ctc: parseFloat(ctcForm.total_ctc),
                          effective_from: ctcForm.effective_from,
                        });
                        setOpenCtcDialog(false);
                        setCtcForm({ total_ctc: '', effective_from: '' });
                        // Refresh CTC history
                        const ctcHistoryRes = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/administrative/staff/${staff.id}/ctc-structures`);
                        setCtcHistory(ctcHistoryRes.data);
                        // Refresh active CTC
                        try {
                          const activeCtcRes = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/administrative/staff/${staff.id}/ctc-structure/active`);
                          setActiveCTC(activeCtcRes.data);
                        } catch (ctcErr) {
                          setActiveCTC(null);
                        }
                      } catch (err) {
                        // Optionally show error
                      }
                    }}>Create</Button>
                  </DialogActions>
                </Dialog>
                {/* Dialog for creating CTC components */}
                <Dialog open={openComponentDialog || false} onClose={() => setOpenComponentDialog(false)} fullWidth maxWidth="md">
                  <DialogTitle>Create CTC Components</DialogTitle>
                  <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Typography variant="subtitle1">Total CTC: ₹{componentTotal}</Typography>
                      {componentsForm.map((row, idx) => (
                        <Box key={idx} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          <TextField
                            label="Component Name"
                            value={row.name}
                            onChange={e => handleComponentChange(idx, 'name', e.target.value)}
                            sx={{ flex: 2 }}
                          />
                          <TextField
                            label="Amount"
                            type="number"
                            value={row.amount}
                            onChange={e => handleComponentChange(idx, 'amount', e.target.value)}
                            sx={{ flex: 1 }}
                          />
                          <TextField
                            label="Type"
                            select
                            SelectProps={{ native: true }}
                            value={row.component_type}
                            onChange={e => handleComponentChange(idx, 'component_type', e.target.value)}
                            sx={{ flex: 2 }}
                          >
                            <option value="">Select Type</option>
                            {CTC_COMPONENT_TYPES.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </TextField>
                          <Button color="error" onClick={() => removeComponentRow(idx)} disabled={componentsForm.length === 1}>Remove</Button>
                        </Box>
                      ))}
                      <Button variant="outlined" onClick={addComponentRow} sx={{ mt: 1, width: 'fit-content' }}>Add Component</Button>
                      {componentError && <Typography color="error" sx={{ mt: 1 }}>{componentError}</Typography>}
                    </Box>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={() => setOpenComponentDialog(false)} color="secondary">Cancel</Button>
                    <Button variant="contained" onClick={submitComponents}>Submit Components</Button>
                  </DialogActions>
                </Dialog>
              </Box>
            )}
            {/* Salary History Tab */}
            {tab === 2 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h5" fontWeight={700} color="primary">
                    Salary Payment History
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="success" 
                    startIcon={<Paid />}
                    onClick={() => setOpenSalaryDialog(true)}
                    disabled={!activeCTC || !activeCTC.components || activeCTC.components.length === 0}
                  >
                    Pay Salary
                  </Button>
                </Box>
                
                {loadingSalaryHistory ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress size={40} />
                    <Typography sx={{ ml: 2 }}>Loading salary history...</Typography>
                  </Box>
                ) : salaryHistory.length === 0 ? (
                  <Typography color="text.secondary">No salary payment records found.</Typography>
                ) : (
                  <TableContainer component={Paper} sx={{ mt: 2, boxShadow: 2, borderRadius: 2 }}>
                    <Table>
                      <TableHead sx={{ backgroundColor: 'primary.light' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Month</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Payment Date</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Total Paid</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Breakdown</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {salaryHistory.map(record => (
                          <TableRow key={record.id} hover>
                            <TableCell>{record.salary_month}</TableCell>
                            <TableCell>{new Date(record.payment_date).toLocaleDateString()}</TableCell>
                            <TableCell>₹{parseFloat(record.total_paid || 0).toLocaleString()}</TableCell>
                            <TableCell>
                              <Chip
                                label={record.is_partial ? 'Partial' : 'Full'}
                                color={record.is_partial ? 'warning' : 'success'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{record.description || 'No description'}</TableCell>
                            <TableCell>
                              <Box>
                                {record.payment_breakdown && record.payment_breakdown.length > 0 ? (
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow>
                                        <TableCell>Component</TableCell>
                                        <TableCell>Amount</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {record.payment_breakdown.map(breakdown => (
                                        <TableRow key={breakdown.id}>
                                          <TableCell>
                                            {activeCTC?.components?.find(comp => comp.id === breakdown.ctc_component_id)?.name || 'Unknown Component'}
                                          </TableCell>
                                          <TableCell>₹{parseFloat(breakdown.amount_paid || 0).toLocaleString()}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">No breakdown available</Typography>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
                
                {/* Salary Payment Dialog */}
                <Dialog open={openSalaryDialog} onClose={() => setOpenSalaryDialog(false)} fullWidth maxWidth="md">
                  <DialogTitle>Pay Salary</DialogTitle>
                  <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Salary Payment for {staff.name}
                      </Typography>
                      
                      {activeCTC ? (
                        <>
                      <Typography variant="subtitle1" color="primary">
                        Active CTC: ₹{parseFloat(activeCTC.total_ctc).toLocaleString()}
                      </Typography>
                      <Typography variant="subtitle2" color="text.secondary">
                        Academic Year: {activeAcademicYear ? `${activeAcademicYear.year_name} (ID: ${activeAcademicYear.id})` : 'Not available (will be omitted)'}
                      </Typography>                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <TextField
                                label="Salary Month"
                                select
                                SelectProps={{ native: true }}
                                value={salaryForm.salary_month}
                                onChange={e => setSalaryForm({ ...salaryForm, salary_month: e.target.value })}
                                fullWidth
                              >
                                <option value="JANUARY">January</option>
                                <option value="FEBRUARY">February</option>
                                <option value="MARCH">March</option>
                                <option value="APRIL">April</option>
                                <option value="MAY">May</option>
                                <option value="JUNE">June</option>
                                <option value="JULY">July</option>
                                <option value="AUGUST">August</option>
                                <option value="SEPTEMBER">September</option>
                                <option value="OCTOBER">October</option>
                                <option value="NOVEMBER">November</option>
                                <option value="DECEMBER">December</option>
                              </TextField>
                            </Grid>
                            <Grid item xs={6}>
                              <TextField
                                label="Payment Date"
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                value={salaryForm.payment_date}
                                onChange={e => setSalaryForm({ ...salaryForm, payment_date: e.target.value })}
                                fullWidth
                              />
                            </Grid>
                          </Grid>
                          
                          <TextField
                            label="Description"
                            multiline
                            rows={2}
                            value={salaryForm.description}
                            onChange={e => setSalaryForm({ ...salaryForm, description: e.target.value })}
                            fullWidth
                            placeholder="Optional description for this payment"
                          />
                          
                          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                            Payment Breakdown
                          </Typography>
                          <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Component Name</TableCell>
                                  <TableCell>Type</TableCell>
                                  <TableCell>Amount</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {activeCTC.components.map(comp => (
                                  <TableRow key={comp.id}>
                                    <TableCell>{comp.name}</TableCell>
                                    <TableCell>{comp.component_type}</TableCell>
                                    <TableCell>₹{parseFloat(comp.amount).toLocaleString()}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                          
                          <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                            Total Amount: ₹{activeCTC.components.reduce((sum, comp) => sum + parseFloat(comp.amount), 0).toLocaleString()}
                          </Typography>
                        </>
                      ) : (
                        <Typography color="error">
                          No active CTC structure found. Please create a CTC structure first.
                        </Typography>
                      )}
                    </Box>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={() => setOpenSalaryDialog(false)} color="secondary">
                      Cancel
                    </Button>
                    <Button 
                      variant="contained" 
                      color="success" 
                      onClick={createSalaryPayment}
                      disabled={payingSalary || !activeCTC}
                      startIcon={payingSalary ? <CircularProgress size={20} /> : null}
                    >
                      {payingSalary ? 'Processing...' : 'Confirm Payment'}
                    </Button>
                  </DialogActions>
                </Dialog>
              </Box>
            )}

            {/* Selfie View Modal */}
            <Dialog
              open={openSelfieModal}
              onClose={() => setOpenSelfieModal(false)}
              maxWidth="md"
              fullWidth
            >
              <DialogTitle>
                Attendance Selfie
                <IconButton
                  onClick={() => setOpenSelfieModal(false)}
                  sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                  <Close />
                </IconButton>
              </DialogTitle>
              <DialogContent dividers>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                  {currentSelfieUrl ? (
                    <img
                      src={currentSelfieUrl}
                      alt="Attendance Selfie"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '400px',
                        objectFit: 'contain',
                        borderRadius: '8px'
                      }}
                    />
                  ) : (
                    <Typography>Loading image...</Typography>
                  )}
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenSelfieModal(false)} color="secondary">
                  Close
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Download />}
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = currentSelfieUrl;
                    link.download = `attendance-selfie-${Date.now()}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  disabled={!currentSelfieUrl}
                >
                  Download
                </Button>
              </DialogActions>
            </Dialog>

            {/* Document View Modal */}
            <Dialog
              open={openDocumentModal}
              onClose={() => setOpenDocumentModal(false)}
              maxWidth="lg"
              fullWidth
            >
              <DialogTitle>
                {currentDocumentName}
                <IconButton
                  onClick={() => setOpenDocumentModal(false)}
                  sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                  <Close />
                </IconButton>
              </DialogTitle>
              <DialogContent dividers>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 500 }}>
                  {currentDocumentUrl ? (
                    currentDocumentName.toLowerCase().endsWith('.pdf') ? (
                      <iframe
                        src={currentDocumentUrl}
                        style={{
                          width: '100%',
                          height: '500px',
                          border: 'none',
                          borderRadius: '8px'
                        }}
                        title={currentDocumentName}
                      />
                    ) : currentDocumentName.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i) ? (
                      <img
                        src={currentDocumentUrl}
                        alt={currentDocumentName}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '500px',
                          objectFit: 'contain',
                          borderRadius: '8px'
                        }}
                      />
                    ) : (
                      <Box sx={{ textAlign: 'center' }}>
                        <AttachFile sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                          Preview not available for this file type
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Click download to view the file
                        </Typography>
                      </Box>
                    )
                  ) : (
                    <Typography>Loading document...</Typography>
                  )}
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenDocumentModal(false)} color="secondary">
                  Close
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Download />}
                  onClick={() => downloadDocument(currentDocumentId, currentDocumentName)}
                  disabled={!currentDocumentUrl}
                >
                  Download
                </Button>
              </DialogActions>
            </Dialog>

            {/* Attendance Tab */}
            {tab === 3 && (
              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>Staff Attendance</Typography>
                
                {/* Month/Year Selector */}
                <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
                  <TextField
                    label="Year"
                    type="number"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    sx={{ width: 100 }}
                  />
                  <TextField
                    label="Month"
                    select
                    SelectProps={{ native: true }}
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    sx={{ width: 120 }}
                  >
                    <option value={1}>January</option>
                    <option value={2}>February</option>
                    <option value={3}>March</option>
                    <option value={4}>April</option>
                    <option value={5}>May</option>
                    <option value={6}>June</option>
                    <option value={7}>July</option>
                    <option value={8}>August</option>
                    <option value={9}>September</option>
                    <option value={10}>October</option>
                    <option value={11}>November</option>
                    <option value={12}>December</option>
                  </TextField>
                  <Button 
                    variant="contained" 
                    onClick={() => fetchMonthlyAttendance(staff.id, selectedYear, selectedMonth)}
                    disabled={loadingAttendance}
                  >
                    {loadingAttendance ? <CircularProgress size={20} /> : 'Load Attendance'}
                  </Button>
                </Box>
                
                {/* Attendance Summary */}
                {loadingAttendance ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress size={40} />
                  </Box>
                ) : (
                  <>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={3}>
                        <Card elevation={2} sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
                          <Typography variant="h4" fontWeight={700} color="success.dark">
                            {monthlyAttendance.filter(record => record.is_present).length}
                          </Typography>
                          <Typography variant="subtitle1" color="text.secondary">Present</Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={3}>
                        <Card elevation={2} sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light' }}>
                          <Typography variant="h4" fontWeight={700} color="error.dark">
                            {monthlyAttendance.filter(record => !record.is_present).length}
                          </Typography>
                          <Typography variant="subtitle1" color="text.secondary">Absent</Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={3}>
                        <Card elevation={2} sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light' }}>
                          <Typography variant="h4" fontWeight={700} color="warning.dark">
                            {monthlyAttendance.filter(record => record.location_verified).length}
                          </Typography>
                          <Typography variant="subtitle1" color="text.secondary">Location Verified</Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={3}>
                        <Card elevation={2} sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light' }}>
                          <Typography variant="h4" fontWeight={700} color="info.dark">
                            {monthlyAttendance.length}
                          </Typography>
                          <Typography variant="subtitle1" color="text.secondary">Total Records</Typography>
                        </Card>
                      </Grid>
                    </Grid>
                    
                    {/* Attendance Records Table */}
                    <Typography variant="subtitle1" gutterBottom>
                      Attendance Records for {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' })} {selectedYear}
                    </Typography>
                    {monthlyAttendance.length === 0 ? (
                      <Typography color="text.secondary">No attendance records found for this month.</Typography>
                    ) : (
                      <TableContainer component={Paper} sx={{ mt: 2, boxShadow: 2, borderRadius: 2 }}>
                        <Table>
                          <TableHead sx={{ backgroundColor: 'primary.light' }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>Time</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>Location Verified</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>Device</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>Remarks</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {monthlyAttendance.map(record => (
                              <TableRow key={record.id} hover>
                                <TableCell>{new Date(record.timestamp).toLocaleDateString()}</TableCell>
                                <TableCell>{new Date(record.timestamp).toLocaleTimeString()}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={record.is_present ? 'Present' : 'Absent'}
                                    color={record.is_present ? 'success' : 'error'}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={record.location_verified ? 'Verified' : 'Not Verified'}
                                    color={record.location_verified ? 'success' : 'warning'}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>{record.device_type} ({record.device_id})</TableCell>
                                <TableCell>{record.remarks || 'N/A'}</TableCell>
                                <TableCell>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => fetchSelfieUrl(record.id)}
                                    disabled={loadingSelfie}
                                    startIcon={loadingSelfie ? <CircularProgress size={16} /> : <Visibility />}
                                  >
                                    View Selfie
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </>
                )}
              </Box>
            )}

            {/* Files Tab */}
            {tab === 4 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight={600}>Staff Documents</Typography>
                  <Button
                    variant="contained"
                    component="label"
                    startIcon={uploadingDocument ? <CircularProgress size={20} /> : <CloudUpload />}
                    disabled={uploadingDocument}
                  >
                    {uploadingDocument ? 'Uploading...' : 'Upload Document'}
                    <input
                      type="file"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          uploadDocument(file);
                        }
                        // Reset input
                        e.target.value = '';
                      }}
                    />
                  </Button>
                </Box>

                {loadingDocuments ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress size={40} />
                    <Typography sx={{ ml: 2 }}>Loading documents...</Typography>
                  </Box>
                ) : staffDocuments.length === 0 ? (
                  <Typography color="text.secondary">No documents found for this staff member.</Typography>
                ) : (
                  <Grid container spacing={3}>
                    {staffDocuments.map(doc => (
                      <Grid item xs={12} sm={6} md={4} key={doc.id}>
                        <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                            <AttachFile color="action" />
                            <Typography variant="body1" fontWeight={500} sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {doc.filename}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Visibility />}
                              onClick={() => viewDocument(doc.id, doc.filename)}
                              sx={{ flex: 1 }}
                            >
                              View
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Download />}
                              onClick={() => downloadDocument(doc.id, doc.filename)}
                              sx={{ flex: 1 }}
                            >
                              Download
                            </Button>
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => deleteDocument(doc.id, doc.filename)}
                              sx={{ ml: 1 }}
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Card>
    </Box>
  );
}

export default StaffDetails;