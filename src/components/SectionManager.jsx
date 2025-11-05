import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container, Typography, TextField, Button, MenuItem, Grid, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Card, CardContent, Box
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { handleApiError } from '../utils/errorHandler';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import GroupsIcon from '@mui/icons-material/Groups';
import BarChartIcon from '@mui/icons-material/BarChart';
import ClassIcon from '@mui/icons-material/Class';
import axiosInstance from '../utils/axiosConfig';
import appConfig from '../config/appConfig';
import Papa from 'papaparse'; // Add at the top for CSV parsing

const SectionManager = () => {
  const [sections, setSections] = useState([]);
  const [classes, setClasses] = useState([]); // This will hold the classes with 'class_name'
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    class_id: ''
  });
  const [stats, setStats] = useState({
    totalSections: 0,
    totalStudents: 0,
    averageStudents: 0,
    classesWithSections: 0
  });
  const [academicYears, setAcademicYears] = useState([]); // Add this line

  useEffect(() => {
    fetchSections();
    fetchClasses();
    fetchStudents();
    fetchAcademicYears(); // Add this line
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/academic/students/`);
      setStudents(response.data);
    } catch (error) {
      handleApiError(error, setAlert);
    }
  };

  const fetchSections = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/academic/sections/`);
      setSections(response.data);
    } catch (error) {
      handleApiError(error, setAlert);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      // Assuming this endpoint returns objects with 'class_name' as previously discussed
      const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/academic/classes/`);
      setClasses(response.data);
    } catch (error) {
      handleApiError(error, setAlert);
    }
  };

  // Add this function to fetch academic years
  const fetchAcademicYears = async () => {
    try {
      const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/timetable/academic-years/`);
      setAcademicYears(response.data);
    } catch (error) {
      handleApiError(error, setAlert);
    }
  };

  const handleModalOpen = (section = null) => {
    if (section) {
      setSelectedSection(section);
      setFormData({
        name: section.name,
        class_id: section.class_id
      });
    } else {
      setSelectedSection(null);
      setFormData({
        name: '',
        class_id: ''
      });
    }
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedSection(null);
    setFormData({
      name: '',
      class_id: ''
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
      const sectionData = {
        name: formData.name.trim(),
        class_id: formData.class_id
      };

      if (selectedSection) {
        // API for PUT request uses 'name' and 'class_id'
        await axiosInstance.put(`${appConfig.API_PREFIX_V1}/academic/sections/${selectedSection.id}`, sectionData);
        setAlert({ open: true, message: 'Section updated successfully!', severity: 'success' });
      } else {
        // API for POST request uses 'name' and 'class_id'
        await axiosInstance.post(`${appConfig.API_PREFIX_V1}/academic/sections/`, sectionData);
        setAlert({ open: true, message: 'Section added successfully!', severity: 'success' });
      }

      handleModalClose();
      fetchSections();
    } catch (error) {
      handleApiError(error, setAlert);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this section?')) {
      try {
        await axiosInstance.delete(`${appConfig.API_PREFIX_V1}/academic/sections/${id}`);
        setAlert({ open: true, message: 'Section deleted successfully!', severity: 'success' });
        fetchSections();
      } catch (error) {
        handleApiError(error, setAlert);
      }
    }
  };

  // CSV Download Handler
  const handleDownloadCSV = () => {
    // Always include header, even if sections is empty
    const csvData =
      sections.length > 0
        ? sections.map(section => {
            const cls = classes.find(c => c.id === section.class_id);
            const year = cls && academicYears.find(y => y.id === cls.academic_year_id);
            return {
              class_name: cls ? cls.class_name : '',
              section_name: section.name || '',
              academic_year: year ? year.year_name : '',
            };
          })
        : [{ class_name: '', section_name: '', academic_year: '' }];
    const csv = Papa.unparse(csvData, {
      header: true,
      skipEmptyLines: true,
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sections.csv');
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
        `${appConfig.API_PREFIX_V1}/academic/sections/bulk-csv`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setAlert({ open: true, message: 'Sections uploaded successfully!', severity: 'success' });
      fetchSections();
    } catch (error) {
      handleApiError(error, setAlert);
    }
    // Reset input value so the same file can be uploaded again if needed
    event.target.value = '';
  };

  const filteredSections = sections.filter(section => {
    // Access section.name directly as per the API response
    const sectionName = section.name ? section.name.toLowerCase() : '';
    // Find the class by class_id and access its 'class_name' property
    const className = classes.find(c => c.id === section.class_id)?.class_name || ''; // Use class_name
    const searchString = (sectionName + className.toLowerCase());
    return searchString.includes(searchTerm.toLowerCase());
  });

  const calculateStats = () => {
    try {
      if (!sections.length && !students.length) return; // Only return if both are empty to avoid div by zero

      const totalSections = sections.length;
      const totalStudents = students.length;
      const averageStudents = totalSections ? Math.round(totalStudents / totalSections) : 0;
      const classesWithSections = new Set(sections.map(section => section.class_id)).size;

      setStats({
        totalSections,
        totalStudents,
        averageStudents,
        classesWithSections
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };

  useEffect(() => {
    // Calculate stats when sections or students data changes
    calculateStats();
  }, [sections, students]);

  const columns = [
    { field: 'name', headerName: 'Section Name', width: 150 }, // 'name' is correct for sections
    {
      field: 'class_name', // This is a virtual field for display
      headerName: 'Class',
      width: 150,
      valueGetter: (params) => {
        // Find the class using class_id from the section object
        const cls = classes.find(c => c.id === params.row.class_id);
        // Return 'class_name' from the found class object
        return cls ? cls.class_name : ''; // Use class_name
      }
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

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <ViewWeekIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Total Sections</Typography>
              </Box>
              <Typography variant="h4">{stats.totalSections}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <GroupsIcon sx={{ mr: 1 }} />
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
                <BarChartIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Avg. Students/Section</Typography>
              </Box>
              <Typography variant="h4">{stats.averageStudents}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.light', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <ClassIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Classes with Sections</Typography>
              </Box>
              <Typography variant="h4">{stats.classesWithSections}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs>
          <Typography variant="h4">Sections</Typography>
        </Grid>
        <Grid item>
          <TextField
            size="small"
            placeholder="Search sections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            onClick={() => handleModalOpen()}
          >
            Add Section
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
          rows={filteredSections}
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
          {selectedSection ? 'Edit Section' : 'Add Section'}
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
                  label="Section Name"
                  name="name" // 'name' is correct for sections
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Class"
                  name="class_id"
                  value={formData.class_id}
                  onChange={handleInputChange}
                  required
                >
                  {classes.map((cls) => (
                    // Displaying 'class_name' from the class object
                    <MenuItem key={cls.id} value={cls.id}>
                      {cls.class_name} {/* Use class_name from ClassManager fix */}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleModalClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {selectedSection ? 'Update' : 'Add'} Section
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

export default SectionManager;