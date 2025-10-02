import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Avatar, Grid, Chip, IconButton, Tooltip, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Tabs, Tab,
  List, ListItem, ListItemIcon, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Alert, Snackbar
} from '@mui/material';
import {
  Person, Email, Phone, Home, School, CalendarToday, Edit, Delete, Add, Payment, DirectionsBus, Restaurant, LocalLibrary, ArrowBackIosNew, CloudUpload, Visibility, Download, AttachFile, Work
} from '@mui/icons-material';
import axiosInstance from '../utils/axiosConfig';
import { validatePhoneNumber } from '../utils/errorHandler';
import appConfig from '../config/appConfig';
import StudentAttendance from './StudentAttendance';

const StudentDetails = ({ student, onBack, onEdit }) => {
  // Add Parent Modal State
  const [addParentModalOpen, setAddParentModalOpen] = useState(false);
  const [newParentForm, setNewParentForm] = useState({
    name: '',
    email: '',
    phone_number: '',
    address: '',
    gender: '',
    occupation: '',
    relationship: '',
  });
  const [addParentLoading, setAddParentLoading] = useState(false);
  const [addParentError, setAddParentError] = useState('');

  const handleNewParentInputChange = (e) => {
    const { name, value } = e.target;
    setNewParentForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddParentSubmit = async () => {
    if (!validatePhoneNumber(newParentForm.phone_number)) {
      setAddParentError('Invalid phone number.');
      return;
    }
    if (!student?.id) {
      setAddParentError('No student selected.');
      return;
    }
    setAddParentLoading(true);
    setAddParentError('');
    try {
      const payload = { ...newParentForm, student_id: student.id };
      await axiosInstance.post(
        `${appConfig.API_PREFIX_V1}/students-managements/parents/`,
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );
      setAddParentModalOpen(false);
      setNewParentForm({ name: '', email: '', phone_number: '', address: '', gender: '', occupation: '', relationship: '' });
      // Refetch parent details
      const studentRes = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/students-managements/students/student-with-parent-details/${student.id}`);
      setParentDetails(Array.isArray(studentRes.data.parent_details) ? studentRes.data.parent_details : []);
    } catch (err) {
      setAddParentError('Failed to add parent.');
    } finally {
      setAddParentLoading(false);
    }
  };
  // State for edit parent form
  const [editParentLoading, setEditParentLoading] = useState(false);
  const [editParentError, setEditParentError] = useState('');

  // Handle parent field change
  const handleEditParentChange = (e) => {
    const { name, value } = e.target;
    setEditParentData(prev => ({ ...prev, [name]: value }));
  };

  // Update parent API call
  const handleUpdateParent = async () => {
    if (!editParentData?.parent_id) {
      setEditParentError('Parent ID missing. Cannot update.');
      return;
    }
    if (!validatePhoneNumber(editParentData.phone_number)) {
      setEditParentError('Invalid phone number. Please enter a valid Indian mobile number.');
      return;
    }
    setEditParentLoading(true);
    setEditParentError('');
    try {
      console.log('PUT payload:', editParentData);
      const response = await axiosInstance.put(
        `${appConfig.API_PREFIX_V1}/students-managements/parents/${editParentData.parent_id}`,
        editParentData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('PUT response:', response);
      // Refetch parent details
      const studentRes = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/students-managements/students/student-with-parent-details/${student.id}`);
      setParentDetails(Array.isArray(studentRes.data.parent_details) ? studentRes.data.parent_details : []);
      setEditParentModalOpen(false);
    } catch (err) {
      console.error('PUT error:', err);
      let msg = 'Failed to update parent.';
      if (err.response && err.response.data) {
        msg = err.response.data.detail || err.response.data.message || msg;
      }
      setEditParentError(msg);
    } finally {
      setEditParentLoading(false);
    }
  };
  const [tab, setTab] = useState(0);
  const [fixedFees, setFixedFees] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [profileImage, setProfileImage] = useState('');

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

  // Document management states
  const [studentDocuments, setStudentDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [openDocumentModal, setOpenDocumentModal] = useState(false);
  const [currentDocumentUrl, setCurrentDocumentUrl] = useState('');
  const [currentDocumentName, setCurrentDocumentName] = useState('');
  const [currentDocumentId, setCurrentDocumentId] = useState('');

  // Add state for parent details
  const [parentDetails, setParentDetails] = useState([]);
  // State for editing parent
  const [editParentModalOpen, setEditParentModalOpen] = useState(false);
  const [editParentData, setEditParentData] = useState(null);

  // Document management functions
  const fetchStudentDocuments = async (studentId) => {
    try {
      setLoadingDocuments(true);
      console.log('Fetching documents for student:', studentId);
      const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/user-file/owner/STUDENT/${studentId}`);
      console.log('Student documents API response:', response.data);
      setStudentDocuments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching student documents:', error);
      setStudentDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const uploadDocument = async (file) => {
    if (!student?.id) {
      setAlert({ open: true, message: 'Student ID missing. Cannot upload.', severity: 'error' });
      return;
    }
    try {
      setUploadingDocument(true);
      console.log('Uploading document:', file.name);

      const formData = new FormData();
      formData.append('owner_type', 'STUDENT');
      formData.append('owner_id_uuid', student.id);
      formData.append('file', file);

      const response = await axiosInstance.post(`${appConfig.API_PREFIX_V1}/user-file/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Upload response:', response.data);
      // Refresh documents list and wait for it to complete so UI updates immediately
      await fetchStudentDocuments(student.id);
      setAlert({ open: true, message: 'Document uploaded successfully!', severity: 'success' });
    } catch (error) {
      console.error('Error uploading document:', error);
      setAlert({ open: true, message: 'Failed to upload document. Please try again.', severity: 'error' });
    } finally {
      setUploadingDocument(false);
    }
  };

  const fetchDocumentUrl = async (documentId) => {
    try {
      console.log('Fetching document URL for ID:', documentId);
      const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/user-file/${documentId}/url`);
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
      
      // For S3 URLs, open in new tab to trigger download
      if (documentUrl.includes('s3.amazonaws.com') || documentUrl.includes('AWSAccessKeyId')) {
        const link = document.createElement('a');
        link.href = documentUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
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
      const response = await axiosInstance.delete(`${appConfig.API_PREFIX_V1}/user-file/${documentId}`);
      console.log('Delete response:', response.data);
      
      // Refresh documents list and wait for completion so UI updates immediately
      await fetchStudentDocuments(student.id);
      setAlert({ open: true, message: 'Document deleted successfully!', severity: 'success' });
    } catch (error) {
      console.error('Error deleting document:', error);
      setAlert({ open: true, message: 'Failed to delete document. Please try again.', severity: 'error' });
    }
  };

  // Fetch fixed fees, facilities, and documents when student changes
  useEffect(() => {
    if (!student?.id) return;
    setLoading(true);
    
    // Fetch student with parent details
    axiosInstance
      .get(`${appConfig.API_PREFIX_V1}/students-managements/students/student-with-parent-details/${student.id}`)
      .then((studentRes) => {
        setParentDetails(Array.isArray(studentRes.data.parent_details) ? studentRes.data.parent_details : []);
      })
      .catch(() => {
        setParentDetails([]);
      });

    // Fetch profile photo URL
    axiosInstance
      .get(`${appConfig.API_PREFIX_V1}/students-managements/students/${student.id}/profile-photo`)
      .then((photoRes) => {
        setProfileImage(photoRes.data.profile_photo_url || '');
      })
      .catch(() => {
        setProfileImage(student.profile_image || '');
      });

    // Fetch fixed fees
    axiosInstance
      .get(`${appConfig.API_PREFIX_V1}/students-managements/students/${student.id}/fees`)
      .then((feesRes) => {
        setFixedFees(Array.isArray(feesRes.data.fixed_fees) ? feesRes.data.fixed_fees : []);
      })
      .catch(() => {
        setFixedFees([]);
      })
      .finally(() => setLoading(false));

    // Fetch facilities
    axiosInstance
      .get(`${appConfig.API_PREFIX_V1}/students-managements/students-facility/${student.id}/facilities`)
      .then((facilitiesRes) => {
        setFacilities(Array.isArray(facilitiesRes.data) ? facilitiesRes.data : []);
      })
      .catch(() => {
        setFacilities([]);
      });

    // Fetch documents
    fetchStudentDocuments(student.id);

    // Fetch concession types
    axiosInstance
      .get(`${appConfig.API_PREFIX_V1}/concessions-management/concession-types/`)
      .then((concessionRes) => {
        setConcessionTypes(Array.isArray(concessionRes.data) ? concessionRes.data : []);
      })
      .catch(() => {
        setConcessionTypes([]);
      });

    // Fetch routes
    axiosInstance
      .get(`${appConfig.API_PREFIX_V1}/students-managements/transport/routes`)
      .then((routesRes) => {
        setRoutes(Array.isArray(routesRes.data) ? routesRes.data : []);
      })
      .catch(() => {
        setRoutes([]);
      });

    // Fetch drivers
    axiosInstance
      .get(`${appConfig.API_PREFIX_V1}/students-managements/transport/drivers/`)
      .then((driversRes) => {
        setDrivers(Array.isArray(driversRes.data) ? driversRes.data : []);
      })
      .catch(() => {
        setDrivers([]);
      });

    // Fetch optional fees by class
    if (student.class_id) {
      axiosInstance
        .get(`${appConfig.API_PREFIX_V1}/fees/by-class/${student.class_id}`)
        .then((feesRes) => {
          setOptionalFees(feesRes.data.filter(fee => fee.is_optional));
        })
        .catch(() => {
          setOptionalFees([]);
        });
    }
  }, [student?.id]);

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
      await axiosInstance.post(`${appConfig.API_PREFIX_V1}/students-managements/students/${student.id}/profile-photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Fetch the updated profile photo URL
      const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/students-managements/students/${student.id}/profile-photo`);
      setProfileImage(response.data.profile_photo_url || '');
    } catch (error) {
      console.error('Error uploading profile image:', error);
      alert('Failed to upload profile image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

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
      <Box sx={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eef2f6' }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eef2f6' }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ width: '100%', maxWidth: '100%', height: '100vh', background: '#eef2f6', p: { xs: 2, md: 4 }, overflow: 'hidden' }}>
        {/* Edit Parent Modal */}
        <Dialog open={editParentModalOpen} onClose={() => setEditParentModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Parent Details</DialogTitle>
          <DialogContent dividers>
            {editParentError && <Alert severity="error" sx={{ mb: 2 }}>{editParentError}</Alert>}
            {editParentData && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField label="Name" name="name" fullWidth value={editParentData.name || ''} onChange={handleEditParentChange} />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Email" name="email" fullWidth value={editParentData.email || ''} onChange={handleEditParentChange} />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Phone Number" name="phone_number" fullWidth value={editParentData.phone_number || ''} onChange={handleEditParentChange} />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Address" name="address" fullWidth value={editParentData.address || ''} onChange={handleEditParentChange} />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Gender</InputLabel>
                    <Select name="gender" value={editParentData.gender || ''} label="Gender" onChange={handleEditParentChange}>
                      <MenuItem value="MALE">Male</MenuItem>
                      <MenuItem value="FEMALE">Female</MenuItem>
                      <MenuItem value="OTHER">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Occupation" name="occupation" fullWidth value={editParentData.occupation || ''} onChange={handleEditParentChange} />
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditParentModalOpen(false)} color="secondary">Cancel</Button>
            <Button onClick={handleUpdateParent} color="primary" variant="contained" disabled={editParentLoading}>
              {editParentLoading ? <CircularProgress size={20} /> : 'Update'}
            </Button>
          </DialogActions>
        </Dialog>
        <Card sx={{ p: { xs: 2, md: 4 }, borderRadius: 3, boxShadow: 6, position: 'relative', height: '100%', width: '100%', maxWidth: '100%' }}>
          {/* Back Button */}
          <Tooltip title="Go Back">
            <Button
              variant="outlined"
              startIcon={<ArrowBackIosNew />}
              onClick={onBack}
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
            {/* Sidebar: Student Details */}
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
              <Typography variant="h5" fontWeight={700} color="text.primary" sx={{ mb: 1 }}>{student.name}</Typography>
              <Chip
                label={`${student.class_name} - ${student.section_name}`}
                color="primary"
                sx={{ mb: 2, fontWeight: 600, fontSize: 14 }}
              />
              <Chip
                label={student.status}
                color={student.status === 'ACTIVE' ? 'success' : 'error'}
                sx={{ mb: 2, fontWeight: 600, fontSize: 14 }}
              />
              <Button variant="outlined" startIcon={<Email />} sx={{ mb: 1, width: '100%' }}>{student.email}</Button>
              <Button variant="outlined" startIcon={<Phone />} sx={{ mb: 1, width: '100%' }}>{student.phone_number}</Button>
              <Paper elevation={1} sx={{ p: 2, mt: 2, width: '100%' }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Personal Info</Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon><School color="primary" /></ListItemIcon>
                    <ListItemText primary="Roll Number" secondary={student.roll_number} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CalendarToday color="warning" /></ListItemIcon>
                    <ListItemText primary="Date of Birth" secondary={student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'N/A'} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Person color="info" /></ListItemIcon>
                    <ListItemText primary="Gender" secondary={student.gender || 'N/A'} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Home color="success" /></ListItemIcon>
                    <ListItemText primary="Address" secondary={student.address || 'N/A'} />
                  </ListItem>
                </List>
              </Paper>
            </Box>

            {/* Main Content: Tabs and Panels */}
            <Box sx={{ flex: 1, pl: { md: 4 }, pt: 2, overflowY: 'auto' }}>
              <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 3 }}>
                <Tab label="Overview" icon={<Person />} iconPosition="start" />
                <Tab label="Payments" icon={<Payment />} iconPosition="start" />
                <Tab label="Attendance" icon={<CalendarToday />} iconPosition="start" />
                <Tab label="Uploads" icon={<AttachFile />} iconPosition="start" />
                <Tab label="Facility Enrolled" icon={<Work />} iconPosition="start" />
              </Tabs>

              {/* Tab Panels */}
              {tab === 0 && (
                <Grid container spacing={4}>
                  <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 2, borderRadius: 2, height: '100%', minHeight: 260, display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="h6" fontWeight={600} gutterBottom>Parent Information</Typography>
                      <Button variant="contained" color="primary" sx={{ mb: 2 }} onClick={() => setAddParentModalOpen(true)}>
                        Add New Parent
                      </Button>
                      <Dialog open={addParentModalOpen} onClose={() => setAddParentModalOpen(false)} maxWidth="sm" fullWidth>
                        <DialogTitle>Add New Parent</DialogTitle>
                        <DialogContent dividers>
                          {addParentError && <Alert severity="error" sx={{ mb: 2 }}>{addParentError}</Alert>}
                          <Grid container spacing={2}>
                            <Grid item xs={12}>
                              <TextField label="Name" name="name" fullWidth value={newParentForm.name} onChange={handleNewParentInputChange} />
                            </Grid>
                            <Grid item xs={12}>
                              <TextField label="Email" name="email" fullWidth value={newParentForm.email} onChange={handleNewParentInputChange} />
                            </Grid>
                            <Grid item xs={12}>
                              <TextField label="Phone Number" name="phone_number" fullWidth value={newParentForm.phone_number} onChange={handleNewParentInputChange} />
                            </Grid>
                            <Grid item xs={12}>
                              <TextField label="Address" name="address" fullWidth value={newParentForm.address} onChange={handleNewParentInputChange} />
                            </Grid>
                            <Grid item xs={12}>
                              <FormControl fullWidth>
                                <InputLabel>Gender</InputLabel>
                                <Select name="gender" value={newParentForm.gender} label="Gender" onChange={handleNewParentInputChange}>
                                  <MenuItem value="MALE">Male</MenuItem>
                                  <MenuItem value="FEMALE">Female</MenuItem>
                                  <MenuItem value="OTHER">Other</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                              <TextField label="Occupation" name="occupation" fullWidth value={newParentForm.occupation} onChange={handleNewParentInputChange} />
                            </Grid>
                            <Grid item xs={12}>
                              <FormControl fullWidth>
                                <InputLabel>Relationship</InputLabel>
                                <Select name="relationship" value={newParentForm.relationship} label="Relationship" onChange={handleNewParentInputChange}>
                                  <MenuItem value="Father">Father</MenuItem>
                                  <MenuItem value="Mother">Mother</MenuItem>
                                  <MenuItem value="Guardian">Guardian</MenuItem>
                                  <MenuItem value="Other">Other</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                          </Grid>
                        </DialogContent>
                        <DialogActions>
                          <Button onClick={() => setAddParentModalOpen(false)} color="secondary">Cancel</Button>
                          <Button onClick={handleAddParentSubmit} color="primary" variant="contained" disabled={addParentLoading}>
                            {addParentLoading ? <CircularProgress size={20} /> : 'Add Parent'}
                          </Button>
                        </DialogActions>
                      </Dialog>
                      {parentDetails.length === 0 ? (
                        <Typography color="text.secondary">No parent details available.</Typography>
                      ) : (
                        <Box sx={{ overflowY: 'auto', flex: 1 }}>
                          <Grid container spacing={2}>
                            {parentDetails.map((parent, index) => (
                              <Grid item xs={12} key={index}>
                                <Card sx={{ p: 2, borderRadius: 2, boxShadow: 1, position: 'relative' }}>
                                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                    {parent.name} ({parent.relationship_to_student})
                                  </Typography>
                                  <Grid container spacing={1}>
                                    <Grid item xs={12} sm={6}>
                                      <Typography variant="body2" color="text.secondary">
                                        <strong>Email:</strong> {parent.email}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                      <Typography variant="body2" color="text.secondary">
                                        <strong>Phone:</strong> {parent.phone_number}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                      <Typography variant="body2" color="text.secondary">
                                        <strong>Gender:</strong> {parent.gender}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                      <Typography variant="body2" color="text.secondary">
                                        <strong>Occupation:</strong> {parent.occupation || 'N/A'}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                      <Typography variant="body2" color="text.secondary">
                                        <strong>Address:</strong> {parent.address}
                                      </Typography>
                                    </Grid>
                                  </Grid>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<Edit />}
                                    sx={{ position: 'absolute', top: 8, right: 8 }}
                                    onClick={() => {
                                      console.log('Edit button clicked for parent:', parent);
                                      setEditParentData({ ...parent, parent_id: parent.parent_id });
                                      setEditParentModalOpen(true);
                                    }}
                                  >
                                    Edit
                                  </Button>
                                </Card>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%', minHeight: 260, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <Typography variant="h6" fontWeight={600} gutterBottom>Academic Information</Typography>
                      <List dense>
                        <ListItem>
                          <ListItemIcon><School color="primary" /></ListItemIcon>
                          <ListItemText primary="Class" secondary={`${student.class_name} - ${student.section_name}`} />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><CalendarToday color="warning" /></ListItemIcon>
                          <ListItemText primary="Enrollment Date" secondary={student.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString() : 'N/A'} />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><Person color="info" /></ListItemIcon>
                          <ListItemText primary="Previous School" secondary={student.old_school_name || 'N/A'} />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><Home color="success" /></ListItemIcon>
                          <ListItemText primary="Medical History" secondary={student.medical_history || 'None'} />
                        </ListItem>
                      </List>
                    </Paper>
                  </Grid>
                </Grid>
              )}
              {tab === 1 && (
                <Box>
                  <Typography variant="h5" fontWeight={700} color="primary" gutterBottom>
                    Fee Details & Payments
                  </Typography>
                  {fixedFees.length === 0 ? (
                    <Typography color="text.secondary">No fee details found.</Typography>
                  ) : (
                    <TableContainer component={Paper} sx={{ mt: 2, boxShadow: 2, borderRadius: 2 }}>
                      <Table>
                        <TableHead sx={{ backgroundColor: 'primary.light' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Fee Category</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Fee Name</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Concession</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Net Amount</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Created At</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {fixedFees.map(fee => (
                            <TableRow key={fee.id} hover>
                              <TableCell>{fee.fee_category?.category_name || 'N/A'}</TableCell>
                              <TableCell>{fee.fee?.description || 'N/A'}</TableCell>
                              <TableCell>₹{parseFloat(fee.amount || 0).toLocaleString()}</TableCell>
                              <TableCell>₹{parseFloat(fee.concession_amount || 0).toLocaleString()}</TableCell>
                              <TableCell>₹{parseFloat((fee.amount || 0) - (fee.concession_amount || 0)).toLocaleString()}</TableCell>
                              <TableCell>
                                <Chip
                                  label={fee.status || 'ACTIVE'}
                                  color={fee.status === 'ACTIVE' ? 'success' : 'warning'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>{fee.created_at ? new Date(fee.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}
              {tab === 2 && (
                <Box>
                  <Typography variant="h5" fontWeight={700} color="primary" gutterBottom>
                    Student Attendance
                  </Typography>
                  <StudentAttendance studentId={student.id} />
                </Box>
              )}
              {tab === 3 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight={600}>Student Documents</Typography>
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
                  ) : studentDocuments.length === 0 ? (
                    <Typography color="text.secondary">No documents found for this student.</Typography>
                  ) : (
                    <Grid container spacing={3}>
                      {studentDocuments.map(doc => (
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
              {tab === 4 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" fontWeight={700} color="primary">
                      Facilities Enrolled
                    </Typography>
                    <Button variant="contained" color="primary" startIcon={<Add />} onClick={() => setAddFacilityOpen(true)}>
                      Add Facility
                    </Button>
                  </Box>
                  {facilities.length === 0 ? (
                    <Typography color="text.secondary">No facilities enrolled.</Typography>
                  ) : (
                    <TableContainer component={Paper} sx={{ mt: 2, boxShadow: 2, borderRadius: 2 }}>
                      <Table>
                        <TableHead sx={{ backgroundColor: 'primary.light' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Facility Type</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Start Date</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>End Date</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Concession</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Net Amount</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {facilities.map(facility => (
                          <TableRow key={facility.id} hover>
                            <TableCell>{facility.fee_category?.category_name || 'N/A'}</TableCell>
                            <TableCell>{facility.start_date ? new Date(facility.start_date).toLocaleDateString() : 'N/A'}</TableCell>
                            <TableCell>{facility.end_date ? new Date(facility.end_date).toLocaleDateString() : 'N/A'}</TableCell>
                            <TableCell>₹{parseFloat(facility.amount || facility.fee?.amount || 0).toLocaleString()}</TableCell>
                            <TableCell>₹{parseFloat(facility.concession_amount || 0).toLocaleString()}</TableCell>
                            <TableCell>₹{parseFloat((facility.amount || facility.fee?.amount || 0) - (facility.concession_amount || 0)).toLocaleString()}</TableCell>
                            <TableCell>
                              <Chip
                                label={facility.status || 'ACTIVE'}
                                color={facility.status === 'ACTIVE' ? 'success' : 'warning'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <IconButton color="error" onClick={() => handleDeleteFacility(facility.id)}>
                                <Delete />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}
          </Box>
          </Box>
        </Card>

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
            <ArrowBackIosNew />
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
                        {fee.category_name || 'N/A'} (Amount: ₹{fee.amount})
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
                  InputLabelProps={{ shrink: true }}
                  value={facilityForm.start_date}
                  onChange={handleFacilityFormChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  name="end_date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={facilityForm.end_date}
                  onChange={handleFacilityFormChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="concession-type-label">Concession Type</InputLabel>
                  <Select
                    labelId="concession-type-label"
                    name="concession_type_id"
                    value={facilityForm.concession_type_id}
                    onChange={handleFacilityFormChange}
                    label="Concession Type"
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {concessionTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.concession_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Concession Amount"
                  name="concession_amount"
                  type="number"
                  value={facilityForm.concession_amount}
                  onChange={handleFacilityFormChange}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
              {isFacilityTransport && (
                <>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required={isFacilityTransport}>
                      <InputLabel id="route-label">Route</InputLabel>
                      <Select
                        labelId="route-label"
                        name="route_id"
                        value={facilityForm.route_id}
                        onChange={handleFacilityFormChange}
                        label="Route"
                      >
                        <MenuItem value=""><em>None</em></MenuItem>
                        {routes.map((route) => (
                          <MenuItem key={route.id} value={route.id}>
                            {route.route_name} - ₹{route.fee_amount}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required={isFacilityTransport}>
                      <InputLabel id="driver-label">Driver</InputLabel>
                      <Select
                        labelId="driver-label"
                        name="driver_id"
                        value={facilityForm.driver_id}
                        onChange={handleFacilityFormChange}
                        label="Driver"
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
            <Button onClick={() => setAddFacilityOpen(false)} color="secondary">
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary">
              Add Facility
            </Button>
          </DialogActions>
        </form>
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
    </>
  );
};

export default StudentDetails;