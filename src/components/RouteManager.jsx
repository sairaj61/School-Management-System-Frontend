import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosConfig';
import appConfig from '../config/appConfig';
import {
  Container, Typography, TextField, Button, Grid, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Card, CardContent, Box,
  Select, MenuItem, InputLabel, FormControl, List, ListItem, ListItemText, IconButton, Divider,Tooltip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { handleApiError } from '../utils/errorHandler';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import MapIcon from '@mui/icons-material/Map';
import SpeedIcon from '@mui/icons-material/Speed';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit'; 
import DeleteIcon from '@mui/icons-material/Delete';


const RouteManager = () => {
  const [routes, setRoutes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [feeCategories, setFeeCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [modalOpen, setModalOpen] = useState(false);
  const [assignStudentsModalOpen, setAssignStudentsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState(''); // New search term for available students
  const [assignedStudentSearchTerm, setAssignedStudentSearchTerm] = useState(''); // New search term for assigned students

  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedRouteForStudents, setSelectedRouteForStudents] = useState(null);
  // assignedStudents will now store the full response object to retain facility_mapping_id
  const [assignedStudents, setAssignedStudents] = useState([]); 
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudentsToAssign, setSelectedStudentsToAssign] = useState([]);

  const [formData, setFormData] = useState({
    route_name: '',
    distance: '',
    description: '',
    driver_id: ''
  });

  const [stats, setStats] = useState({
    totalRoutes: 0,
    activeRoutes: 0,
    totalDistance: 0,
    assignedDrivers: 0
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [
        routesResponse,
        driversResponse,
        classesResponse,
        sectionsResponse,
        academicYearsResponse,
        feeCategoriesResponse
      ] = await Promise.all([
        axiosInstance.get(`${appConfig.API_PREFIX_V1}/students-managements/transport/routes`),
        axiosInstance.get(`${appConfig.API_PREFIX_V1}/students-managements/transport/drivers/`),
        axiosInstance.get(`${appConfig.API_PREFIX_V1}/students-managements/classes/`),
        axiosInstance.get(`${appConfig.API_PREFIX_V1}/students-managements/sections/`),
        axiosInstance.get(`${appConfig.API_PREFIX_V1}/timetable/academic-years/`),
        axiosInstance.get(`${appConfig.API_PREFIX_V1}/fees-management/fee-categories/`)
      ]);
      setRoutes(routesResponse.data);
      setDrivers(driversResponse.data);
      setClasses(classesResponse.data);
      setSections(sectionsResponse.data);
      setAcademicYears(academicYearsResponse.data);
      setFeeCategories(feeCategoriesResponse.data);
    } catch (error) {
      handleApiError(error, setAlert);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedAndAvailableStudents = async (routeId) => {
    try {
      // Updated API call as per user request
      const assignedResponse = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/students-managements/transport/route/${routeId}`);
      
      // The response for assigned students now contains nested student objects
      setAssignedStudents(assignedResponse.data);

      const allStudentsResponse = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/students-managements/students/?status=ACTIVE`);

      // Extract student IDs from the new assignedResponse structure
      const assignedStudentIds = new Set(assignedResponse.data.map(item => item.student.id));
      const available = allStudentsResponse.data.filter(s => !assignedStudentIds.has(s.id));
      setAvailableStudents(available);

    } catch (error) {
      handleApiError(error, setAlert);
      setAssignedStudents([]);
      setAvailableStudents([]);
    }
  };

  const handleModalOpen = (routeItem = null) => {
    if (routeItem) {
      setSelectedRoute(routeItem);
      setFormData({
        route_name: routeItem.route_name,
        distance: routeItem.distance,
        description: routeItem.description,
        driver_id: routeItem.driver_id || ''
      });
    } else {
      setSelectedRoute(null);
      setFormData({
        route_name: '',
        distance: '',
        description: '',
        driver_id: ''
      });
    }
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedRoute(null);
    setFormData({
      route_name: '',
      distance: '',
      description: '',
      driver_id: ''
    });
  };

  const handleAssignStudentsModalOpen = (routeItem) => {
    setSelectedRouteForStudents(routeItem);
    fetchAssignedAndAvailableStudents(routeItem.id);
    setStudentSearchTerm('');
    setAssignedStudentSearchTerm(''); // Clear search terms
    setSelectedStudentsToAssign([]);
    setAssignStudentsModalOpen(true);
  };

  const handleAssignStudentsModalClose = () => {
    setAssignStudentsModalOpen(false);
    setSelectedRouteForStudents(null);
    setAssignedStudents([]);
    setAvailableStudents([]);
    setSelectedStudentsToAssign([]);
    setStudentSearchTerm('');
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
    // Add validation for required driver when creating a new route
    if (!selectedRoute && !formData.driver_id) {
      setAlert({ open: true, message: 'Driver is required when creating a new route.', severity: 'error' });
      return;
    }
    try {
      const routeData = {
        route_name: formData.route_name.trim(),
        distance: parseFloat(formData.distance),
        description: formData.description.trim(),
        driver_id: formData.driver_id // Remove || null to prevent sending null
      };

      if (selectedRoute) {
        await axiosInstance.put(`${appConfig.API_PREFIX_V1}/students-managements/transport/routes/${selectedRoute.id}`, routeData);
        setAlert({ open: true, message: 'Route updated successfully!', severity: 'success' });
      } else {
        await axiosInstance.post(`${appConfig.API_PREFIX_V1}/students-managements/transport/routes`, routeData);
        setAlert({ open: true, message: 'Route added successfully!', severity: 'success' });
      }

      handleModalClose();
      fetchInitialData();
    } catch (error) {
      handleApiError(error, setAlert);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this route?')) {
      try {
        await axiosInstance.delete(`${appConfig.API_PREFIX_V1}/students-managements/transport/routes/${id}`);
        setAlert({ open: true, message: 'Route deleted successfully!', severity: 'success' });
        fetchInitialData();
      } catch (error) {
        handleApiError(error, setAlert);
      }
    }
  };

  const handleToggleStudentSelection = (student) => {
    setSelectedStudentsToAssign(prev =>
      prev.some(s => s.id === student.id)
        ? prev.filter(s => s.id !== student.id)
        : [...prev, student]
    );
  };

  const handleAssignSelectedStudents = async () => {
    if (!selectedRouteForStudents || selectedStudentsToAssign.length === 0) return;

    const transportFeeCategory = feeCategories.find(cat => cat.category_name === 'TRANSPORT');
    if (!transportFeeCategory) {
      setAlert({ open: true, message: 'Transport fee category not found. Cannot assign students.', severity: 'error' });
      return;
    }

    try {
      const successfulAssignments = [];
      const failedAssignments = [];

      for (const student of selectedStudentsToAssign) {
        const assignmentData = {
          student_id: student.id,
          route_id: selectedRouteForStudents.id,
          driver_id: selectedRouteForStudents.driver_id || null,
          fee_categories_with_concession: {
            start_date: new Date().toISOString().split('T')[0],
            end_date: null,
            fee_category_id: transportFeeCategory.id,
            concession_type_id: null,
            concession_amount: 0
          }
        };

        try {
          await axiosInstance.post(`${appConfig.API_PREFIX_V1}/students-managements/students-facility/${student.id}/transport-assignment`, assignmentData);
          successfulAssignments.push(student.name);
        } catch (error) {
          console.error(`Failed to assign ${student.name} to route:`, error);
          failedAssignments.push(student.name);
        }
      }

      let message = '';
      let severity = 'success';
      if (successfulAssignments.length > 0) {
        message += `${successfulAssignments.length} student(s) assigned: ${successfulAssignments.join(', ')}.`;
      }
      if (failedAssignments.length > 0) {
        message += ` ${failedAssignments.length} student(s) failed: ${failedAssignments.join(', ')}.`;
        severity = successfulAssignments.length > 0 ? 'warning' : 'error';
      }
      setAlert({ open: true, message, severity });

      handleAssignStudentsModalClose();
      fetchAssignedAndAvailableStudents(selectedRouteForStudents.id);
    } catch (error) {
      handleApiError(error, setAlert);
    }
  };

  // New function to handle removing a student from a route
  const handleRemoveStudentFromRoute = async (studentId, facilityMappingId) => {
    if (window.confirm('Are you sure you want to remove this student from the route?')) {
      try {
        await axiosInstance.delete(`${appConfig.API_PREFIX_V1}/students-managements/students-facility/${studentId}/facilities/${facilityMappingId}`);
        setAlert({ open: true, message: 'Student removed from route successfully!', severity: 'success' });
        // Refresh the assigned students list
        if (selectedRouteForStudents) {
          fetchAssignedAndAvailableStudents(selectedRouteForStudents.id);
        }
      } catch (error) {
        handleApiError(error, setAlert);
      }
    }
  };

  const filteredRoutes = routes.filter(route => {
    const driverName = drivers.find(d => d.id === route.driver_id)?.driver_name || '';
    const searchString = `${route.route_name} ${route.description} ${driverName} ${route.distance}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  // Filter assigned students based on search term (now accessing nested student object)
  const filteredAssignedStudents = assignedStudents.filter(item => {
    const student = item.student;
    const className = classes.find(c => c.id === student.class_id)?.class_name || '';
    const sectionName = sections.find(s => s.id === student.section_id)?.name || '';
    const searchString = `${student.name} ${student.roll_number} ${student.father_name} ${className} ${sectionName}`.toLowerCase();
    return searchString.includes(assignedStudentSearchTerm.toLowerCase());
  });

  // Filter available students based on search term
  const filteredAvailableStudents = availableStudents.filter(student => {
    const className = classes.find(c => c.id === student.class_id)?.class_name || '';
    const sectionName = sections.find(s => s.id === student.section_id)?.name || '';
    const searchString = `${student.name} ${student.roll_number} ${student.father_name} ${className} ${sectionName}`.toLowerCase();
    return searchString.includes(studentSearchTerm.toLowerCase());
  });

  const calculateStats = () => {
    try {
      const totalRoutes = routes.length;
      const activeRoutes = routes.filter(route => route.status === 'ACTIVE').length;
      const totalDistance = routes.reduce((sum, route) => sum + (route.distance || 0), 0);
      const assignedDrivers = new Set(routes.filter(route => route.driver_id).map(route => route.driver_id)).size;

      setStats({
        totalRoutes,
        activeRoutes,
        totalDistance: totalDistance.toFixed(2),
        assignedDrivers
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };

  useEffect(() => {
    if (routes.length > 0 || drivers.length > 0) {
      calculateStats();
    } else {
      setStats({
        totalRoutes: 0,
        activeRoutes: 0,
        totalDistance: 0,
        assignedDrivers: 0
      });
    }
  }, [routes, drivers]);

  const columns = [
    { field: 'route_name', headerName: 'Route Name', width: 200 },
    { field: 'distance', headerName: 'Distance (km)', width: 120 },
    { field: 'description', headerName: 'Description', flex: 1, minWidth: 250 },
    {
      field: 'driver_name',
      headerName: 'Assigned Driver',
      width: 180,
      valueGetter: (params) => {
        const driver = drivers.find(d => d.id === params.row.driver_id);
        return driver ? driver.driver_name : 'N/A';
      },
    },
    { field: 'status', headerName: 'Status', width: 100 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150, // Adjusted width to fit icons
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Edit Route">
            <IconButton
              color="primary"
              size="small"
              onClick={() => handleModalOpen(params.row)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="View & Assign Students">
            <IconButton
              color="secondary"
              size="small"
              onClick={() => handleAssignStudentsModalOpen(params.row)}
            >
              <AssignmentIndIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Route">
            <IconButton
              color="error"
              size="small"
              onClick={() => handleDelete(params.row.id)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const getClassName = (classId) => classes.find(c => c.id === classId)?.class_name || 'N/A';
  const getSectionName = (sectionId) => sections.find(s => s.id === sectionId)?.name || 'N/A';
  const getAcademicYearName = (academicYearId) => academicYears.find(ay => ay.id === academicYearId)?.year_name || 'N/A';


  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <MapIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Total Routes</Typography>
              </Box>
              <Typography variant="h4">{stats.totalRoutes}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <DirectionsBusIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Active Routes</Typography>
              </Box>
              <Typography variant="h4">{stats.activeRoutes}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.light', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <SpeedIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Total Distance (km)</Typography>
              </Box>
              <Typography variant="h4">{stats.totalDistance}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.light', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <PersonIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Assigned Drivers</Typography>
              </Box>
              <Typography variant="h4">{stats.assignedDrivers}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs>
          <Typography variant="h4">Transport Routes</Typography>
        </Grid>
        <Grid item>
          <TextField
            size="small"
            placeholder="Search routes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            onClick={() => handleModalOpen()}
          >
            Add Route
          </Button>
        </Grid>
      </Grid>

      <div style={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={filteredRoutes}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5]}
          disableSelectionOnClick
          loading={loading}
          getRowId={(row) => row.id}
        />
      </div>

      {/* Add/Edit Route Modal */}
      <Dialog open={modalOpen} onClose={handleModalClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedRoute ? 'Edit Route' : 'Add Route'}
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
                  label="Route Name"
                  name="route_name"
                  value={formData.route_name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Distance (km)"
                  name="distance"
                  type="number"
                  value={formData.distance}
                  onChange={handleInputChange}
                  required
                  inputProps={{ step: "0.1" }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required={!selectedRoute}>
                  <InputLabel id="driver-label">Assign Driver</InputLabel>
                  <Select
                    labelId="driver-label"
                    id="driver_id"
                    name="driver_id"
                    value={formData.driver_id}
                    onChange={handleInputChange}
                    label="Assign Driver"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {drivers.map((driver) => (
                      <MenuItem key={driver.id} value={driver.id}>
                        {driver.driver_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleModalClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {selectedRoute ? 'Update' : 'Add'} Route
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Assign Students to Route Modal */}
      <Dialog open={assignStudentsModalOpen} onClose={handleAssignStudentsModalClose} maxWidth="md" fullWidth>
        <DialogTitle>
          View and Assign Students to Route: {selectedRouteForStudents?.route_name}
          <IconButton
            onClick={handleAssignStudentsModalClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Assigned Students</Typography>
              <TextField
                fullWidth
                label="Search Assigned Students"
                variant="outlined"
                value={assignedStudentSearchTerm}
                onChange={(e) => setAssignedStudentSearchTerm(e.target.value)}
                sx={{ mb: 1 }}
                InputProps={{
                  endAdornment: (
                    <SearchIcon color="action" />
                  ),
                }}
              />
              {filteredAssignedStudents.length === 0 ? (
                <Typography variant="body2" color="textSecondary">No students assigned to this route or no matching students found.</Typography>
              ) : (
                <List dense sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                  {filteredAssignedStudents.map(item => ( // 'item' now contains transport_mapping_id, facility_mapping_id, student, etc.
                    <ListItem 
                      key={item.student.id} // Use student.id for key
                      secondaryAction={
                        <Tooltip title="Remove from Route">
                          <IconButton 
                            edge="end" 
                            aria-label="remove" 
                            onClick={() => handleRemoveStudentFromRoute(item.student.id, item.facility_mapping_id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      }
                    >
                      <ListItemText
                        primary={
                          <React.Fragment>
                            <Typography component="span" variant="body1" color="text.primary">
                              {item.student.name} ({item.student.roll_number})
                            </Typography>
                          </React.Fragment>
                        }
                        secondary={
                          <React.Fragment>
                            <Typography component="span" variant="body2" color="text.secondary">
                              Class: {getClassName(item.student.class_id)} | Section: {getSectionName(item.student.section_id)}
                            </Typography>
                            <br />
                            <Typography component="span" variant="body2" color="text.secondary">
                              Start Date: {new Date(item.start_date).toLocaleDateString()} | End Date: {item.end_date ? new Date(item.end_date).toLocaleDateString() : 'N/A'} | Status: {item.status}
                            </Typography>
                          </React.Fragment>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Available Students</Typography>
              <TextField
                fullWidth
                label="Search Available Students"
                variant="outlined"
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
                sx={{ mb: 1 }}
                InputProps={{
                  endAdornment: (
                    <SearchIcon color="action" />
                  ),
                }}
              />
              {filteredAvailableStudents.length === 0 ? (
                <Typography variant="body2" color="textSecondary">No available students found or all students are assigned.</Typography>
              ) : (
                <List dense sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                  {filteredAvailableStudents.map(student => (
                    <ListItem
                      key={student.id}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          aria-label="assign"
                          onClick={() => handleToggleStudentSelection(student)}
                          color={selectedStudentsToAssign.some(s => s.id === student.id) ? 'primary' : 'default'}
                        >
                          {selectedStudentsToAssign.some(s => s.id === student.id) ? <RemoveCircleOutlineIcon /> : <AddCircleOutlineIcon />}
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={student.name}
                        secondary={`Roll: ${student.roll_number} | Class: ${getClassName(student.class_id)} | Section: ${getSectionName(student.section_id)} | Father: ${student.father_name}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAssignStudentsModalClose}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAssignSelectedStudents}
            disabled={selectedStudentsToAssign.length === 0}
            startIcon={<CheckCircleOutlineIcon />}
          >
            Assign ({selectedStudentsToAssign.length})
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

export default RouteManager;
