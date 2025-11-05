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
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import SchoolIcon from '@mui/icons-material/School';
import EditIcon from '@mui/icons-material/Edit';

const AcademicYearManager = () => {
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(null);
  const [formData, setFormData] = useState({
    year_name: '', // Updated to year_name
    start_date: '',
    end_date: ''
  });
  const [stats, setStats] = useState({
    totalYears: 0,
    activeYears: 0,
    archivedYears: 0
  });

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  const fetchAcademicYears = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/timetable/academic-years/`);
      setAcademicYears(response.data);
    } catch (error) {
      handleApiError(error, setAlert);
    } finally {
      setLoading(false);
    }
  };

  const handleModalOpen = (yearItem = null) => {
    if (yearItem) {
      setSelectedYear(yearItem);
      setFormData({
        year_name: yearItem.year_name, // Updated to year_name
        // Ensure dates are in YYYY-MM-DD format for input type="date"
        start_date: yearItem.start_date ? yearItem.start_date.split('T')[0] : '',
        end_date: yearItem.end_date ? yearItem.end_date.split('T')[0] : ''
      });
    } else {
      setSelectedYear(null);
      setFormData({
        year_name: '',
        start_date: '',
        end_date: ''
      });
    }
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedYear(null);
    setFormData({
      year_name: '',
      start_date: '',
      end_date: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Helper function to check for overlaps
  const checkOverlap = (newStartDate, newEndDate, currentYearId = null) => {
    const newStart = new Date(newStartDate);
    const newEnd = new Date(newEndDate);

    for (const year of academicYears) {
      // Skip the currently edited year if in edit mode
      if (currentYearId && year.id === currentYearId) {
        continue;
      }

      const existingStart = new Date(year.start_date);
      const existingEnd = new Date(year.end_date);

      // Overlap condition:
      // (newStart <= existingEnd) AND (newEnd >= existingStart)
      if (
        (newStart <= existingEnd && newEnd >= existingStart)
      ) {
        return true; // Overlap detected
      }
    }
    return false; // No overlap
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { year_name, start_date, end_date } = formData;

    // Client-side validation for dates
    if (new Date(start_date) >= new Date(end_date)) {
      setAlert({ open: true, message: 'Start date must be before end date.', severity: 'error' });
      return;
    }

    // Check for overlapping dates
    if (checkOverlap(start_date, end_date, selectedYear ? selectedYear.id : null)) {
      setAlert({ open: true, message: 'The academic year dates overlap with an existing academic year.', severity: 'error' });
      return;
    }

    try {
      const yearData = {
        year_name: year_name.trim(),
        start_date: start_date,
        end_date: end_date
      };

      if (selectedYear) {
        await axiosInstance.put(`${appConfig.API_PREFIX_V1}/timetable/academic-years/${selectedYear.id}/`, yearData);
        setAlert({ open: true, message: 'Academic Year updated successfully!', severity: 'success' });
      } else {
        await axiosInstance.post(`${appConfig.API_PREFIX_V1}/timetable/academic-years/create`, yearData);
        setAlert({ open: true, message: 'Academic Year added successfully!', severity: 'success' });
      }

      handleModalClose();
      fetchAcademicYears();
    } catch (error) {
      handleApiError(error, setAlert);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this academic year?')) {
      try {
        await axiosInstance.delete(`${appConfig.API_PREFIX_V1}/timetable/academic-years/${id}/`);
        setAlert({ open: true, message: 'Academic Year deleted successfully!', severity: 'success' });
        fetchAcademicYears();
      } catch (error) {
        handleApiError(error, setAlert);
      }
    }
  };

  const handleStatusChange = async (id, currentStatus) => {
    const endpoint = currentStatus === 'ACTIVE'
      ? `${appConfig.API_PREFIX_V1}/timetable/academic-years/${id}/deactivate`
      : `${appConfig.API_PREFIX_V1}/timetable/academic-years/${id}/activate`;
    const action = currentStatus === 'ACTIVE' ? 'deactivated' : 'activated';

    try {
      await axiosInstance.post(endpoint);
      setAlert({ open: true, message: `Academic Year ${action} successfully!`, severity: 'success' });
      fetchAcademicYears();
    } catch (error) {
      handleApiError(error, setAlert);
    }
  };

  const filteredYears = academicYears.filter(year =>
    year.year_name.toLowerCase().includes(searchTerm.toLowerCase()) // Corrected to year_name
  );

  const calculateStats = () => {
    try {
      const totalYears = academicYears.length;
      const activeYears = academicYears.filter(year => year.status === 'ACTIVE').length;
      const archivedYears = academicYears.filter(year => year.status === 'ARCHIVED').length;

      setStats({
        totalYears,
        activeYears,
        archivedYears
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };

  useEffect(() => {
    if (academicYears.length > 0) {
      calculateStats();
    } else {
      // Reset stats if no academic years are fetched
      setStats({
        totalYears: 0,
        activeYears: 0,
        archivedYears: 0
      });
    }
  }, [academicYears]);

  const columns = [
    { field: 'year_name', headerName: 'Year Name', width: 150 }, // Updated to year_name
    { field: 'start_date', headerName: 'Start Date', width: 150, valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString() : '' },
    { field: 'end_date', headerName: 'End Date', width: 150, valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString() : '' },
    { field: 'status', headerName: 'Status', width: 150 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 300,
      renderCell: (params) => (
        <div>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => handleModalOpen(params.row)}
            sx={{ mr: 1 }}
            startIcon={<EditIcon />}
          >
            Edit
          </Button>
          <Button
            variant="contained"
            color={params.row.status === 'ACTIVE' ? 'warning' : 'success'}
            size="small"
            onClick={() => handleStatusChange(params.row.id, params.row.status)}
            sx={{ mr: 1 }}
            startIcon={params.row.status === 'ACTIVE' ? <ArchiveIcon /> : <UnarchiveIcon />}
          >
            {params.row.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
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
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <CalendarTodayIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Total Academic Years</Typography>
              </Box>
              <Typography variant="h4">{stats.totalYears}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <SchoolIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Active Years</Typography>
              </Box>
              <Typography variant="h4">{stats.activeYears}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ bgcolor: 'warning.light', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <ArchiveIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Archived Years</Typography>
              </Box>
              <Typography variant="h4">{stats.archivedYears}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs>
          <Typography variant="h4">Academic Years</Typography>
        </Grid>
        <Grid item>
          <TextField
            size="small"
            placeholder="Search academic years..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            onClick={() => handleModalOpen()}
          >
            Add Academic Year
          </Button>
        </Grid>
      </Grid>

      <div style={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={filteredYears}
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
          {selectedYear ? 'Edit Academic Year' : 'Add Academic Year'}
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
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Year Name"
                  name="year_name"
                  value={formData.year_name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Start Date"
                  name="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  required
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="End Date"
                  name="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  required
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleModalClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {selectedYear ? 'Update' : 'Add'} Year
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

export default AcademicYearManager;