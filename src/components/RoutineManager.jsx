import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Button,
  TextField,
  MenuItem,
  Box,
  Paper,
  IconButton,
  Chip,
  Snackbar
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import appConfig from '../config/appConfig';
import { handleApiError } from '../utils/errorHandler';
const ROUTINE_DAYS = [
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
];

// Remove static demo data, will fetch from API

import axiosInstance from '../utils/axiosConfig';

const RoutineManager = () => {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [staff, setStaff] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [routineData, setRoutineData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [weeklyEntries, setWeeklyEntries] = useState([]); // For creating weekly routine
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });

  // Fetch classes, subjects, staff on mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/academic/classes/`);
        setClasses(response.data);
      } catch (error) {
        handleApiError(error, setError);
      }
    };
    const fetchSubjects = async () => {
      try {
        const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/academic/subject/`);
        setSubjects(response.data);
      } catch (error) {
        handleApiError(error, setError);
      }
    };
    const fetchStaff = async () => {
      try {
        const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/administrative/staff/teaching`);
        setStaff(response.data);
      } catch (error) {
        handleApiError(error, setError);
      }
    };
    fetchClasses();
    fetchSubjects();
    fetchStaff();
  }, []);

  // Fetch sections when class changes
  useEffect(() => {
    if (!selectedClass) {
      setSections([]);
      setSelectedSection('');
      return;
    }
    const fetchSectionsByClass = async (classId) => {
      try {
        const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/academic/sections/by-class/${classId}`);
        setSections(response.data);
      } catch (error) {
        handleApiError(error, setError);
      }
    };
    fetchSectionsByClass(selectedClass);
  }, [selectedClass]);

  // Fetch routine for selected section
  useEffect(() => {
    if (!selectedSection) {
      setRoutineData([]);
      return;
    }
    setLoading(true);
    axiosInstance.get(`${appConfig.API_PREFIX_V1}/academic/routine/section/${selectedSection}`)
      .then(res => {
        setRoutineData(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch routine');
        setLoading(false);
      });
  }, [selectedSection]);

  // Add/Remove/Update weekly entries
  const addWeeklyEntry = (day) => {
    setWeeklyEntries(prev => ([...prev, {
      day,
      period_number: '',
      subject_id: '',
      start_time: '',
      end_time: '',
      remarks: '',
      staff_assignments: [],
    }]));
  };
  const removeWeeklyEntry = (idx) => {
    setWeeklyEntries(prev => prev.filter((_, i) => i !== idx));
  };
  const updateWeeklyEntry = (idx, field, value) => {
    setWeeklyEntries(prev => prev.map((entry, i) => i === idx ? { ...entry, [field]: value } : entry));
  };
  const addStaffToEntry = (idx, staffId) => {
    setWeeklyEntries(prev => prev.map((entry, i) => i === idx ? {
      ...entry,
      staff_assignments: [...entry.staff_assignments, { staff_id: staffId, priority: 1, is_substitute: 0, remarks: '' }]
    } : entry));
  };
  const removeStaffFromEntry = (idx, staffId) => {
    setWeeklyEntries(prev => prev.map((entry, i) => i === idx ? {
      ...entry,
      staff_assignments: entry.staff_assignments.filter(s => s.staff_id !== staffId)
    } : entry));
  };

  // Save weekly routine
  const handleSaveWeeklyRoutine = async () => {
    if (!selectedClass || !selectedSection || weeklyEntries.length === 0) {
      setAlert({ open: true, message: 'Please select class, section and add at least one entry.', severity: 'error' });
      return;
    }
    setSaving(true);
    try {
      await axiosInstance.post(`${appConfig.API_PREFIX_V1}/academic/routine/weekly`, {
        class_id: selectedClass,
        section_id: selectedSection,
        entries: weeklyEntries.map(e => ({
          ...e,
          period_number: Number(e.period_number),
        }))
      });
      setAlert({ open: true, message: 'Weekly routine created successfully!', severity: 'success' });
      setWeeklyEntries([]);
      // Optionally refresh routineData
      setLoading(true);
      const res = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/academic/routine/section/${selectedSection}`);
      setRoutineData(res.data);
      setLoading(false);
    } catch (error) {
      handleApiError(error, setAlert);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Routine Manager</Typography>
      {loading && <Typography>Loading...</Typography>}
      {error && <Typography color="error">{error}</Typography>}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            select
            fullWidth
            label="Class"
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
          >
            <MenuItem value="">Select Class</MenuItem>
            {classes.map(cls => (
              <MenuItem key={cls.id} value={cls.id}>{cls.class_name || cls.name}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            select
            fullWidth
            label="Section"
            value={selectedSection}
            onChange={e => setSelectedSection(e.target.value)}
            disabled={!selectedClass}
          >
            <MenuItem value="">Select Section</MenuItem>
            {sections.map(sec => (
              <MenuItem key={sec.id} value={sec.id}>{sec.name}</MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      {/* Weekly Routine Creation UI */}
      <Paper sx={{ mb: 4, p: 3, background: '#f9f9f9' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Create Weekly Routine</Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12}>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => addWeeklyEntry('MONDAY')}>Add Monday Period</Button>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => addWeeklyEntry('TUESDAY')} sx={{ ml: 1 }}>Add Tuesday Period</Button>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => addWeeklyEntry('WEDNESDAY')} sx={{ ml: 1 }}>Add Wednesday Period</Button>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => addWeeklyEntry('THURSDAY')} sx={{ ml: 1 }}>Add Thursday Period</Button>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => addWeeklyEntry('FRIDAY')} sx={{ ml: 1 }}>Add Friday Period</Button>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => addWeeklyEntry('SATURDAY')} sx={{ ml: 1 }}>Add Saturday Period</Button>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => addWeeklyEntry('SUNDAY')} sx={{ ml: 1 }}>Add Sunday Period</Button>
          </Grid>
        </Grid>
        {weeklyEntries.length > 0 && (
          <Box sx={{ mt: 3 }}>
            {weeklyEntries.map((entry, idx) => (
              <Paper key={idx} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={2}>
                    <Typography><b>Day:</b> {entry.day}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <TextField
                      label="Period #"
                      type="number"
                      value={entry.period_number}
                      onChange={e => updateWeeklyEntry(idx, 'period_number', e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <TextField
                      label="Start Time"
                      type="time"
                      value={entry.start_time}
                      onChange={e => updateWeeklyEntry(idx, 'start_time', e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <TextField
                      label="End Time"
                      type="time"
                      value={entry.end_time}
                      onChange={e => updateWeeklyEntry(idx, 'end_time', e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <TextField
                      select
                      label="Subject"
                      value={entry.subject_id}
                      onChange={e => updateWeeklyEntry(idx, 'subject_id', e.target.value)}
                      fullWidth
                    >
                      <MenuItem value="">Select Subject</MenuItem>
                      {subjects.map(subj => (
                        <MenuItem key={subj.id} value={subj.id}>{subj.name}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <TextField
                      label="Remarks"
                      value={entry.remarks}
                      onChange={e => updateWeeklyEntry(idx, 'remarks', e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="body2">Teachers:</Typography>
                    {entry.staff_assignments.map(staffObj => {
                      const teacher = staff.find(s => s.id === staffObj.staff_id);
                      return teacher ? (
                        <Chip
                          key={staffObj.staff_id}
                          label={teacher.name}
                          onDelete={() => removeStaffFromEntry(idx, staffObj.staff_id)}
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ) : null;
                    })}
                    <TextField
                      select
                      size="small"
                      label="Add Teacher"
                      value=""
                      onChange={e => addStaffToEntry(idx, e.target.value)}
                      sx={{ mt: 1, minWidth: 120 }}
                    >
                      <MenuItem value="">Select</MenuItem>
                      {staff.filter(s => !entry.staff_assignments.some(sa => sa.staff_id === s.id)).map(s => (
                        <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={1}>
                    <IconButton color="error" onClick={() => removeWeeklyEntry(idx)}>
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Paper>
            ))}
            <Button variant="contained" color="primary" onClick={handleSaveWeeklyRoutine} disabled={saving} sx={{ mt: 2 }}>
              {saving ? 'Saving...' : 'Save Weekly Routine'}
            </Button>
          </Box>
        )}
      </Paper>
      {/* Existing routine view */}
      {ROUTINE_DAYS.map(day => (
        <Paper key={day} sx={{ mb: 3, p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>{day}</Typography>
          {routineData.filter(r => r.day === day).length === 0 ? (
            <Typography variant="body2" color="text.secondary">No periods for {day}</Typography>
          ) : (
            routineData.filter(r => r.day === day).map((period, idx) => (
              <Box key={period.id || idx} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={2}>
                    <Typography><b>Period:</b> {period.period_number}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Typography><b>Start:</b> {period.start_time?.slice(0,5)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Typography><b>End:</b> {period.end_time?.slice(0,5)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Typography><b>Subject:</b> {period.subject_name}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Typography><b>Class:</b> {period.class_name}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Typography><b>Section:</b> {period.section_name}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Typography><b>Remarks:</b> {period.remarks}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography><b>Teachers:</b></Typography>
                    {period.staff_assignments && period.staff_assignments.length > 0 ? (
                      period.staff_assignments.map(staff => (
                        <Chip
                          key={staff.id}
                          label={`ID: ${staff.staff_id}${staff.is_substitute ? ' (Sub)' : ''}`}
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">No teachers assigned</Typography>
                    )}
                  </Grid>
                </Grid>
              </Box>
            ))
          )}
        </Paper>
      ))}
      {/* Snackbar for alerts */}
      <Box>
        <Snackbar
          open={alert.open}
          autoHideDuration={6000}
          onClose={() => setAlert({ ...alert, open: false })}
        >
          <Chip
            label={alert.message}
            color={alert.severity === 'success' ? 'success' : alert.severity === 'error' ? 'error' : 'info'}
            sx={{ fontWeight: 600, fontSize: 16 }}
          />
        </Snackbar>
      </Box>
    </Container>
  );
};

export default RoutineManager;
