import React, { useState } from 'react';
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

const RoutineManager = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [routine, setRoutine] = useState({}); // { day: [periods] }

  // Add a new period for a day
  const addPeriod = (day) => {
    setRoutine(prev => ({
      ...prev,
      [day]: [
        ...(prev[day] || []),
        {
          period_number: (prev[day]?.length || 0) + 1,
          start_time: '',
          end_time: '',
          subject_id: '',
          staff_ids: [],
          remarks: '',
        }
      ]
    }));
  };

  // Remove a period from a day
  const removePeriod = (day, idx) => {
    setRoutine(prev => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== idx)
    }));
  };

  // Update a period's field
  const updatePeriod = (day, idx, field, value) => {
    setRoutine(prev => ({
      ...prev,
      [day]: prev[day].map((p, i) => i === idx ? { ...p, [field]: value } : p)
    }));
  };

  // Add staff to a period
  const addStaffToPeriod = (day, idx, staffId) => {
    setRoutine(prev => ({
      ...prev,
      [day]: prev[day].map((p, i) =>
        i === idx ? { ...p, staff_ids: [...p.staff_ids, staffId] } : p
      )
    }));
  };

  // Remove staff from a period
  const removeStaffFromPeriod = (day, idx, staffId) => {
    setRoutine(prev => ({
      ...prev,
      [day]: prev[day].map((p, i) =>
        i === idx ? { ...p, staff_ids: p.staff_ids.filter(id => id !== staffId) } : p
      )
    }));
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Routine Manager</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            fullWidth
            label="Academic Year"
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
          >
            {academicYears.map(y => (
              <MenuItem key={y.id} value={y.id}>{y.name}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            fullWidth
            label="Class"
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
          >
            {classes.map(c => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            fullWidth
            label="Section"
            value={selectedSection}
            onChange={e => setSelectedSection(e.target.value)}
          >
            {sections.map(s => (
              <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>
      {ROUTINE_DAYS.map(day => (
        <Paper key={day} sx={{ mb: 3, p: 2 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6">{day}</Typography>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => addPeriod(day)}>
              Add Period
            </Button>
          </Box>
          {(routine[day] || []).map((period, idx) => (
            <Box key={idx} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={2}>
                  <TextField
                    label={`Period #`}
                    type="number"
                    value={period.period_number}
                    onChange={e => updatePeriod(day, idx, 'period_number', Number(e.target.value))}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    label="Start Time"
                    type="time"
                    value={period.start_time}
                    onChange={e => updatePeriod(day, idx, 'start_time', e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    label="End Time"
                    type="time"
                    value={period.end_time}
                    onChange={e => updatePeriod(day, idx, 'end_time', e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    select
                    label="Subject"
                    value={period.subject_id}
                    onChange={e => updatePeriod(day, idx, 'subject_id', e.target.value)}
                    fullWidth
                  >
                    {subjects.map(subj => (
                      <MenuItem key={subj.id} value={subj.id}>{subj.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    label="Remarks"
                    value={period.remarks}
                    onChange={e => updatePeriod(day, idx, 'remarks', e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Box>
                    <Typography variant="body2">Teachers:</Typography>
                    {period.staff_ids.map(staffId => {
                      const teacher = staff.find(s => s.id === staffId);
                      return teacher ? (
                        <Chip
                          key={staffId}
                          label={teacher.name}
                          onDelete={() => removeStaffFromPeriod(day, idx, staffId)}
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ) : null;
                    })}
                    <TextField
                      select
                      size="small"
                      label="Add Teacher"
                      value=""
                      onChange={e => addStaffToPeriod(day, idx, e.target.value)}
                      sx={{ mt: 1, minWidth: 120 }}
                    >
                      <MenuItem value="">Select</MenuItem>
                      {staff.filter(s => !period.staff_ids.includes(s.id)).map(s => (
                        <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                      ))}
                    </TextField>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={1}>
                  <IconButton color="error" onClick={() => removePeriod(day, idx)}>
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </Box>
          ))}
        </Paper>
      ))}
    </Container>
  );
};

export default RoutineManager;
