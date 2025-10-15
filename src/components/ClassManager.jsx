import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosConfig';
import appConfig from '../config/appConfig';
import {
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Box
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { handleApiError } from '../utils/errorHandler';
import ClassIcon from '@mui/icons-material/Class';
import GroupIcon from '@mui/icons-material/Group';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import SchoolIcon from '@mui/icons-material/School';
import Papa from 'papaparse'; // Add at the top for CSV parsing

const ClassManager = () => {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);
  const [formData, setFormData] = useState({
    class_name: '', // Changed from 'name' to 'class_name'
    academic_year_id: ''
  });
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    averageStudents: 0,
    activeClasses: 0
  });

  useEffect(() => {
    fetchClasses();
    fetchAcademicYears();
    fetchStudents();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/students/classes/`);
      setClasses(response.data);
    } catch (error) {
      handleApiError(error, setAlert);
    } finally {
      setLoading(false);
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const response = await  axiosInstance.get(`${appConfig.API_PREFIX_V1}/timetable/academic-years/`);
      setAcademicYears(response.data);
    } catch (error) {
      handleApiError(error, setAlert);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/students/`);
      setStudents(response.data);
    } catch (error) {
      handleApiError(error, setAlert);
    }
  };

  const handleModalOpen = (classItem = null) => {
    if (classItem) {
      setSelectedClass(classItem);
      setFormData({
        class_name: classItem.class_name, // Changed from classItem.name
        academic_year_id: classItem.academic_year_id
      });
    } else {
      setSelectedClass(null);
      setFormData({
        class_name: '', // Changed from 'name'
        academic_year_id: ''
      });
    }
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedClass(null);
    setFormData({
      class_name: '', // Changed from 'name'
      academic_year_id: ''
    });
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
      const classData = {
        class_name: formData.class_name.trim(), // Changed from formData.name.trim()
        academic_year_id: formData.academic_year_id
      };

      if (selectedClass) {
        await axiosInstance.put(`${appConfig.API_PREFIX_V1}/students/classes/${selectedClass.id}`, classData);
        setAlert({ open: true, message: 'Class updated successfully!', severity: 'success' });
      } else {
        await axiosInstance.post(`${appConfig.API_PREFIX_V1}/students/classes/`, classData);
        setAlert({ open: true, message: 'Class added successfully!', severity: 'success' });
      }

      handleModalClose();
      fetchClasses();
    } catch (error) {
      handleApiError(error, setAlert);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        await axiosInstance.delete(`${appConfig.API_PREFIX_V1}/students/classes/${id}`);
        setAlert({ open: true, message: 'Class deleted successfully!', severity: 'success' });
        fetchClasses();
      } catch (error) {
        handleApiError(error, setAlert);
      }
    }
  };

  const filteredClasses = classes.filter(cls =>
    cls.class_name.toLowerCase().includes(searchTerm.toLowerCase()) // Changed from cls.name
  );

  const calculateStats = () => {
    try {
      const totalClasses = classes.length;
      // Assuming 'status' field indicates if a class is active based on the provided API response
      const activeClasses = classes.filter(cls => cls.status === 'ACTIVE').length; // Corrected to use 'status'
      const totalStudents = students.length;
      const averageStudents = totalClasses ? Math.round(totalStudents / totalClasses) : 0;

      setStats({
        totalClasses,
        totalStudents,
        averageStudents,
        activeClasses
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };

  useEffect(() => {
    // Ensure both classes and students are fetched before calculating stats
    if (classes.length > 0 || students.length > 0) { // Calculate even if one is empty
      calculateStats();
    } else {
      // Reset stats if no data is available
      setStats({
        totalClasses: 0,
        totalStudents: 0,
        averageStudents: 0,
        activeClasses: 0
      });
    }
  }, [classes, students]);

  const columns = [
    { field: 'class_name', headerName: 'Name', width: 150 }, // Changed from 'name'
    {
      field: 'academic_year',
      headerName: 'Academic Year',
      width: 150,
      valueGetter: (params) => {
        // Ensure academicYears is loaded and then find the year by ID
        const year = academicYears.find(y => y.id === params.row.academic_year_id);
        // Use 'year_name' from AcademicYearManager.jsx's API response
        return year ? year.year_name : '';
      }
    },
    {
      field: 'status', // Added status column as per API response
      headerName: 'Status',
      width: 100,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => (
        <div>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => handleModalOpen(params.row)}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={() => handleDelete(params.row.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  // CSV Download Handler
  const handleDownloadCSV = () => {
    // Always include header, even if classes is empty
    const csvData =
      classes.length > 0
        ? classes.map(cls => {
            const year = academicYears.find(y => y.id === cls.academic_year_id);
            return {
              class_name: cls.class_name,
              academic_year: year ? year.year_name : '',
            };
          })
        : [{ class_name: '', academic_year: '' }];
    const csv = Papa.unparse(csvData, {
      header: true,
      skipEmptyLines: true,
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'classes.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // CSV Upload Handler
  const handleUploadCSV = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file, file.name);

    try {
      await axiosInstance.post(
        `${appConfig.API_PREFIX_V1}/students/classes/bulk_upload_csv/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setAlert({ open: true, message: 'Classes uploaded successfully!', severity: 'success' });
      fetchClasses();
    } catch (error) {
      handleApiError(error, setAlert);
    }
    // Reset input value so the same file can be uploaded again if needed
    event.target.value = '';
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <ClassIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Total Classes</Typography>
              </Box>
              <Typography variant="h4">{stats.totalClasses}</Typography>
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
              <Typography variant="h4">{stats.totalStudents}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.light', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <AutoStoriesIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Avg. Students/Class</Typography>
              </Box>
              <Typography variant="h4">{stats.averageStudents}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.light', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <SchoolIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Active Classes</Typography>
              </Box>
              <Typography variant="h4">{stats.activeClasses}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action buttons and search below stats, above table */}
      <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs>
          <Typography variant="h4">Classes</Typography>
        </Grid>
        <Grid item>
          <TextField
            size="small"
            placeholder="Search classes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            onClick={() => handleModalOpen()}
          >
            Add Class
          </Button>
        </Grid>
        <Grid item>
          <Button variant="outlined" onClick={handleDownloadCSV}>
            Download CSV
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="outlined"
            component="label"
          >
            Upload CSV
            <input
              type="file"
              accept=".csv"
              hidden
              onChange={handleUploadCSV}
              data-testid="upload-csv-input"
            />
          </Button>
        </Grid>
      </Grid>

      <div style={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={filteredClasses}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5]}
          disableSelectionOnClick
          loading={loading}
          getRowId={(row) => row.id}
        />
      </div>

      <Dialog open={modalOpen} onClose={handleModalClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedClass ? 'Edit Class' : 'Add Class'}
          <Button
            onClick={handleModalClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            Close
          </Button>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Class Name" // Changed label
                  name="class_name" // Changed name
                  value={formData.class_name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Academic Year"
                  name="academic_year_id"
                  value={formData.academic_year_id}
                  onChange={handleInputChange}
                  required
                >
                  {academicYears.map((year) => (
                    // Using year.year_name for display based on AcademicYearManager.jsx fix
                    <MenuItem key={year.id} value={year.id}>
                      {year.year_name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleModalClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {selectedClass ? 'Update' : 'Add'} Class
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
    </Container>
  );
};

export default ClassManager;