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
  Chip
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
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [routineData, setRoutineData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch classes on mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/academic/classes/`);
        setClasses(response.data);
      } catch (error) {
        handleApiError(error, setError);
      }
    };
    fetchClasses();
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
    </Container>
  );
};

export default RoutineManager;
