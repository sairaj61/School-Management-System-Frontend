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
  // Weekly routine table: rows = days, columns = periods
  const [routineTable, setRoutineTable] = useState([]); // 2D array: [day][period]
  const [periods, setPeriods] = useState([{ period_number: 1, start_time: '', end_time: '' }]);
  const [routineEditMode, setRoutineEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });

  // Fetch classes, subjects, staff, and all routines on mount
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
    const fetchAllRoutines = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/academic/routine/`);
        setRoutineData(response.data);
      } catch (error) {
        setRoutineData([]);
        handleApiError(error, setError);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
    fetchSubjects();
    fetchStaff();
    fetchAllRoutines();
  }, []);

  // Fetch sections and routines by class when class changes
  useEffect(() => {
    if (!selectedClass) {
      setSections([]);
      setSelectedSection('');
      // Optionally, fetch all routines again if no class selected
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
    const fetchRoutineByClass = async (classId) => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/academic/routine/class/${classId}`);
        setRoutineData(response.data);
      } catch (error) {
        setRoutineData([]);
        handleApiError(error, setError);
      } finally {
        setLoading(false);
      }
    };
    fetchSectionsByClass(selectedClass);
    fetchRoutineByClass(selectedClass);
  }, [selectedClass]);

  // Fetch routine for selected section
  useEffect(() => {
    if (!selectedSection) {
      // If section is cleared, show routine by class (if class selected), else all routines
      if (selectedClass) {
        // Already handled by class effect
        return;
      } else {
        // Already handled by mount effect
        return;
      }
    }
    const fetchRoutineBySection = async (sectionId) => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/academic/routine/section/${sectionId}`);
        setRoutineData(response.data);
      } catch (error) {
        setRoutineData([]);
        handleApiError(error, setError);
      } finally {
        setLoading(false);
      }
    };
    fetchRoutineBySection(selectedSection);
  }, [selectedSection]);

  // Weekly routine table helpers
  const ROUTINE_DAYS_LIST = [
    'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
  ];

  // Start routine creation: initialize table
  const startRoutineEdit = () => {
    setRoutineEditMode(true);
    setPeriods([{ period_number: 1, start_time: '', end_time: '' }]);
    setRoutineTable(
      ROUTINE_DAYS_LIST.map(day => [
        {
          day,
          period_number: 1,
          subject_id: '',
          remarks: '',
          staff_assignments: [],
        }
      ])
    );
  };

  // Add a new period (column)
  const addPeriod = () => {
    const nextPeriodNum = periods.length + 1;
    setPeriods([...periods, { period_number: nextPeriodNum, start_time: '', end_time: '' }]);
    setRoutineTable(prev => prev.map(row => ([
      ...row,
      {
        day: row[0].day,
        period_number: nextPeriodNum,
        subject_id: '',
        remarks: '',
        staff_assignments: [],
      }
    ])));
  };

  // Update period time
  const updatePeriodTime = (idx, field, value) => {
    setPeriods(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  // Update cell (subject, remarks, staff)
  const updateRoutineCell = (dayIdx, periodIdx, field, value) => {
    setRoutineTable(prev => prev.map((row, i) => i === dayIdx ? row.map((cell, j) => j === periodIdx ? { ...cell, [field]: value } : cell) : row));
  };

  // Add/remove staff for a cell
  const addStaffToCell = (dayIdx, periodIdx, staffId) => {
    setRoutineTable(prev => prev.map((row, i) => i === dayIdx ? row.map((cell, j) => j === periodIdx ? {
      ...cell,
      staff_assignments: [...cell.staff_assignments, { staff_id: staffId, priority: 1, is_substitute: 0, remarks: '' }]
    } : cell) : row));
  };
  const removeStaffFromCell = (dayIdx, periodIdx, staffId) => {
    setRoutineTable(prev => prev.map((row, i) => i === dayIdx ? row.map((cell, j) => j === periodIdx ? {
      ...cell,
      staff_assignments: cell.staff_assignments.filter(s => s.staff_id !== staffId)
    } : cell) : row));
  };

  // Save weekly routine (transform table to API format)
// State for copy dialog
const [copyTargets, setCopyTargets] = useState(null); // { dayIdx, periodIdx }
const [copyDayChecks, setCopyDayChecks] = useState({});

// Handle checkbox change for copy dialog
const handleCopyDayCheck = (targetDayIdx, periodIdx, sourceDayIdx) => {
  setCopyDayChecks(prev => ({ ...prev, [targetDayIdx]: !prev[targetDayIdx] }));
};

// Perform copy to checked days
const performCopyToCheckedDays = (sourceDayIdx, periodIdx) => {
  setRoutineTable(prev => {
    if (prev.length === 0) return prev;
    const sourceCell = prev[sourceDayIdx][periodIdx];
    return prev.map((row, dayIdx) => {
      if (dayIdx === sourceDayIdx) return row;
      if (!copyDayChecks[dayIdx]) return row;
      return row.map((cell, idx) => idx === periodIdx ? {
        ...cell,
        subject_id: sourceCell.subject_id,
        remarks: sourceCell.remarks,
        staff_assignments: [...sourceCell.staff_assignments],
      } : cell);
    });
  });
  setCopyTargets(null);
  setCopyDayChecks({});
};
  // Copy selected day's period data to all other days for that period
  const copyDayPeriodToAllDays = (sourceDayIdx, periodIdx) => {
    setRoutineTable(prev => {
      if (prev.length === 0) return prev;
      const sourceCell = prev[sourceDayIdx][periodIdx];
      return prev.map((row, dayIdx) => {
        if (dayIdx === sourceDayIdx) return row;
        return row.map((cell, idx) => idx === periodIdx ? {
          ...cell,
          subject_id: sourceCell.subject_id,
          remarks: sourceCell.remarks,
          staff_assignments: [...sourceCell.staff_assignments],
        } : cell);
      });
    });
  };
  // Copy Monday's period data to all other days for a given period
  const copyPeriodDataToAllDays = (periodIdx) => {
    setRoutineTable(prev => {
      if (prev.length === 0) return prev;
      const mondayCell = prev[0][periodIdx];
      return prev.map((row, dayIdx) => {
        if (dayIdx === 0) return row; // skip Monday
        return row.map((cell, idx) => idx === periodIdx ? {
          ...cell,
          subject_id: mondayCell.subject_id,
          remarks: mondayCell.remarks,
          staff_assignments: [...mondayCell.staff_assignments],
        } : cell);
      });
    });
  };
  const handleSaveWeeklyRoutine = async () => {
    if (!selectedClass || !selectedSection || routineTable.length === 0 || periods.length === 0) {
      setAlert({ open: true, message: 'Please select class, section and create routine.', severity: 'error' });
      return;
    }
    setSaving(true);
    try {
      // Flatten table to entries, filter out empty subject_id
      const entries = [];
      routineTable.forEach((row, dayIdx) => {
        row.forEach((cell, periodIdx) => {
          if (cell.subject_id) {
            entries.push({
              ...cell,
              period_number: periods[periodIdx].period_number,
              start_time: periods[periodIdx].start_time,
              end_time: periods[periodIdx].end_time,
            });
          }
        });
      });
      await axiosInstance.post(`${appConfig.API_PREFIX_V1}/academic/routine/weekly`, {
        class_id: selectedClass,
        section_id: selectedSection,
        entries,
      });
      setLoading(true);
      const res = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/academic/routine/section/${selectedSection}`);
      setRoutineData(res.data);
      setLoading(false);
      setAlert({ open: true, message: 'Weekly routine saved successfully!', severity: 'success' });
      setRoutineEditMode(false);
      setRoutineTable([]);
      setPeriods([{ period_number: 1, start_time: '', end_time: '' }]);
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

      {/* Weekly Routine Creation UI - Table based */}
      <Paper sx={{ mb: 4, p: 3, background: '#f9f9f9' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Weekly Routine Creation</Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              disabled={!selectedClass || !selectedSection || routineEditMode}
              onClick={startRoutineEdit}
            >
              Create Weekly Routine
            </Button>
          </Grid>
        </Grid>
        {routineEditMode && (
          <Box sx={{ mt: 3, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '8px', border: '1px solid #ddd', minWidth: 80 }}>Day</th>
                  {periods.map((period, idx) => (
                    <th key={period.period_number} style={{ padding: '8px', border: '1px solid #ddd', minWidth: 120 }}>
                      Period {period.period_number}<br/>
                      <TextField
                        type="time"
                        label="Start Time"
                        value={period.start_time}
                        onChange={e => updatePeriodTime(idx, 'start_time', e.target.value)}
                        size="small"
                        sx={{ width: 100, mt: 1 }}
                      />
                      <TextField
                        type="time"
                        label="End Time"
                        value={period.end_time}
                        onChange={e => updatePeriodTime(idx, 'end_time', e.target.value)}
                        size="small"
                        sx={{ width: 100, mt: 1 }}
                      />
                    </th>
                  ))}
                <th style={{ minWidth: 80 }}>
                    <Button variant="outlined" startIcon={<AddIcon />} onClick={addPeriod} sx={{ mt: 1 }}>Add Period</Button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {routineTable.map((row, dayIdx) => (
                  <tr key={row[0].day}>
                    <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 600 }}>{row[0].day}</td>
                    {row.map((cell, periodIdx) => (
                      <td key={periodIdx} style={{ padding: '8px', border: '1px solid #ddd', verticalAlign: 'top', minWidth: 180 }}>
                        <TextField
                          select
                          label="Subject"
                          value={cell.subject_id}
                          onChange={e => updateRoutineCell(dayIdx, periodIdx, 'subject_id', e.target.value)}
                          fullWidth
                          size="small"
                        >
                          <MenuItem value="">Select Subject</MenuItem>
                          {subjects.map(subj => (
                            <MenuItem key={subj.id} value={subj.id}>{subj.name}</MenuItem>
                          ))}
                        </TextField>
                        <TextField
                          label="Remarks"
                          value={cell.remarks}
                          onChange={e => updateRoutineCell(dayIdx, periodIdx, 'remarks', e.target.value)}
                          fullWidth
                          size="small"
                          sx={{ mt: 1 }}
                        />
                        <Typography variant="body2" sx={{ mt: 1 }}>Teachers:</Typography>
                        {cell.staff_assignments.map(staffObj => {
                          const teacher = staff.find(s => s.id === staffObj.staff_id);
                          return teacher ? (
                            <Chip
                              key={staffObj.staff_id}
                              label={teacher.name}
                              onDelete={() => removeStaffFromCell(dayIdx, periodIdx, staffObj.staff_id)}
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ) : null;
                        })}
                        <TextField
                          select
                          size="small"
                          label="Add Teacher"
                          value=""
                          onChange={e => addStaffToCell(dayIdx, periodIdx, e.target.value)}
                          sx={{ mt: 1, minWidth: 120 }}
                        >
                          <MenuItem value="">Select</MenuItem>
                          {staff.filter(s => !cell.staff_assignments.some(sa => sa.staff_id === s.id)).map(s => (
                            <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                          ))}
                        </TextField>
                        <Button
                          variant="outlined"
                          size="small"
                          sx={{ mt: 1, width: '100%' }}
                          onClick={() => setCopyTargets({ dayIdx, periodIdx })}
                        >
                          Copy to days
                        </Button>
                        {copyTargets && copyTargets.dayIdx === dayIdx && copyTargets.periodIdx === periodIdx && (
                          <Box sx={{ mt: 1, border: '1px solid #eee', borderRadius: 1, p: 1, background: '#fafafa' }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>Select days to copy:</Typography>
                            {routineTable.map((r, idx) => (
                              idx !== dayIdx ? (
                                <Box key={r[0].day} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                  <input
                                    type="checkbox"
                                    checked={!!copyDayChecks[idx]}
                                    onChange={e => handleCopyDayCheck(idx, periodIdx, dayIdx)}
                                    style={{ marginRight: 8 }}
                                  />
                                  <Typography variant="body2">{r[0].day}</Typography>
                                </Box>
                              ) : null
                            ))}
                            <Button
                              variant="contained"
                              size="small"
                              sx={{ mt: 1, width: '100%' }}
                              onClick={() => performCopyToCheckedDays(dayIdx, periodIdx)}
                            >
                              Apply Copy
                            </Button>
                          </Box>
                        )}
                      </td>
                    ))}

                  </tr>
                ))}
              </tbody>
            </table>
            <Button variant="contained" color="primary" onClick={handleSaveWeeklyRoutine} disabled={saving} sx={{ mt: 2 }}>
              {saving ? 'Saving...' : 'Save Weekly Routine'}
            </Button>
          </Box>
        )}
      </Paper>
      {/* Refactored: Render tables for each class and section, columns based on max periods */}
      {Array.isArray(routineData) && routineData.length > 0 ? (
        routineData.flatMap(classObj =>
          classObj.sections.map(sectionObj => {
            let maxPeriods = 0;
            sectionObj.days.forEach(dayObj => {
              if (dayObj.routines.length > maxPeriods) maxPeriods = dayObj.routines.length;
              const maxPeriodNum = Math.max(...dayObj.routines.map(r => r.period_number), 0);
              if (maxPeriodNum > maxPeriods) maxPeriods = maxPeriodNum;
            });
            const columns = Array.from({ length: maxPeriods }, (_, i) => i + 1);
            return (
              <Paper key={sectionObj.section_id} sx={{ p: 3, mb: 4, overflowX: 'auto' }}>
                <Typography variant="h6" sx={{ mb: 2 }}>{classObj.class_name} - {sectionObj.section_name}</Typography>
                <Box sx={{ width: '100%', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                    <thead>
                      <tr style={{ background: '#f5f5f5' }}>
                        <th style={{ padding: '8px', border: '1px solid #ddd', minWidth: 80 }}>Day</th>
                        {columns.map(periodNum => (
                          <th key={periodNum} style={{ padding: '8px', border: '1px solid #ddd', minWidth: 120 }}>{periodNum} Period</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sectionObj.days.map(dayObj => (
                        <tr key={dayObj.day}>
                          <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 600 }}>{dayObj.day}</td>
                          {columns.map(periodNum => {
                            // Find all routines for this period (could be multiple)
                            const routines = dayObj.routines.filter(r => r.period_number === periodNum);
                            return (
                              <td key={periodNum} style={{ padding: '8px', border: '1px solid #ddd', verticalAlign: 'top' }}>
                                {routines.length > 0 ? (
                                  routines.map((routine, idx) => (
                                    <div key={routine.id || idx} style={{ marginBottom: 8 }}>
                                      <span>{routine.subject_name}</span><br/>
                                      <sub>{routine.staff_assignments?.map(s => s.staff_id).join(', ')}</sub>
                                      {routine.remarks && <div style={{ color: '#888', fontSize: 12 }}>{routine.remarks}</div>}
                                    </div>
                                  ))
                                ) : ''}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              </Paper>
            );
          })
        )
      ) : null}
  </Container>
);
}

export default RoutineManager;
