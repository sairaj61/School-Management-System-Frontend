import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosConfig';
import appConfig from '../config/appConfig';
import {
  Container, Typography, TextField, Button, Grid, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Card, CardContent, Box,
  List, ListItem, ListItemText, IconButton, Divider, CircularProgress, Tooltip // Import Tooltip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { handleApiError } from '../utils/errorHandler';
import PersonIcon from '@mui/icons-material/Person';
import DriveEtaIcon from '@mui/icons-material/DriveEta';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit'; // Import EditIcon
import DeleteIcon from '@mui/icons-material/Delete'; // Import DeleteIcon

const DriverManager = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [modalOpen, setModalOpen] = useState(false);
  const [viewStudentsModalOpen, setViewStudentsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [assignedStudentSearchTerm, setAssignedStudentSearchTerm] = useState('');

  const [selectedDriver, setSelectedDriver] = useState(null);
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [fetchingAssignedStudents, setFetchingAssignedStudents] = useState(false);

  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);

  const [formData, setFormData] = useState({
    driver_name: '',
    license_number: '',
    contact_number: '',
    address: ''
  });
  const [stats, setStats] = useState({
    totalDrivers: 0,
    activeDrivers: 0,
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [driversResponse, classesResponse, sectionsResponse, academicYearsResponse] = await Promise.all([
        axiosInstance.get(`${appConfig.API_PREFIX_V1}/students/transport/drivers/`),
        axiosInstance.get(`${appConfig.API_PREFIX_V1}/students/classes/`),
        axiosInstance.get(`${appConfig.API_PREFIX_V1}/students/sections/`),
        axiosInstance.get(`${appConfig.API_PREFIX_V1}/timetable/academic-years/`)
      ]);
      setDrivers(driversResponse.data);
      setClasses(classesResponse.data);
      setSections(sectionsResponse.data);
      setAcademicYears(academicYearsResponse.data);
    } catch (error) {
      handleApiError(error, setAlert);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/students/transport`);
      setDrivers(response.data);
    } catch (error) {
      handleApiError(error, setAlert);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsByDriver = async (driverId) => {
    setFetchingAssignedStudents(true);
    try {
      const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/students/transport/${driverId}/students`);
      setAssignedStudents(response.data);
    } catch (error) {
      handleApiError(error, setAlert);
      setAssignedStudents([]);
    } finally {
      setFetchingAssignedStudents(false);
    }
  };

  const handleModalOpen = (driverItem = null) => {
    if (driverItem) {
      setSelectedDriver(driverItem);
      setFormData({
        driver_name: driverItem.driver_name,
        license_number: driverItem.license_number,
        contact_number: driverItem.contact_number,
        address: driverItem.address
      });
    } else {
      setSelectedDriver(null);
      setFormData({
        driver_name: '',
        license_number: '',
        contact_number: '',
        address: ''
      });
    }
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedDriver(null);
    setFormData({
      driver_name: '',
      license_number: '',
      contact_number: '',
      address: ''
    });
  };

  const handleViewStudentsModalOpen = (driverItem) => {
    setSelectedDriver(driverItem);
    setAssignedStudentSearchTerm('');
    fetchStudentsByDriver(driverItem.id);
    setViewStudentsModalOpen(true);
  };

  const handleViewStudentsModalClose = () => {
    setViewStudentsModalOpen(false);
    setSelectedDriver(null);
    setAssignedStudents([]);
    setAssignedStudentSearchTerm('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const driverData = {
        driver_name: formData.driver_name.trim(),
        license_number: formData.license_number.trim(),
        contact_number: formData.contact_number.trim(),
        address: formData.address.trim()
      };

      if (selectedDriver) {
        await axiosInstance.put(`${appConfig.API_PREFIX_V1}/students/transport/${selectedDriver.id}`, driverData);
        setAlert({ open: true, message: 'Driver updated successfully!', severity: 'success' });
      } else {
        await axiosInstance.post(`${appConfig.API_PREFIX_V1}/students/transport/`, driverData);
        setAlert({ open: true, message: 'Driver added successfully!', severity: 'success' });
      }

      handleModalClose();
      fetchDrivers();
    } catch (error) {
      handleApiError(error, setAlert);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      try {
        await axiosInstance.delete(`${appConfig.API_PREFIX_V1}/students/transport/${id}`);
        setAlert({ open: true, message: 'Driver deleted successfully!', severity: 'success' });
        fetchDrivers();
      } catch (error) {
        handleApiError(error, setAlert);
      }
    }
  };

  const filteredDrivers = drivers.filter(driver =>
    driver.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.license_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.contact_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getClassName = (classId) => classes.find(c => c.id === classId)?.class_name || 'N/A';
  const getSectionName = (sectionId) => sections.find(s => s.id === sectionId)?.name || 'N/A';

  const filteredAssignedStudents = assignedStudents.filter(student => {
    const studentInfo = `${student.name} ${student.roll_number} ${student.father_name} ${getClassName(student.class_id)} ${getSectionName(student.section_id)}`.toLowerCase();
    return studentInfo.includes(assignedStudentSearchTerm.toLowerCase());
  });

  const calculateStats = () => {
    try {
      const totalDrivers = drivers.length;
      const activeDrivers = drivers.filter(driver => driver.status === 'ACTIVE').length;

      setStats({
        totalDrivers,
        activeDrivers,
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };

  useEffect(() => {
    if (drivers.length > 0) {
      calculateStats();
    } else {
      setStats({
        totalDrivers: 0,
        activeDrivers: 0,
      });
    }
  }, [drivers]);

  const columns = [
    { field: 'driver_name', headerName: 'Driver Name', width: 150 }, // Reduced width
    { field: 'license_number', headerName: 'License', width: 120 }, // Reduced width, shortened header
    { field: 'contact_number', headerName: 'Contact', width: 120 }, // Reduced width, shortened header
    { field: 'address', headerName: 'Address', flex: 1, minWidth: 150 }, // Allow flexible width, min for small screens
    { field: 'status', headerName: 'Status', width: 90 }, // Reduced width
    // {
    //   field: 'actions',
    //   headerName: 'Actions',
    //   width: 180, // Optimized width for actions
    //   renderCell: (params) => (
    //     <Box sx={{ display: 'flex', gap: 0.5 }}> {/* Reduced gap between buttons */}
    //       <Tooltip title="Edit Driver">
    //         <IconButton
    //           color="primary"
    //           size="small"
    //           onClick={() => handleModalOpen(params.row)}
    //         >
    //           <EditIcon fontSize="small" />
    //         </IconButton>
    //       </Tooltip>
    //       <Tooltip title="View Assigned Students">
    //         <IconButton
    //           color="info"
    //           size="small"
    //           onClick={() => handleViewStudentsModalOpen(params.row)}
    //         >
    //           <VisibilityIcon fontSize="small" />
    //         </IconButton>
    //       </Tooltip>
    //       <Tooltip title="Delete Driver">
    //         <IconButton
    //           color="error"
    //           size="small"
    //           onClick={() => handleDelete(params.row.id)}
    //         >
    //           <DeleteIcon fontSize="small" />
    //         </IconButton>
    //       </Tooltip>
    //     </Box>
    //   ),
    // },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={6}>
          <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <DriveEtaIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Total Drivers</Typography>
              </Box>
              <Typography variant="h4">{stats.totalDrivers}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <PersonIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Active Drivers</Typography>
              </Box>
              <Typography variant="h4">{stats.activeDrivers}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs>
          <Typography variant="h4">Driver Management</Typography>
        </Grid>
        <Grid item>
          <TextField
            size="small"
            placeholder="Search drivers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Grid>
        {/* <Grid item>
          <Button
            variant="contained"
            onClick={() => handleModalOpen()}
          >
            Add Driver
          </Button>
        </Grid> */}
      </Grid>

      <div style={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={filteredDrivers}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5]}
          disableSelectionOnClick
          loading={loading}
          getRowId={(row) => row.id}
          // Ensure table takes full width of its container
          sx={{ width: '100%' }}
        />
      </div>

      {/* Add/Edit Driver Modal */}
      <Dialog open={modalOpen} onClose={handleModalClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedDriver ? 'Edit Driver' : 'Add Driver'}
          <IconButton
            onClick={handleModalClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Driver Name"
                  name="driver_name"
                  value={formData.driver_name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="License Number"
                  name="license_number"
                  value={formData.license_number}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Number"
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </DialogContent>
          {/* <DialogActions>
            <Button onClick={handleModalClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {selectedDriver ? 'Update' : 'Add'} Driver
            </Button>
          </DialogActions> */}
        </form>
      </Dialog>

      {/* View Assigned Students Modal */}
      <Dialog open={viewStudentsModalOpen} onClose={handleViewStudentsModalClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Assigned Students for Driver: {selectedDriver?.driver_name}
          <IconButton
            onClick={handleViewStudentsModalClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            label="Search Assigned Students"
            variant="outlined"
            value={assignedStudentSearchTerm}
            onChange={(e) => setAssignedStudentSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: (
                <SearchIcon color="action" />
              ),
            }}
          />
          {fetchingAssignedStudents ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredAssignedStudents.length === 0 ? (
            <Typography variant="body1" color="textSecondary" sx={{ mt: 2, textAlign: 'center' }}>
              No students currently assigned to this driver or no matching students found.
            </Typography>
          ) : (
            <List dense sx={{ maxHeight: 400, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
              {filteredAssignedStudents.map(student => (
                <React.Fragment key={student.id}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Typography variant="body1" fontWeight="medium">
                          {student.name} (Roll No: {student.roll_number})
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" color="textSecondary">
                          Father: {student.father_name} | Class: {getClassName(student.class_id)} | Section: {getSectionName(student.section_id)}
                        </Typography>
                      }
                    />
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleViewStudentsModalClose}>Close</Button>
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

export default DriverManager;