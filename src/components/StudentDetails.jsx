import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Avatar, Grid, Chip, IconButton, Tooltip, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Tabs, Tab,
  List, ListItem, ListItemIcon, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Alert, Snackbar, Divider
} from '@mui/material';
import {
  Person, Email, Phone, Home, School, CalendarToday, Edit, Delete, Add, Payment, DirectionsBus, Restaurant, LocalLibrary, ArrowBackIosNew, CloudUpload, Visibility, Download, AttachFile, Work
} from '@mui/icons-material';
import axiosInstance from '../utils/axiosConfig';
import { validatePhoneNumber } from '../utils/errorHandler';
import appConfig from '../config/appConfig';
import StudentAttendance from './StudentAttendance';

const StudentDetails = ({ student, onBack, onEdit }) => {
  // Payment selection and dialog state
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  // State for payment status sub-tab
  const [paymentStatusTab, setPaymentStatusTab] = useState(0);
  // Facility tab state for nested facility tabs
  const [facilityTab, setFacilityTab] = React.useState(0);
  // Delete facility API call
  const handleDeleteFacility = async (studentId, facilityMappingId) => {
    if (!window.confirm('Are you sure you want to delete this facility?')) return;
    try {
      await axiosInstance.delete(`${appConfig.API_PREFIX_V1}/academic/students-facility/${studentId}/facilities/${facilityMappingId}`);
      // Refetch fees after delete (no need to refetch facilities)
      const feesRes = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/academic/${studentId}/fees`);
      setFixedFees(Array.isArray(feesRes.data.fixed_fees) ? feesRes.data.fixed_fees : []);
      setAlert({ open: true, message: 'Facility deleted successfully!', severity: 'success' });
    } catch (error) {
      setAlert({ open: true, message: 'Failed to delete facility.', severity: 'error' });
    }
  }
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
        `${appConfig.API_PREFIX_V1}/academic/parents/`,
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );
      setAddParentModalOpen(false);
      setNewParentForm({ name: '', email: '', phone_number: '', address: '', gender: '', occupation: '', relationship: '' });
      // Refetch parent details
      const studentRes = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/academic/student-with-parent-details/${student.id}`);
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
        `${appConfig.API_PREFIX_V1}/academic/parents/${editParentData.parent_id}`,
        editParentData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('PUT response:', response);
      // Refetch parent details
      const studentRes = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/academic/student-with-parent-details/${student.id}`);
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
  // State for new payment status API
  const [studentPaymentStatus, setStudentPaymentStatus] = useState([]);
  const [loadingPaymentStatus, setLoadingPaymentStatus] = useState(false);
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

  function formatCustomDate(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  if (isNaN(date)) return 'N/A';
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'long' });
  const year = date.getFullYear();
  // Get ordinal suffix
  function getOrdinal(n) {
    if (n > 3 && n < 21) return 'th';
    switch (n % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }
  return `${day}${getOrdinal(day)} ${month}, ${year}`;
}

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
      .get(`${appConfig.API_PREFIX_V1}/academic/student-with-parent-details/${student.id}`)
      .then((studentRes) => {
        setParentDetails(Array.isArray(studentRes.data.parent_details) ? studentRes.data.parent_details : []);
      })
      .catch(() => {
        setParentDetails([]);
      });

    // Fetch profile photo URL
    axiosInstance
      .get(`${appConfig.API_PREFIX_V1}/academic/${student.id}/profile-photo`)
      .then((photoRes) => {
        setProfileImage(photoRes.data.profile_photo_url || '');
      })
      .catch(() => {
        setProfileImage(student.profile_image || '');
      });

    // Fetch fixed fees
    axiosInstance
      .get(`${appConfig.API_PREFIX_V1}/academic/${student.id}/fees`)
      .then((feesRes) => {
        setFixedFees(Array.isArray(feesRes.data.fixed_fees) ? feesRes.data.fixed_fees : []);
      })
      .catch(() => {
        setFixedFees([]);
      })
      .finally(() => setLoading(false));

    // Fetch new payment status for Payment tab
    setLoadingPaymentStatus(true);
    axiosInstance
      .get(`/api/v1/fees-payments/student_payment_status/${student.id}`)
      .then((res) => {
        setStudentPaymentStatus(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        setStudentPaymentStatus([]);
      })
      .finally(() => setLoadingPaymentStatus(false));

    // Fetch facilities
    axiosInstance
      .get(`${appConfig.API_PREFIX_V1}/academic/students-facility/${student.id}/facilities`)
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
      .get(`${appConfig.API_PREFIX_V1}/fees/concessions-management/concession-types/`)
      .then((concessionRes) => {
        setConcessionTypes(Array.isArray(concessionRes.data) ? concessionRes.data : []);
      })
      .catch(() => {
        setConcessionTypes([]);
      });

    // Fetch routes
    axiosInstance
      .get(`${appConfig.API_PREFIX_V1}/academic/transport/routes`)
      .then((routesRes) => {
        setRoutes(Array.isArray(routesRes.data) ? routesRes.data : []);
      })
      .catch(() => {
        setRoutes([]);
      });

    // Fetch drivers
    axiosInstance
      .get(`${appConfig.API_PREFIX_V1}/academic/transport/drivers/`)
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
      await axiosInstance.post(`${appConfig.API_PREFIX_V1}/academic/${student.id}/profile-photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Fetch the updated profile photo URL
      const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/academic/${student.id}/profile-photo`);
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

  // Helper: is selected facility transport (case-insensitive, match 'TRANSPORT FEE')
  const isFacilityTransport = (() => {
    const selectedFee = optionalFees.find(f => f.id === facilityForm.fee_category_id);
    if (!selectedFee) return false;
    return selectedFee.category_name?.toUpperCase() === 'TRANSPORT FEE';
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
      console.log('Adding facility with data:', selectedFee.category_name.toUpperCase());
      if (selectedFee.category_name.toUpperCase()=== 'TRANSPORT FEE') {
        // Transport assignment
        // Always send the driver_id from the selected route
        const selectedRoute = routes.find(r => r.id === facilityForm.route_id);
        const transportPayload = {
          student_id: student.id,
          route_id: facilityForm.route_id,
          driver_id: selectedRoute ? selectedRoute.driver_id : null,
          fee_categories_with_concession: {
            start_date: facilityForm.start_date,
            end_date: facilityForm.end_date || null,
            fee_category_id: selectedFee.fee_category_id,
            concession_type_id: facilityForm.concession_type_id || null,
            concession_amount: parseFloat(facilityForm.concession_amount) || 0
          }
        };
        await axiosInstance.post(
          `${appConfig.API_PREFIX_V1}/academic/students-facility/${student.id}/transport-assignment`,
          transportPayload
        );
      } else {
        // Generic facility
        await axiosInstance.post(
          `${appConfig.API_PREFIX_V1}/academic/students-facility/${student.id}/facilities`,
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
        .get(`${appConfig.API_PREFIX_V1}/academic/students-facility/${student.id}/facilities`)
        .then((facilitiesRes) => {
          setFacilities(Array.isArray(facilitiesRes.data) ? facilitiesRes.data : []);
        });
      axiosInstance
        .get(`${appConfig.API_PREFIX_V1}/academic/${student.id}/fees`)
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
            <IconButton
              onClick={onBack}
              sx={{
                position: 'absolute',
                top: 6,
                left: 18,
                bgcolor: 'white',
                border: '2px solid',
                borderColor: 'primary.main',
                color: 'primary.main',
                boxShadow: 2,
                width: 48,
                height: 48,
                borderRadius: '50%',
                transition: 'background 0.2s',
                zIndex: 10,
                '&:hover': {
                  bgcolor: 'primary.main',
                  color: 'white',
                }
              }}
            >
              <ArrowBackIosNew fontSize="medium" />
            </IconButton>
          </Tooltip>

          <Box sx={{ display: 'flex', flexDirection: 'row', height: 'calc(100vh - 32px)' }}>
            {/* Sidebar: Student Details */}
            <Box sx={{ width: { xs: '100%', md: '22%' }, minWidth: 220, maxWidth: 340, pr: { md: 3 }, borderRight: { md: '1px solid #e0e0e0' }, display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2, mt: 5 }}>
                  <Avatar
                    src={profileImage}
                    sx={{ width: 240, height: 240, bgcolor: 'primary.main', border: '3px solid', borderColor: 'primary.light', borderRadius: 2, m: 0 }}
                  >
                    <Person fontSize="large" sx={{ fontSize: 140 }} />
                  </Avatar>
                  <Typography variant="h5" fontWeight={700} color="text.primary" sx={{ mt: 1, mb: 1 }}>
                    {student.name}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', mt: 1, gap: 1 }}>
                    <IconButton
                      component="label"
                      color="primary"
                      sx={{ background: 'rgba(0,0,0,0.08)' }}
                      disabled={uploading}
                    >
                      {uploading ? <CircularProgress size={24} /> : <CloudUpload fontSize="large" />}
                      <input type="file" hidden accept="image/*" onChange={handleProfileImageUpload} />
                    </IconButton>
                    <IconButton
                      color="primary"
                      sx={{ background: 'rgba(0,0,0,0.08)' }}
                      onClick={() => onEdit && onEdit(student)}
                    >
                      <Edit fontSize="large" />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
              <Button variant="outlined" startIcon={<Email />} sx={{ mb: 1, width: '100%' }}>{student.email}</Button>
              <Button variant="outlined" startIcon={<Phone />} sx={{ mb: 1, width: '100%' }}>{student.phone_number}</Button>
              <Paper elevation={1} sx={{ p: 2, mt: 2, width: '100%' }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Personal Info</Typography>
                <Box sx={{ maxHeight: 220, overflowY: 'auto' }}>
                  <List dense sx={{ pr: 1, pb: 1, maxHeight: 320, overflowY: 'auto' }}>
                    <ListItem>
                      <ListItemIcon><School color="primary" /></ListItemIcon>
                      <ListItemText primary="Roll Number" secondary={student.roll_number} />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CalendarToday color="warning" /></ListItemIcon>
                      <ListItemText primary="Date of Birth" secondary={student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'N/A'} />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CalendarToday color="warning" /></ListItemIcon>
                      <ListItemText primary="Enrollment Date" secondary={student.enrolment_date ? new Date(student.enrolment_date).toLocaleDateString() : 'N/A'} />
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
                </Box>
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
                <Grid container spacing={4} alignItems="flex-start">
                  <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 2, borderRadius: 2, display: 'flex', flexDirection: 'column', alignSelf: 'flex-start', maxHeight: 500, overflowY: 'auto' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>Parent Information</Typography>
                        <IconButton
                          color="primary"
                          sx={{ background: 'rgba(0,0,0,0.08)' }}
                          onClick={() => setAddParentModalOpen(true)}
                        >
                          <Add />
                        </IconButton>
                      </Box>
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
                        <Box sx={{ flex: 1 }}>
                          <Grid container spacing={2}>
                            {parentDetails.map((parent, index) => (
                              <Grid item xs={12} key={index}>
                                <Card sx={{ p: 2, borderRadius: 2, boxShadow: 1, position: 'relative', mb: 2 }}>
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
                                  <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
                                    <IconButton
                                      color="primary"
                                      sx={{ background: 'rgba(0,0,0,0.08)' }}
                                      onClick={() => {
                                        setEditParentData({ ...parent, parent_id: parent.parent_id });
                                        setEditParentModalOpen(true);
                                      }}
                                    >
                                      <Edit />
                                    </IconButton>
                                    <IconButton
                                      color="error"
                                      sx={{ background: 'rgba(0,0,0,0.08)' }}
                                      onClick={async () => {
                                        if (!window.confirm(`Are you sure you want to delete parent '${parent.name}'?`)) return;
                                        try {
                                          await axiosInstance.delete(`${appConfig.API_PREFIX_V1}/academic/parents/${parent.parent_id}`);
                                          setParentDetails(prev => prev.filter(p => p.parent_id !== parent.parent_id));
                                          setAlert({ open: true, message: 'Parent deleted successfully!', severity: 'success' });
                                        } catch (err) {
                                          setAlert({ open: true, message: 'Failed to delete parent.', severity: 'error' });
                                        }
                                      }}
                                    >
                                      <Delete />
                                    </IconButton>
                                  </Box>
                                </Card>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 3, borderRadius: 2, display: 'flex', flexDirection: 'column', alignSelf: 'flex-start' }}>
                      <Typography variant="h6" fontWeight={600} gutterBottom>Academic Information</Typography>
                      <List dense>
                        <ListItem>
                          <ListItemIcon><School color="primary" /></ListItemIcon>
                          <ListItemText primary="Class" secondary={`${student.class_name} - ${student.section_name}`} />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><CalendarToday color="warning" /></ListItemIcon>
                          <ListItemText primary="Enrollment Date" secondary={student.enrolment_date ? new Date(student.enrolment_date).toLocaleDateString() : 'N/A'} />
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
                    Fee Payment Status
                  </Typography>
                  {/* Sub-tabs for payment status filtering */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Tabs
                      value={paymentStatusTab}
                      onChange={(e, v) => setPaymentStatusTab(v)}
                      indicatorColor="primary"
                      textColor="primary"
                    >
                      <Tab label="Pending / Overdue" />
                      <Tab label="Paid" />
                      <Tab label="Waived" />
                    </Tabs>
                    {paymentStatusTab === 0 && (
                      <Button
                        variant="contained"
                        color="primary"
                        disabled={selectedPayments.length === 0}
                        onClick={() => {
                          setPaymentForm(
                            studentPaymentStatus
                              .filter(row => selectedPayments.includes(row.student_fixed_fee_payment_schedule_mapping_id))
                              .map(row => ({
                                ...row,
                                amount_paying: parseFloat(row.pending_amount || 0)
                              }))
                          );
                          setPaymentDialogOpen(true);
                        }}
                        sx={{ ml: 2 }}
                      >
                        Make Payment
                      </Button>
                    )}
                  </Box>
                  {loadingPaymentStatus ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress size={40} />
                      <Typography sx={{ ml: 2 }}>Loading payment status...</Typography>
                    </Box>
                  ) : studentPaymentStatus.length === 0 ? (
                    <Typography color="text.secondary">No payment status data found.</Typography>
                  ) : (
                    <TableContainer component={Paper} sx={{ mt: 2, boxShadow: 2, borderRadius: 2, maxHeight: 400, overflowY: 'auto' }}>
                      <Table stickyHeader>
                        <TableHead sx={{ backgroundColor: 'primary.light' }}>
                          <TableRow>
                            {paymentStatusTab === 0 && (
                              <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.light', top: 0, zIndex: 1 }}></TableCell>
                            )}
                            <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.light', top: 0, zIndex: 1 }}>Fee Category</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.light', top: 0, zIndex: 1 }}>Fees To Be Paid</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.light', top: 0, zIndex: 1 }}>Fees Paid</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.light', top: 0, zIndex: 1 }}>Payment Due Date</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.light', top: 0, zIndex: 1 }}>Paid Date</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.light', top: 0, zIndex: 1 }}>Payment Status</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.light', top: 0, zIndex: 1 }}>Pending Amount</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paymentStatusTab === 0 && (
                            studentPaymentStatus
                              .filter(row => row.payment_status === 'PENDING' || row.payment_status === 'OVERDUE')
                              .sort((a, b) => {
                                if (a.payment_status === b.payment_status) return 0;
                                if (a.payment_status === 'OVERDUE') return -1;
                                if (b.payment_status === 'OVERDUE') return 1;
                                if (a.payment_status === 'PENDING') return -1;
                                if (b.payment_status === 'PENDING') return 1;
                                return 0;
                              })
                              .map((row, idx) => (
                                <TableRow key={row.student_fixed_fee_payment_schedule_mapping_id} hover selected={selectedPayments.includes(row.student_fixed_fee_payment_schedule_mapping_id)}>
                                  <TableCell padding="checkbox">
                                    <input
                                      type="checkbox"
                                      checked={selectedPayments.includes(row.student_fixed_fee_payment_schedule_mapping_id)}
                                      onChange={e => {
                                        if (e.target.checked) {
                                          setSelectedPayments(prev => [...prev, row.student_fixed_fee_payment_schedule_mapping_id]);
                                        } else {
                                          setSelectedPayments(prev => prev.filter(id => id !== row.student_fixed_fee_payment_schedule_mapping_id));
                                        }
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell>{row.fee_category_name}</TableCell>
                                  <TableCell>₹{parseFloat(row.fees_to_be_paid || 0).toLocaleString()}</TableCell>
                                  <TableCell>₹{parseFloat(row.fees_paid || 0).toLocaleString()}</TableCell>
                                  <TableCell>{row.payment_due_date ? formatCustomDate(row.payment_due_date) : 'N/A'}</TableCell>
                                  <TableCell>{row.paid_date ? formatCustomDate(row.paid_date) : 'N/A'}</TableCell>
                                  <TableCell>
                                    <Chip
                                      label={row.payment_status}
                                      color={row.payment_status === 'OVERDUE' ? 'error' : row.payment_status === 'PENDING' ? 'warning' : 'default'}
                                      size="small"
                                    />
                                  </TableCell>
                                  <TableCell>₹{parseFloat(row.pending_amount || 0).toLocaleString()}</TableCell>
                                </TableRow>
                              ))
                          )}
                          {paymentStatusTab !== 0 && (
                            studentPaymentStatus
                              .filter(row => {
                                if (paymentStatusTab === 1) return row.payment_status === 'PAID';
                                if (paymentStatusTab === 2) return row.payment_status === 'WAIVED';
                                return false;
                              })
                              .map((row, idx) => (
                                <TableRow key={idx} hover>
                                  <TableCell>{row.fee_category_name}</TableCell>
                                  <TableCell>₹{parseFloat(row.fees_to_be_paid || 0).toLocaleString()}</TableCell>
                                  <TableCell>₹{parseFloat(row.fees_paid || 0).toLocaleString()}</TableCell>
                                  <TableCell>{row.payment_due_date ? formatCustomDate(row.payment_due_date) : 'N/A'}</TableCell>
                                  <TableCell>{row.paid_date ? formatCustomDate(row.paid_date) : 'N/A'}</TableCell>
                                  <TableCell>
                                    <Chip
                                      label={row.payment_status}
                                      color={row.payment_status === 'PAID' ? 'success' : row.payment_status === 'WAIVED' ? 'info' : 'default'}
                                      size="small"
                                    />
                                  </TableCell>
                                  <TableCell>₹{parseFloat(row.pending_amount || 0).toLocaleString()}</TableCell>
                                </TableRow>
                              ))
                          )}
      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Process Payment</DialogTitle>
        <DialogContent dividers>
          {paymentError && <Alert severity="error" sx={{ mb: 2 }}>{paymentError}</Alert>}
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fee Category</TableCell>
                <TableCell>Total Payable</TableCell>
                <TableCell>Amount Paying</TableCell>
                <TableCell>Pending Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paymentForm.map((row, idx) => {
                const totalPayable = parseFloat(row.fees_to_be_paid || 0);
                const amountPaying = parseFloat(row.amount_paying || 0);
                const pendingAmount = (totalPayable - amountPaying).toFixed(2);
                return (
                  <TableRow key={row.student_fixed_fee_payment_schedule_mapping_id}>
                    <TableCell>{row.fee_category_name}</TableCell>
                    <TableCell>₹{totalPayable.toLocaleString()}</TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={amountPaying}
                        inputProps={{ min: 0, max: totalPayable, step: 0.01 }}
                        onChange={e => {
                          const value = parseFloat(e.target.value) || 0;
                          setPaymentForm(form => form.map((f, i) => i === idx ? { ...f, amount_paying: value } : f));
                        }}
                      />
                    </TableCell>
                    <TableCell>₹{pendingAmount}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)} color="secondary">Cancel</Button>
          <Button
            onClick={async () => {
              setPaymentLoading(true);
              setPaymentError('');
              try {
                const paymentDetails = paymentForm.map(row => {
                  const totalPayable = parseFloat(row.fees_to_be_paid || 0);
                  const amountPaying = parseFloat(row.amount_paying || 0);
                  const pendingAmount = Number((totalPayable - amountPaying).toFixed(2));
                  return {
                    fee_id: row.fee_id,
                    fee_category_id: row.fee_category_id,
                    student_fixed_fee_id: row.student_fixed_fee_id,
                    student_fixed_fee_payment_schedule_mapping_id: row.student_fixed_fee_payment_schedule_mapping_id,
                    amount_paying: amountPaying,
                    pending_amount: pendingAmount,
                  };
                });
                await axiosInstance.post('/api/v1/fees-payments/process_payment', {
                  student_id: student.id,
                  academic_year_id: student.academic_year_id,
                  payment_method: 'CASH', // or allow user to select
                  description: '',
                  payment_details: paymentDetails
                });
                setPaymentDialogOpen(false);
                setSelectedPayments([]);
                // Optionally show a success alert
                // Refresh payment status
                setLoadingPaymentStatus(true);
                const res = await axiosInstance.get(`/api/v1/fees-payments/student_payment_status/${student.id}`);
                setStudentPaymentStatus(Array.isArray(res.data) ? res.data : []);
                setLoadingPaymentStatus(false);
              } catch (err) {
                setPaymentError('Failed to process payment.');
              } finally {
                setPaymentLoading(false);
              }
            }}
            color="primary"
            variant="contained"
            disabled={paymentLoading || paymentForm.some(f => f.amount_paying <= 0 || f.amount_paying > f.pending_amount)}
          >
            {paymentLoading ? <CircularProgress size={20} /> : 'Submit Payment'}
          </Button>
        </DialogActions>
      </Dialog>
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
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2 }}>
                    {/* Individual totals and grand total beside Add Facility button */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mr: 2 }}>
                      <Box sx={{ px: 2, py: 1, borderRadius: 2, fontWeight: 700, fontSize: 16 }}>
                        Facility Enrolled Total: ₹{(() => {
                          const allMappings = [];
                          fixedFees.forEach((fee) => {
                            (fee.facility_mappings || []).forEach((mapping) => {
                              allMappings.push({
                                ...mapping,
                                fee,
                                fee_category: fee.fee_category,
                                concession_type: fee.concession_type,
                                concession_amount: fee.concession_amount,
                                amount: fee.amount,
                              });
                            });
                          });
                          const activeMappings = allMappings.filter(m => m.status !== 'DELETED');
                          const total = activeMappings.reduce((sum, m) => {
                            const net = parseFloat(m.amount || 0);
                            const schedule = parseInt(m.fee_category?.payment_schedule || 1);
                            return sum + (isNaN(net) || isNaN(schedule) ? 0 : net * schedule);
                          }, 0);
                          return total.toLocaleString();
                        })()}
                      </Box>
                      <Box sx={{ px: 2, py: 1, borderRadius: 2, fontWeight: 700, fontSize: 16 }}>
                        Non Core Total: ₹{(() => {
                          const nonCoreFees = fixedFees.filter(fee => fee.fee_category && fee.fee_category.core_fee === false);
                          const nonCoreRows = [];
                          nonCoreFees.forEach(fee => {
                            if (fee.facility_mappings && fee.facility_mappings.length > 0) {
                              fee.facility_mappings.forEach(mapping => {
                                nonCoreRows.push({
                                  ...mapping,
                                  fee,
                                  fee_category: fee.fee_category,
                                  concession_type: fee.concession_type,
                                  concession_amount: fee.concession_amount,
                                  amount: fee.amount,
                                  status: mapping.status || fee.status,
                                });
                              });
                            } else {
                              nonCoreRows.push({
                                id: fee.id,
                                fee,
                                fee_category: fee.fee_category,
                                concession_type: fee.concession_type,
                                concession_amount: fee.concession_amount,
                                amount: fee.amount,
                                status: fee.status,
                                start_date: fee.created_at,
                                end_date: fee.updated_at,
                              });
                            }
                          });
                          const total = nonCoreRows.reduce((sum, row) => {
                            const net = parseFloat(row.amount || 0);
                            const schedule = parseInt(row.fee_category?.payment_schedule || 1);
                            return sum + (isNaN(net) || isNaN(schedule) ? 0 : net * schedule);
                          }, 0);
                          return total.toLocaleString();
                        })()}
                      </Box>
                      {/* Grand Total */}
                      <Box sx={{ px: 2, py: 1, borderRadius: 2, fontWeight: 700, fontSize: 16 }}>
                        Grand Total: ₹{(() => {
                          // Facility Enrolled Total
                          const allMappings = [];
                          fixedFees.forEach((fee) => {
                            (fee.facility_mappings || []).forEach((mapping) => {
                              allMappings.push({
                                ...mapping,
                                fee,
                                fee_category: fee.fee_category,
                                concession_type: fee.concession_type,
                                concession_amount: fee.concession_amount,
                                amount: fee.amount,
                              });
                            });
                          });
                          const activeMappings = allMappings.filter(m => m.status !== 'DELETED');
                          const facilityTotal = activeMappings.reduce((sum, m) => {
                            const net = parseFloat(m.amount || 0);
                            const schedule = parseInt(m.fee_category?.payment_schedule || 1);
                            return sum + (isNaN(net) || isNaN(schedule) ? 0 : net * schedule);
                          }, 0);
                          // Non Core Total
                          const nonCoreFees = fixedFees.filter(fee => fee.fee_category && fee.fee_category.core_fee === false);
                          const nonCoreRows = [];
                          nonCoreFees.forEach(fee => {
                            if (fee.facility_mappings && fee.facility_mappings.length > 0) {
                              fee.facility_mappings.forEach(mapping => {
                                nonCoreRows.push({
                                  ...mapping,
                                  fee,
                                  fee_category: fee.fee_category,
                                  concession_type: fee.concession_type,
                                  concession_amount: fee.concession_amount,
                                  amount: fee.amount,
                                  status: mapping.status || fee.status,
                                });
                              });
                            } else {
                              nonCoreRows.push({
                                id: fee.id,
                                fee,
                                fee_category: fee.fee_category,
                                concession_type: fee.concession_type,
                                concession_amount: fee.concession_amount,
                                amount: fee.amount,
                                status: fee.status,
                                start_date: fee.created_at,
                                end_date: fee.updated_at,
                              });
                            }
                          });
                          const nonCoreTotal = nonCoreRows.reduce((sum, row) => {
                            const net = parseFloat(row.amount || 0);
                            const schedule = parseInt(row.fee_category?.payment_schedule || 1);
                            return sum + (isNaN(net) || isNaN(schedule) ? 0 : net * schedule);
                          }, 0);
                          return (facilityTotal + nonCoreTotal).toLocaleString();
                        })()}
                      </Box>
                    </Box>
                    <Button variant="contained" color="primary" startIcon={<Add />} onClick={() => setAddFacilityOpen(true)}>
                      Add Facility
                    </Button>
                  </Box>
                  {/* Tabbed view for Facilities */}
                  {(() => {
                    // Flatten all facility mappings with fee info
                    const allMappings = [];
                    fixedFees.forEach((fee) => {
                      (fee.facility_mappings || []).forEach((mapping) => {
                        allMappings.push({
                          ...mapping,
                          fee,
                          fee_category: fee.fee_category,
                          concession_type: fee.concession_type,
                          concession_amount: fee.concession_amount,
                          amount: fee.amount,
                        });
                      });
                    });
                    const activeMappings = allMappings.filter(m => m.status !== 'DELETED');
                    const deletedMappings = allMappings.filter(m => m.status === 'DELETED');
                    // For non-core, include fees with core_fee: false even if no facility_mappings
                    const nonCoreFees = fixedFees.filter(fee => fee.fee_category && fee.fee_category.core_fee === false);
                    // If facility_mappings exists, use those, else use the fee itself
                    const nonCoreRows = [];
                    nonCoreFees.forEach(fee => {
                      if (fee.facility_mappings && fee.facility_mappings.length > 0) {
                        fee.facility_mappings.forEach(mapping => {
                          nonCoreRows.push({
                            ...mapping,
                            fee,
                            fee_category: fee.fee_category,
                            concession_type: fee.concession_type,
                            concession_amount: fee.concession_amount,
                            amount: fee.amount,
                            status: mapping.status || fee.status,
                          });
                        });
                      } else {
                        nonCoreRows.push({
                          id: fee.id,
                          fee,
                          fee_category: fee.fee_category,
                          concession_type: fee.concession_type,
                          concession_amount: fee.concession_amount,
                          amount: fee.amount,
                          status: fee.status,
                          start_date: fee.created_at,
                          end_date: fee.updated_at,
                        });
                      }
                    });

                    return (
                      <>
                        <Tabs value={facilityTab} onChange={(_, v) => setFacilityTab(v)} sx={{ mb: 2 }}>
                          <Tab label="Facilities Enrolled" />
                          <Tab label="Non Core Facility" />
                          <Tab label="Deleted Facility" />
                        </Tabs>
                        {facilityTab === 0 && (
                          <TableContainer component={Paper} sx={{ boxShadow: 1, borderRadius: 1, maxHeight: 320, overflowY: 'auto', position: 'relative', m: 0, p: 0 }}>
                            <Table stickyHeader size="small">
                              <TableHead sx={{ backgroundColor: theme => theme.palette.secondary.main }}>
                                <TableRow sx={{ height: 32 }}>
                                  <TableCell sx={{ fontWeight: 700, fontSize: 13, py: 0.5, px: 1, width: 32 }}>#</TableCell>
                                  <TableCell sx={{ fontWeight: 700, fontSize: 13, py: 0.5, px: 1 }}>Facility Type</TableCell>
                                  <TableCell sx={{ fontWeight: 700, fontSize: 13, py: 0.5, px: 1 }}>Start Date</TableCell>
                                  <TableCell sx={{ fontWeight: 700, fontSize: 13, py: 0.5, px: 1 }}>Amount</TableCell>
                                  <TableCell sx={{ fontWeight: 700, fontSize: 13, py: 0.5, px: 1 }}>Concession Type</TableCell>
                                  <TableCell sx={{ fontWeight: 700, fontSize: 13, py: 0.5, px: 1 }}>Concession</TableCell>
                                  <TableCell sx={{ fontWeight: 700, fontSize: 13, py: 0.5, px: 1 }}>Net Amount</TableCell>
                                  <TableCell sx={{ fontWeight: 700, fontSize: 13, py: 0.5, px: 1 }}>Payment Schedule</TableCell>
                                  <TableCell sx={{ fontWeight: 700, fontSize: 13, py: 0.5, px: 1 }}>Total Amount</TableCell>
                                  <TableCell sx={{ fontWeight: 700, fontSize: 13, py: 0.5, px: 1 }}>Status</TableCell>
                                  <TableCell sx={{ fontWeight: 700, fontSize: 13, py: 0.5, px: 1 }}>Actions</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {activeMappings.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={10} align="center">No active facilities enrolled.</TableCell>
                                  </TableRow>
                                ) : (
                                  <>
                                    {activeMappings.map((mapping, idx) => (
                                      <TableRow key={mapping.id} hover>
                                        <TableCell>{idx + 1}</TableCell>
                                        <TableCell>
                                          <Tooltip title={mapping.fee?.description || ''} arrow>
                                            <span>{mapping.fee_category?.category_name || 'N/A'}</span>
                                          </Tooltip>
                                        </TableCell>
                                        <TableCell>{mapping.start_date ? new Date(mapping.start_date).toLocaleDateString() : 'N/A'}</TableCell>
                                        <TableCell>₹{parseFloat(mapping.fee?.amount || 0).toLocaleString()}</TableCell>
                                        <TableCell>
                                          {mapping.concession_type ? (
                                            <Tooltip title={mapping.concession_type.description || ''} arrow>
                                              <span>{mapping.concession_type.concession_name || '-'}</span>
                                            </Tooltip>
                                          ) : '-'}
                                        </TableCell>
                                        <TableCell>₹{parseFloat(mapping.concession_amount || 0).toLocaleString()}</TableCell>
                                        <TableCell>₹{parseFloat(mapping.amount || 0).toLocaleString()}</TableCell>
                                        <TableCell>{mapping.fee_category?.payment_schedule || '-'}</TableCell>
                                        <TableCell>
                                          {(() => {
                                            const net = parseFloat(mapping.amount || 0);
                                            const schedule = parseInt(mapping.fee_category?.payment_schedule || 1);
                                            if (isNaN(net) || isNaN(schedule)) return 'N/A';
                                            return `₹${(net * schedule).toLocaleString()}`;
                                          })()}
                                        </TableCell>
                                        <TableCell>
                                          <Chip
                                            label={mapping.status || 'ACTIVE'}
                                            color={mapping.status === 'ACTIVE' ? 'success' : 'warning'}
                                            size="small"
                                          />
                                        </TableCell>
                                        <TableCell>
                                          {mapping.status !== 'DELETED' && (
                                            <IconButton color="error" onClick={() => handleDeleteFacility(student.id, mapping.id)}>
                                              <Delete />
                                            </IconButton>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                    {/* Total Row */}
                                    <TableRow sx={{ fontWeight: 700 }}>
                                      <TableCell colSpan={8} align="right" sx={{ fontWeight: 700 }}>Total Amount</TableCell>
                                      <TableCell sx={{ fontWeight: 700 }}>
                                        ₹{activeMappings.reduce((sum, m) => {
                                          const net = parseFloat(m.amount || 0);
                                          const schedule = parseInt(m.fee_category?.payment_schedule || 1);
                                          return sum + (isNaN(net) || isNaN(schedule) ? 0 : net * schedule);
                                        }, 0).toLocaleString()}
                                      </TableCell>
                                      <TableCell colSpan={2} />
                                    </TableRow>
                                  </>
                                )}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )}
                        {facilityTab === 1 && (
                          <TableContainer component={Paper} sx={{ boxShadow: 1, borderRadius: 1, maxHeight: 220, overflowY: 'auto', position: 'relative', m: 0, p: 0 }}>
                            <Table stickyHeader size="small">
                              <TableHead sx={{ backgroundColor: theme => theme.palette.primary.main }}>
                                <TableRow sx={{ height: 32 }}>
                                  <TableCell sx={{ fontWeight: 700, fontSize: 13, py: 0.5, px: 1, width: 32 }}>#</TableCell>
                                  <TableCell sx={{ fontWeight: 700, fontSize: 13, py: 0.5, px: 1 }}>Facility Type</TableCell>
                                  <TableCell sx={{ fontWeight: 700, fontSize: 13, py: 0.5, px: 1 }}>Start Date</TableCell>
                                  <TableCell sx={{ fontWeight: 700, fontSize: 13, py: 0.5, px: 1 }}>Amount</TableCell>
                                  <TableCell sx={{ fontWeight: 700, fontSize: 13, py: 0.5, px: 1 }}>Concession Type</TableCell>
                                  <TableCell sx={{ fontWeight: 700, fontSize: 13, py: 0.5, px: 1 }}>Concession</TableCell>
                                  <TableCell sx={{ fontWeight: 700, fontSize: 13, py: 0.5, px: 1 }}>Net Amount</TableCell>
                                  <TableCell sx={{ fontWeight: 700, fontSize: 13, py: 0.5, px: 1 }}>Payment Schedule</TableCell>
                                  <TableCell sx={{ fontWeight: 700, fontSize: 13, py: 0.5, px: 1 }}>Total Amount</TableCell>
                                  <TableCell sx={{ fontWeight: 700, fontSize: 13, py: 0.5, px: 1 }}>Educational Supplies</TableCell>
                                  <TableCell sx={{ fontWeight: 700, fontSize: 13, py: 0.5, px: 1 }}>Status</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {nonCoreRows.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={10} align="center">No non-core facilities found.</TableCell>
                                  </TableRow>
                                ) : (
                                  <>
                                    {nonCoreRows.map((row, idx) => (
                                      <TableRow key={row.id} hover>
                                        <TableCell>{idx + 1}</TableCell>
                                        <TableCell>
                                          <Tooltip title={row.fee?.description || ''} arrow>
                                            <span>{row.fee_category?.category_name || 'N/A'}</span>
                                          </Tooltip>
                                        </TableCell>
                                        <TableCell>{row.start_date ? new Date(row.start_date).toLocaleDateString() : 'N/A'}</TableCell>
                                        <TableCell>₹{parseFloat(row.fee?.amount || 0).toLocaleString()}</TableCell>
                                        <TableCell>
                                          {row.concession_type ? (
                                            <Tooltip title={row.concession_type.description || ''} arrow>
                                              <span>{row.concession_type.concession_name || '-'}</span>
                                            </Tooltip>
                                          ) : '-'}
                                        </TableCell>
                                        <TableCell>₹{parseFloat(row.concession_amount || 0).toLocaleString()}</TableCell>
                                        <TableCell>₹{parseFloat(row.amount || 0).toLocaleString()}</TableCell>
                                        <TableCell>{row.fee_category?.payment_schedule || '-'}</TableCell>
                                        <TableCell>
                                          {(() => {
                                            const net = parseFloat(row.amount || 0);
                                            const schedule = parseInt(row.fee_category?.payment_schedule || 1);
                                            if (isNaN(net) || isNaN(schedule)) return 'N/A';
                                            return `₹${(net * schedule).toLocaleString()}`;
                                          })()}
                                        </TableCell>
                                        <TableCell>{row.fee_category?.educational_supplies ? 'Yes' : 'No'}</TableCell>
                                        <TableCell>
                                          <Chip
                                            label={row.status || 'ACTIVE'}
                                            color={row.status === 'ACTIVE' ? 'success' : 'warning'}
                                            size="small"
                                          />
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                    {/* Total Row */}
                                    <TableRow sx={{ fontWeight: 700 }}>
                                      <TableCell colSpan={8} align="right" sx={{ fontWeight: 700 }}>Total Amount</TableCell>
                                      <TableCell sx={{ fontWeight: 700 }}>
                                        ₹{nonCoreRows.reduce((sum, row) => {
                                          const net = parseFloat(row.amount || 0);
                                          const schedule = parseInt(row.fee_category?.payment_schedule || 1);
                                          return sum + (isNaN(net) || isNaN(schedule) ? 0 : net * schedule);
                                        }, 0).toLocaleString()}
                                      </TableCell>
                                      <TableCell colSpan={2} />
                                    </TableRow>
                                  </>
                                )}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )}
                        {facilityTab === 2 && (
                          <TableContainer component={Paper} sx={{ boxShadow: 1, borderRadius: 1, maxHeight: 180, overflowY: 'auto', position: 'relative', m: 0, p: 0 }}>
                            <Table size="small">
                              <TableHead sx={{ backgroundColor: 'error.light' }}>
                                <TableRow sx={{ height: 32 }}>
                                  <TableCell sx={{ fontWeight: 700, fontSize: 13, py: 0.5, px: 1, width: 32 }}>#</TableCell>
                                  <TableCell sx={{ fontWeight: 700, fontSize: 13, py: 0.5, px: 1 }}>Facility Type</TableCell>
                                  <TableCell sx={{ fontWeight: 700, fontSize: 13, py: 0.5, px: 1 }}>Start Date</TableCell>
                                  <TableCell sx={{ fontWeight: 700, fontSize: 13, py: 0.5, px: 1 }}>End Date</TableCell>
                                  <TableCell sx={{ fontWeight: 700, fontSize: 13, py: 0.5, px: 1 }}>Amount</TableCell>
                                  <TableCell sx={{ fontWeight: 700, fontSize: 13, py: 0.5, px: 1 }}>Concession Type</TableCell>
                                  <TableCell sx={{ fontWeight: 700, fontSize: 13, py: 0.5, px: 1 }}>Concession</TableCell>
                                  <TableCell sx={{ fontWeight: 700, fontSize: 13, py: 0.5, px: 1 }}>Net Amount</TableCell>
                                  <TableCell sx={{ fontWeight: 700, fontSize: 13, py: 0.5, px: 1 }}>Payment Schedule</TableCell>
                                  <TableCell sx={{ fontWeight: 700, fontSize: 13, py: 0.5, px: 1 }}>Status</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {deletedMappings.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={10} align="center">No deleted facilities found.</TableCell>
                                  </TableRow>
                                ) : (
                                  deletedMappings.map((mapping, idx) => (
                                    <TableRow key={mapping.id} hover>
                                      <TableCell>{idx + 1}</TableCell>
                                      <TableCell>
                                        <Tooltip title={mapping.fee?.description || ''} arrow>
                                          <span>{mapping.fee_category?.category_name || 'N/A'}</span>
                                        </Tooltip>
                                      </TableCell>
                                      <TableCell>{mapping.start_date ? new Date(mapping.start_date).toLocaleDateString() : 'N/A'}</TableCell>
                                      <TableCell>{mapping.end_date ? new Date(mapping.end_date).toLocaleDateString() : 'N/A'}</TableCell>
                                      <TableCell>₹{parseFloat(mapping.fee?.amount || 0).toLocaleString()}</TableCell>
                                      <TableCell>
                                        {mapping.concession_type ? (
                                          <Tooltip title={mapping.concession_type.description || ''} arrow>
                                            <span>{mapping.concession_type.concession_name || '-'}</span>
                                          </Tooltip>
                                        ) : '-'}
                                      </TableCell>
                                      <TableCell>₹{parseFloat(mapping.concession_amount || 0).toLocaleString()}</TableCell>
                                      <TableCell>₹{parseFloat(mapping.amount || 0).toLocaleString()}</TableCell>
                                      <TableCell>{mapping.fee_category?.payment_schedule || '-'}</TableCell>
                                      <TableCell>
                                        <Chip
                                          label={mapping.status || 'DELETED'}
                                          color="error"
                                          size="small"
                                        />
                                      </TableCell>
                                    </TableRow>
                                  ))
                                )}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )}
                      </>
                    );
                  })()}
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
                      {routes.map((route) => {
                        const driver = drivers.find(d => d.id === route.driver_id);
                        return (
                          <MenuItem key={route.id} value={route.id}>
                            {route.route_name}
                            {driver ? ` (${driver.driver_name})` : ''}
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