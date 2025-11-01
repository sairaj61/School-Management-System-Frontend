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
const ROUTINE_DAYS = [
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
];

// Static data for demo
const classes = [
  { id: 'class1', name: 'Class 1' },
  { id: 'class2', name: 'Class 2' },
];
const sections = [
  { id: 'sectionA', name: 'A' },
  { id: 'sectionB', name: 'B' },
];
const subjects = [
  { id: 'subj1', name: 'Math' },
  { id: 'subj2', name: 'English' },
  { id: 'subj3', name: 'Science' },
];
const staff = [
  { id: 'staff1', name: 'Mr. Sharma' },
  { id: 'staff2', name: 'Ms. Gupta' },
  { id: 'staff3', name: 'Mrs. Singh' },
];
const academicYears = [
  { id: 'year1', name: '2025-26' },
];

import axiosInstance from '../utils/axiosConfig';

const RoutineManager = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [routineData, setRoutineData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
  axiosInstance.get(`${appConfig.API_PREFIX_V1}/academic/routine/`)
      .then(res => {
        setRoutineData(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch routine');
        setLoading(false);
      });
  }, []);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Routine Manager</Typography>
      {loading && <Typography>Loading...</Typography>}
      {error && <Typography color="error">{error}</Typography>}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Optionally add filters for class, section, year here */}
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
