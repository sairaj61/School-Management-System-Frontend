import { useState, useEffect } from 'react';
import {
  Container, Typography, TextField, Button, Grid, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Box, Paper, Card, CardContent,
  IconButton, Chip, Table, TableHead, TableBody, TableRow, TableCell, Autocomplete
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { handleApiError } from '../utils/errorHandler';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import GroupIcon from '@mui/icons-material/Group';
import CloseIcon from '@mui/icons-material/Close';
import PaymentIcon from '@mui/icons-material/Payment';
import { Checkbox } from '@mui/material';
import axiosInstance from '../utils/axiosConfig';
import appConfig from '../config/appConfig';

const AutoManager = () => {
  const [autos, setAutos] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [modalOpen, setModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAuto, setSelectedAuto] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [formData, setFormData] = useState({
    name: ''
  });
  const [viewStudentsModalOpen, setViewStudentsModalOpen] = useState(false);
  const [selectedAutoStudents, setSelectedAutoStudents] = useState([]);
  const [stats, setStats] = useState({
    totalAutos: 0,
    totalStudents: 0,
    totalFees: 0,
    activeAutos: 0
  });
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchStudentTerm, setSearchStudentTerm] = useState('');
  const [filteredAssignStudents, setFilteredAssignStudents] = useState([]);

  useEffect(() => {
    fetchAutos();
    fetchStudents();
  }, []);

  useEffect(() => {
    // Initialize filtered students when students list changes
    setFilteredAssignStudents(students);
  }, [students]);

  const calculateStats = (autoData) => {
    if (!autoData || !Array.isArray(autoData)) {
      setStats({
        totalAutos: 0,
        totalStudents: 0,
        totalFees: 0,
        activeAutos: 0
      });
      return;
    }

    const stats = {
      totalAutos: autoData.length,
      totalStudents: autoData.reduce((sum, auto) => sum + (auto.students?.length || 0), 0),
      totalFees: autoData.reduce((sum, auto) => sum + (auto.total_fees || 0), 0),
      activeAutos: autoData.filter(auto => auto.students?.length > 0).length
    };
    setStats(stats);
  };

  const fetchAutos = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/academic/transport/autos`);
      const autoData = response.data || [];
      setAutos(autoData);
      calculateStats(autoData);
    } catch (error) {
      handleApiError(error, setAlert);
      setAutos([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/academic/`);
      setStudents(response.data);
    } catch (error) {
      handleApiError(error, setAlert);
    }
  };

  const handleModalOpen = (auto = null) => {
    if (auto) {
      setSelectedAuto(auto);
      setFormData({
        name: auto.name
      });
    } else {
      setSelectedAuto(null);
      setFormData({
        name: ''
      });
    }
    setModalOpen(true);
  };

  const handleAssignModalOpen = (auto) => {
    setSelectedAuto(auto);
    setSelectedStudents(auto?.students || []);
    setAssignModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedAuto(null);
    setFormData({ name: '' });
  };

  const handleAssignModalClose = () => {
    setAssignModalOpen(false);
    setSelectedAuto(null);
    setSelectedStudents([]);
    setSearchStudentTerm('');
    setFilteredAssignStudents(students);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStudentSelection = (e) => {
    setSelectedStudents(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedAuto) {
        await axiosInstance.put(`${appConfig.API_PREFIX_V1}/academic/transport/autos/${selectedAuto.id}`, formData);
        setAlert({ open: true, message: 'Auto updated successfully!', severity: 'success' });
      } else {
        await axiosInstance.post(`${appConfig.API_PREFIX_V1}/academic/transport/autos`, formData);
        setAlert({ open: true, message: 'Auto added successfully!', severity: 'success' });
      }
      handleModalClose();
      fetchAutos();
    } catch (error) {
      handleApiError(error, setAlert);
    }
  };

  const handleAssignSubmit = async () => {
    try {
      await axiosInstance.post(
        `${appConfig.API_PREFIX_V1}/academic/transport/autos/${selectedAuto.id}/assign-students`, 
        { student_ids: selectedStudents }
      );
      
      setAlert({ 
        open: true, 
        message: 'Students assigned successfully!', 
        severity: 'success' 
      });
      
      handleAssignModalClose();
      fetchAutos();
    } catch (error) {
      handleApiError(error, setAlert);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this auto? This will remove all student assignments.')) {
      try {
        setLoading(true);
        await axiosInstance.delete(`${appConfig.API_PREFIX_V1}/academic/transport/autos/${id}`);
        setAlert({ 
          open: true, 
          message: 'Auto and its assignments deleted successfully!', 
          severity: 'success' 
        });
        await fetchAutos(); // Refresh the list
      } catch (error) {
        handleApiError(error, setAlert);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleViewStudentsModalOpen = (auto) => {
    setSelectedAuto(auto);
    setViewStudentsModalOpen(true);
  };

  const handleViewStudentsModalClose = () => {
    setViewStudentsModalOpen(false);
    setSelectedAuto(null);
  };

  const ViewStudentsModal = ({ auto, open, onClose }) => {
    const studentDetails = auto?.student_details || [];
    
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Students in {auto?.name}
              <Chip 
                label={`Total: ₹${auto?.total_fees?.toLocaleString()}`}
                color="success"
                sx={{ ml: 2 }}
              />
            </Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Roll No.</TableCell>
                <TableCell>Student Name</TableCell>
                <TableCell>Class</TableCell>
                <TableCell>Section</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Address</TableCell>
                <TableCell align="right">Auto Fee</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {studentDetails.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>{student.roll_number}</TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>{student.class_name}</TableCell>
                  <TableCell>{student.section_name}</TableCell>
                  <TableCell>{student.contact_number}</TableCell>
                  <TableCell>{student.address}</TableCell>
                  <TableCell align="right">
                    <Typography color="success.main" fontWeight="medium">
                      ₹{student.auto_fees.toLocaleString()}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
              {studentDetails.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary">No students assigned</Typography>
                  </TableCell>
                </TableRow>
              )}
              {studentDetails.length > 0 && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ fontWeight: 'bold' }}>
                    Total Revenue
                  </TableCell>
                  <TableCell align="right">
                    <Typography color="success.main" fontWeight="bold">
                      ₹{auto?.total_fees?.toLocaleString()}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    );
  };

  const columns = [
    { 
      field: 'name', 
      headerName: 'Auto Name', 
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DirectionsBusIcon color="primary" />
          <Typography>{params.value}</Typography>
        </Box>
      )
    },
    {
      field: 'studentCount',
      headerName: 'Students',
      width: 120,
      valueGetter: (params) => params.row.students.length,
      renderCell: (params) => (
        <Chip
          label={`${params.value} students`}
          color={params.value > 0 ? "primary" : "default"}
          size="small"
        />
      )
    },
    {
      field: 'total_fees',
      headerName: 'Monthly Revenue',
      width: 150,
      renderCell: (params) => (
        <Typography color={params.value > 0 ? "success.main" : "text.secondary"} fontWeight="medium">
          ₹{params.value.toLocaleString()}
        </Typography>
      )
    },
    {
      field: 'avgFees',
      headerName: 'Avg. Fee/Student',
      width: 150,
      valueGetter: (params) => {
        const count = params.row.students.length;
        return count > 0 ? Math.round(params.row.total_fees / count) : 0;
      },
      renderCell: (params) => (
        <Typography color={params.value > 0 ? "info.main" : "text.secondary"}>
          ₹{params.value.toLocaleString()}
        </Typography>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 450,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'nowrap' }}>
          <Button
            variant="contained"
            size="small"
            onClick={() => handleModalOpen(params.row)}
          >
            Edit
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => handleAssignModalOpen(params.row)}
          >
            Assign Students
          </Button>
          <Button
            variant="contained"
            color="info"
            size="small"
            onClick={() => handleViewStudentsModalOpen(params.row)}
          >
            View Students
          </Button>
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={() => handleDelete(params.row.id)}
          >
            Delete
          </Button>
        </Box>
      ),
    },
  ];

  const filteredAutos = autos.filter(auto => 
    auto?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStudentSearch = (event, value) => {
    setSearchTerm(value);
    if (!value) {
      setFilteredStudents(students);
      return;
    }
    
    const filtered = students.filter(student => 
      student.name.toLowerCase().includes(value.toLowerCase()) ||
      student.roll_number?.toLowerCase().includes(value.toLowerCase()) ||
      student.father_name?.toLowerCase().includes(value.toLowerCase()) ||
      student.class_name?.toLowerCase().includes(value.toLowerCase()) ||
      student.section_name?.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredStudents(filtered);
  };

  const handleStudentSearchAssign = (event, value) => {
    setSearchStudentTerm(value);
    if (!value) {
      setFilteredAssignStudents(students);
      return;
    }
    
    const filtered = students.filter(student => 
      student.name?.toLowerCase().includes(value.toLowerCase()) ||
      student.roll_number?.toLowerCase().includes(value.toLowerCase()) ||
      student.father_name?.toLowerCase().includes(value.toLowerCase()) ||
      student.class_name?.toLowerCase().includes(value.toLowerCase()) ||
      student.section_name?.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredAssignStudents(filtered);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <DirectionsBusIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Total Autos</Typography>
              </Box>
              <Typography variant="h3">{stats.totalAutos}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <GroupIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Total Students</Typography>
              </Box>
              <Typography variant="h3">{stats.totalStudents}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.light', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <DirectionsBusIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Active Autos</Typography>
              </Box>
              <Typography variant="h3">{stats.activeAutos}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.light', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <PaymentIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Monthly Revenue</Typography>
              </Box>
              <Typography variant="h3">₹{stats.totalFees.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs>
          <Typography variant="h4">Auto Management</Typography>
        </Grid>
        <Grid item>
          <TextField
            size="small"
            placeholder="Search autos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 200 }}
          />
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            onClick={() => handleModalOpen()}
          >
            Add Auto
          </Button>
        </Grid>
      </Grid>

      <div style={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={filteredAutos}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5]}
          disableSelectionOnClick
          loading={loading}
          getRowId={(row) => row?.id}
          error={alert.severity === 'error' ? alert.message : null}
        />
      </div>

      {/* Add/Edit Auto Modal */}
      <Dialog open={modalOpen} onClose={handleModalClose}>
        <DialogTitle>{selectedAuto ? 'Edit Auto' : 'Add Auto'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Auto Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleModalClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {selectedAuto ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Student Assignment Dialog */}
      <Dialog 
        open={assignModalOpen}
        onClose={handleAssignModalClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Assign Students to {selectedAuto?.name}
          <IconButton
            onClick={handleAssignModalClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* Add Autocomplete for search */}
            <Autocomplete
              fullWidth
              options={students}
              getOptionLabel={(student) => 
                `${student.name} - ${student.roll_number} (${student.class_name} - ${student.section_name})`
              }
              renderOption={(props, student) => (
                <Box component="li" {...props}>
                  <Box>
                    <Typography variant="subtitle1">
                      {student.name} ({student.roll_number})
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Class: {student.class_name} | Section: {student.section_name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Father's Name: {student.father_name}
                    </Typography>
                  </Box>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search Students"
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
              )}
              onChange={(event, newValue) => {
                if (newValue) {
                  // Add student to selection if not already selected
                  if (!selectedStudents.includes(newValue.id)) {
                    setSelectedStudents([...selectedStudents, newValue.id]);
                  }
                }
              }}
            />

            {/* Display selected and filtered students */}
            <Box sx={{ maxHeight: '400px', overflow: 'auto', mt: 2 }}>
              {students
                .filter(student => 
                  selectedStudents.includes(student.id) || 
                  student.name?.toLowerCase().includes(searchStudentTerm.toLowerCase()) ||
                  student.roll_number?.toLowerCase().includes(searchStudentTerm.toLowerCase()) ||
                  student.class_name?.toLowerCase().includes(searchStudentTerm.toLowerCase()) ||
                  student.section_name?.toLowerCase().includes(searchStudentTerm.toLowerCase())
                )
                .map((student) => (
                  <Paper 
                    key={student.id} 
                    sx={{ 
                      p: 2, 
                      mb: 1, 
                      display: 'flex', 
                      alignItems: 'center',
                      backgroundColor: selectedStudents.includes(student.id) ? '#e3f2fd' : 'white'
                    }}
                  >
                    <Checkbox
                      checked={selectedStudents.includes(student.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudents([...selectedStudents, student.id]);
                        } else {
                          setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                        }
                      }}
                    />
                    <Box sx={{ ml: 2 }}>
                      <Typography variant="subtitle1">
                        {student.name} ({student.roll_number})
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Class: {student.class_name} | Section: {student.section_name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Father's Name: {student.father_name}
                      </Typography>
                    </Box>
                  </Paper>
                ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAssignModalClose} color="secondary">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAssignSubmit}
            disabled={selectedStudents.length === 0}
          >
            Assign {selectedStudents.length} Student(s)
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Students Modal */}
      <ViewStudentsModal
        auto={selectedAuto}
        open={viewStudentsModalOpen}
        onClose={handleViewStudentsModalClose}
      />

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
    </Container>
  );
};

export default AutoManager;