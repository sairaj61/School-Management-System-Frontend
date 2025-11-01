import React, { useState, useEffect } from 'react';
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
import ClassIcon from '@mui/icons-material/Class';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import CategoryIcon from '@mui/icons-material/Category';
import { handleApiError } from '../utils/errorHandler';

const SUBJECT_CATEGORIES = [
  'ACADEMIC',
  'ACTIVITY',
  'ELECTIVE',
  'VOCATIONAL',
  'LIFE_SKILLS',
  'SPORTS',
  'CULTURAL',
  'TECHNICAL',
  'LANGUAGE',
  'MORAL_EDUCATION',
  'SPECIAL_EDUCATION',
];

const SubjectManager = () => {
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: '',
    class_id: '',
    section_id: '',
  });

  useEffect(() => {
    fetchSubjects();
    fetchClasses();
    fetchSections();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/academic/subject/`);
      setSubjects(response.data);
    } catch (error) {
      handleApiError(error, setAlert);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/academic/classes/`);
      setClasses(response.data);
    } catch (error) {
      handleApiError(error, setAlert);
    }
  };

  const fetchSections = async () => {
    try {
      const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/academic/sections/`);
      setSections(response.data);
    } catch (error) {
      handleApiError(error, setAlert);
    }
  };

  const handleModalOpen = (subject = null) => {
    if (subject) {
      setSelectedSubject(subject);
      setFormData({
        name: subject.name,
        code: subject.code,
        category: subject.category,
        class_id: subject.class_id || '',
        section_id: subject.section_id || '',
      });
    } else {
      setSelectedSubject(null);
      setFormData({
        name: '',
        code: '',
        category: '',
        class_id: '',
        section_id: '',
      });
    }
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedSubject(null);
    setFormData({
      name: '',
      code: '',
      category: '',
      class_id: '',
      section_id: '',
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
      const subjectData = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        category: formData.category,
        class_id: formData.class_id || null,
        section_id: formData.section_id || null,
      };
      await axiosInstance.post(`${appConfig.API_PREFIX_V1}/academic/subject/`, subjectData);
      setAlert({ open: true, message: 'Subject added successfully!', severity: 'success' });
      handleModalClose();
      fetchSubjects();
    } catch (error) {
      handleApiError(error, setAlert);
    }
  };

  const filteredSubjects = subjects.filter(subj =>
    subj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subj.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { field: 'name', headerName: 'Name', width: 150 },
    { field: 'code', headerName: 'Code', width: 120 },
    { field: 'category', headerName: 'Category', width: 150 },
    {
      field: 'class_id',
      headerName: 'Class',
      width: 150,
      valueGetter: (params) => {
        const cls = classes.find(c => c.id === params.row.class_id);
        return cls ? cls.class_name : '';
      }
    },
    {
      field: 'section_id',
      headerName: 'Section',
      width: 150,
      valueGetter: (params) => {
        const sec = sections.find(s => s.id === params.row.section_id);
        return sec ? sec.name : '';
      }
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Subjects</Typography>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs>
          <TextField
            size="small"
            placeholder="Search subjects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Grid>
        <Grid item>
          <Button variant="contained" onClick={() => handleModalOpen()}>
            Add Subject
          </Button>
        </Grid>
      </Grid>
      <div style={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={filteredSubjects}
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
          {selectedSubject ? 'Edit Subject' : 'Add Subject'}
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
                  label="Subject Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Subject Code"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  {SUBJECT_CATEGORIES.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Class"
                  name="class_id"
                  value={formData.class_id}
                  onChange={handleInputChange}
                >
                  <MenuItem value="">None</MenuItem>
                  {classes.map((cls) => (
                    <MenuItem key={cls.id} value={cls.id}>{cls.class_name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Section"
                  name="section_id"
                  value={formData.section_id}
                  onChange={handleInputChange}
                >
                  <MenuItem value="">None</MenuItem>
                  {sections.map((sec) => (
                    <MenuItem key={sec.id} value={sec.id}>{sec.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleModalClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {selectedSubject ? 'Update' : 'Add'} Subject
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

export default SubjectManager;
