import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosConfig';
import appConfig from '../config/appConfig';
import {
  Container, Typography, TextField, Button, Grid, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Card, CardContent, Box
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { handleApiError } from '../utils/errorHandler';
import LocalOfferIcon from '@mui/icons-material/LocalOffer'; // Icon for concessions
import GavelIcon from '@mui/icons-material/Gavel'; // Another relevant icon
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // For active
import InfoIcon from '@mui/icons-material/Info'; // For description
import Papa from 'papaparse'; // Add at the top for CSV parsing

const ConcessionTypeManager = () => {
  const [concessionTypes, setConcessionTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConcessionType, setSelectedConcessionType] = useState(null);
  const [formData, setFormData] = useState({
    concession_name: '',
    description: ''
  });
  const [stats, setStats] = useState({
    totalConcessions: 0,
    activeConcessions: 0,
  });

  useEffect(() => {
    fetchConcessionTypes();
  }, []);

  const fetchConcessionTypes = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/finance/concessions/`);
      setConcessionTypes(response.data);
    } catch (error) {
      handleApiError(error, setAlert);
    } finally {
      setLoading(false);
    }
  };

  const handleModalOpen = (concessionType = null) => {
    if (concessionType) {
      setSelectedConcessionType(concessionType);
      setFormData({
        concession_name: concessionType.concession_name,
        description: concessionType.description
      });
    } else {
      setSelectedConcessionType(null);
      setFormData({
        concession_name: '',
        description: ''
      });
    }
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedConcessionType(null);
    setFormData({
      concession_name: '',
      description: ''
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
      const concessionData = {
        concession_name: formData.concession_name.trim(),
        description: formData.description.trim()
      };

      if (selectedConcessionType) {
        await axiosInstance.put(`${appConfig.API_PREFIX_V1}/finance/concessions/${selectedConcessionType.id}`, concessionData);
        setAlert({ open: true, message: 'Concession Type updated successfully!', severity: 'success' });
      } else {
        await axiosInstance.post(`${appConfig.API_PREFIX_V1}/finance/concessions/`, concessionData);
        setAlert({ open: true, message: 'Concession Type added successfully!', severity: 'success' });
      }

      handleModalClose();
      fetchConcessionTypes();
    } catch (error) {
      handleApiError(error, setAlert);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this concession type?')) {
      try {
        await axiosInstance.delete(`${appConfig.API_PREFIX_V1}/finance/concessions/${id}`);
        setAlert({ open: true, message: 'Concession Type deleted successfully!', severity: 'success' });
        fetchConcessionTypes();
      } catch (error) {
        handleApiError(error, setAlert);
      }
    }
  };

  const filteredConcessionTypes = concessionTypes.filter(type =>
    type.concession_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateStats = () => {
    try {
      const totalConcessions = concessionTypes.length;
      const activeConcessions = concessionTypes.filter(type => type.status === 'ACTIVE').length;

      setStats({
        totalConcessions,
        activeConcessions,
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };

  useEffect(() => {
    if (concessionTypes.length > 0) {
      calculateStats();
    } else {
      setStats({
        totalConcessions: 0,
        activeConcessions: 0,
      });
    }
  }, [concessionTypes]);

  const handleDownloadCSV = () => {
    // Always include header, even if concessionTypes is empty
    const csvData =
      concessionTypes.length > 0
        ? concessionTypes.map(({ concession_name, description }) => ({
            concession_name,
            description,
          }))
        : [{ concession_name: '', description: '' }];
    const csv = Papa.unparse(csvData, {
      header: true,
      skipEmptyLines: true,
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'concession_types.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleUploadCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          // Validate required fields
          const validRows = results.data.filter(
            row => row.concession_name && row.description !== undefined
          );
          if (validRows.length === 0) {
            setAlert({ open: true, message: 'No valid rows found in CSV.', severity: 'error' });
            return;
          }
          await axiosInstance.post(
            `${appConfig.API_PREFIX_V1}/finance/concessions/bulk`,
            validRows
          );
          setAlert({ open: true, message: 'Concession Types uploaded successfully!', severity: 'success' });
          fetchConcessionTypes();
        } catch (error) {
          handleApiError(error, setAlert);
        }
      },
      error: () => {
        setAlert({ open: true, message: 'Failed to parse CSV file.', severity: 'error' });
      }
    });
    // Reset input value so the same file can be uploaded again if needed
    event.target.value = '';
  };

  const columns = [
    { field: 'concession_name', headerName: 'Concession Name', width: 200 },
    { field: 'description', headerName: 'Description', width: 300 },
    { field: 'status', headerName: 'Status', width: 100 },
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
        <Grid item xs={12} sm={6} md={6}>
          <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <LocalOfferIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Total Concession Types</Typography>
              </Box>
              <Typography variant="h4">{stats.totalConcessions}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <CheckCircleIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Active Concessions</Typography>
              </Box>
              <Typography variant="h4">{stats.activeConcessions}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action buttons and search below stats, above table */}
      <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs>
          <Typography variant="h4">Concession Types</Typography>
        </Grid>
        <Grid item>
          <TextField
            size="small"
            placeholder="Search concessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            onClick={() => handleModalOpen()}
          >
            Add Concession Type
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
          rows={filteredConcessionTypes}
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
          {selectedConcessionType ? 'Edit Concession Type' : 'Add Concession Type'}
          <Button
            onClick={handleModalClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            Close
          </Button>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Concession Name"
                  name="concession_name"
                  value={formData.concession_name}
                  onChange={handleInputChange}
                  required
                />
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
              {selectedConcessionType ? 'Update' : 'Add'} Concession
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

export default ConcessionTypeManager;