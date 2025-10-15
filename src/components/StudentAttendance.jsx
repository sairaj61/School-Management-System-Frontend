import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Grid,
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Divider,
  Avatar,
  Stack
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Warning as WarningIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AccessTime as AccessTimeIcon,
  EventNote as EventNoteIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import axiosInstance from '../utils/axiosConfig';
import appConfig from '../config/appConfig';

// Styled components for better visual appeal
const CalendarContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(1),
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
  background: theme.palette.background.paper,
}));

const CalendarHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
  padding: theme.spacing(1.5),
  backgroundColor: theme.palette.primary.main,
  borderRadius: theme.spacing(0.5),
  color: theme.palette.primary.contrastText,
}));

const WeekdayHeader = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: theme.spacing(0.5),
  marginBottom: theme.spacing(1),
}));

const WeekdayCell = styled(Box)(({ theme }) => ({
  padding: theme.spacing(0.5),
  textAlign: 'center',
  fontWeight: 600,
  color: theme.palette.text.secondary,
  fontSize: '0.75rem',
}));

const CalendarGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: theme.spacing(0.5),
  minHeight: '300px',
}));

const DateCell = styled(Card)(({ theme, status, isToday, isEmpty }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'present':
        return {
          backgroundColor: '#e8f5e8',
          borderColor: '#4caf50',
          color: '#2e7d32',
        };
      case 'absent':
        return {
          backgroundColor: '#ffebee',
          borderColor: '#f44336',
          color: '#c62828',
        };
      case 'late':
        return {
          backgroundColor: '#fff3e0',
          borderColor: '#ff9800',
          color: '#ef6c00',
        };
      case 'excused':
        return {
          backgroundColor: '#e3f2fd',
          borderColor: '#2196f3',
          color: '#1565c0',
        };
      case 'sick_leave':
        return {
          backgroundColor: '#f3e5f5',
          borderColor: '#9c27b0',
          color: '#7b1fa2',
        };
      case 'half_day':
        return {
          backgroundColor: '#fff8e1',
          borderColor: '#ffc107',
          color: '#f57c00',
        };
      default:
        return {
          backgroundColor: theme.palette.background.paper,
          borderColor: theme.palette.divider,
          color: theme.palette.text.primary,
        };
    }
  };

  const statusStyle = getStatusColor();

  return {
    minHeight: '50px',
    cursor: isEmpty ? 'default' : 'pointer',
    border: `1px solid ${statusStyle.borderColor}`,
    backgroundColor: statusStyle.backgroundColor,
    color: statusStyle.color,
    opacity: isEmpty ? 0.3 : 1,
    transform: isToday ? 'scale(1.02)' : 'scale(1)',
    boxShadow: isToday 
      ? '0 2px 8px rgba(0, 0, 0, 0.12)' 
      : '0 1px 3px rgba(0, 0, 0, 0.08)',
    transition: 'all 0.2s ease',
    '&:hover': isEmpty ? {} : {
      transform: 'scale(1.02)',
      boxShadow: '0 3px 12px rgba(0, 0, 0, 0.15)',
      zIndex: 1,
    },
  };
});

const LegendContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1.5),
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(0.5),
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
}));

const LegendItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  marginBottom: theme.spacing(0.25),
}));

const StatusIndicator = styled(Box)(({ color }) => ({
  width: 12,
  height: 12,
  borderRadius: '50%',
  backgroundColor: color,
  border: '1px solid rgba(0, 0, 0, 0.1)',
}));

const StudentAttendance = ({ studentId, onClose }) => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });

  // Status configuration
  const statusConfig = {
    present: { color: '#4caf50', label: 'Present', bgColor: '#e8f5e8' },
    absent: { color: '#f44336', label: 'Absent', bgColor: '#ffebee' },
    late: { color: '#ff9800', label: 'Late', bgColor: '#fff3e0' },
    excused: { color: '#2196f3', label: 'Excused', bgColor: '#e3f2fd' },
    sick_leave: { color: '#9c27b0', label: 'Sick Leave', bgColor: '#f3e5f5' },
    half_day: { color: '#ffc107', label: 'Half Day', bgColor: '#fff8e1' },
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    if (studentId) {
      fetchAttendanceData();
    }
  }, [studentId, currentMonth, currentYear]);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `${appConfig.API_PREFIX_V1}/academic/students-attendance/student/${studentId}/monthly`,
        {
          params: {
            year: currentYear,
            month: currentMonth + 1, // API expects 1-based month
          },
        }
      );
      setAttendanceData(response.data || []);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      setAlert({
        open: true,
        message: 'Failed to fetch attendance data. Please try again.',
        severity: 'error',
      });
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDateClick = (date, attendanceRecord) => {
    if (attendanceRecord) {
      setSelectedDate({ date, ...attendanceRecord });
      setDialogOpen(true);
    }
  };

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const isToday = (date) => {
    const today = new Date();
    return (
      date === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  const getAttendanceForDate = (date) => {
    return attendanceData.find(record => {
      const recordDate = new Date(record.attendance_date);
      return recordDate.getDate() === date;
    });
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <DateCell key={`empty-${i}`} isEmpty={true}>
          <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
            <Box />
          </CardContent>
        </DateCell>
      );
    }

    // Add cells for each day of the month
    for (let date = 1; date <= daysInMonth; date++) {
      const attendanceRecord = getAttendanceForDate(date);
      const today = isToday(date);

      days.push(
        <DateCell
          key={date}
          status={attendanceRecord?.status}
          isToday={today}
          onClick={() => handleDateClick(date, attendanceRecord)}
        >
          <CardContent sx={{ p: 0.5, '&:last-child': { pb: 0.5 } }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', minHeight: '45px' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                {date}
              </Typography>
              {attendanceRecord && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25, mt: 0.25 }}>
                  <Chip
                    size="small"
                    label={statusConfig[attendanceRecord.status]?.label || attendanceRecord.status}
                    sx={{
                      fontSize: '0.6rem',
                      height: '16px',
                      backgroundColor: statusConfig[attendanceRecord.status]?.bgColor,
                      color: statusConfig[attendanceRecord.status]?.color,
                      '& .MuiChip-label': { px: 0.5 }
                    }}
                  />
                  {attendanceRecord.is_late && (
                    <WarningIcon sx={{ fontSize: 12, color: '#ff9800' }} />
                  )}
                </Box>
              )}
              {today && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: '#ff4444',
                  }}
                />
              )}
            </Box>
          </CardContent>
        </DateCell>
      );
    }

    return days;
  };

  const getAttendanceStats = () => {
    const stats = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      sick_leave: 0,
      half_day: 0,
      total: attendanceData.length,
    };

    attendanceData.forEach(record => {
      if (stats.hasOwnProperty(record.status)) {
        stats[record.status]++;
      }
    });

    return stats;
  };

  const stats = getAttendanceStats();

  return (
    <Box sx={{ width: '100%' }}>
      {/* Compact Header */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 1, bgcolor: 'primary.main', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CalendarIcon sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Student Attendance - {monthNames[currentMonth]} {currentYear}
          </Typography>
        </Box>
      </Paper>

      {/* Compact Stats Cards */}
      <Paper sx={{ p: 1.5, mb: 2, borderRadius: 1 }}>
        <Grid container spacing={1}>
          <Grid item xs={6} sm={2}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#e8f5e8', borderRadius: 0.5 }}>
              <Typography variant="h6" sx={{ color: '#2e7d32', fontWeight: 600, fontSize: '1.1rem' }}>
                {stats.present}
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
                Present
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={2}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#ffebee', borderRadius: 0.5 }}>
              <Typography variant="h6" sx={{ color: '#c62828', fontWeight: 600, fontSize: '1.1rem' }}>
                {stats.absent}
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
                Absent
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={2}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#fff3e0', borderRadius: 0.5 }}>
              <Typography variant="h6" sx={{ color: '#ef6c00', fontWeight: 600, fontSize: '1.1rem' }}>
                {stats.late}
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
                Late
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={2}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#e3f2fd', borderRadius: 0.5 }}>
              <Typography variant="h6" sx={{ color: '#1565c0', fontWeight: 600, fontSize: '1.1rem' }}>
                {stats.excused}
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
                Excused
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={2}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#f3e5f5', borderRadius: 0.5 }}>
              <Typography variant="h6" sx={{ color: '#7b1fa2', fontWeight: 600, fontSize: '1.1rem' }}>
                {stats.sick_leave}
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
                Sick Leave
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={2}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#fff8e1', borderRadius: 0.5 }}>
              <Typography variant="h6" sx={{ color: '#f57c00', fontWeight: 600, fontSize: '1.1rem' }}>
                {stats.half_day}
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
                Half Day
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Compact Legend */}
      <LegendContainer>
        <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
          <EventNoteIcon fontSize="small" />
          Legend
        </Typography>
        <Grid container spacing={1}>
          {Object.entries(statusConfig).map(([status, config]) => (
            <Grid item xs={6} sm={4} md={2} key={status}>
              <LegendItem>
                <StatusIndicator color={config.color} />
                <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>{config.label}</Typography>
              </LegendItem>
            </Grid>
          ))}
        </Grid>
      </LegendContainer>

      {/* Calendar */}
      <CalendarContainer>
        <CalendarHeader>
          <IconButton onClick={handlePreviousMonth} sx={{ color: 'inherit' }} size="small">
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {monthNames[currentMonth]} {currentYear}
          </Typography>
          <IconButton onClick={handleNextMonth} sx={{ color: 'inherit' }} size="small">
            <ChevronRightIcon />
          </IconButton>
        </CalendarHeader>

        <WeekdayHeader>
          {weekdays.map((day) => (
            <WeekdayCell key={day}>
              {day}
            </WeekdayCell>
          ))}
        </WeekdayHeader>

        <CalendarGrid>
          {renderCalendar()}
        </CalendarGrid>
      </CalendarContainer>

      {/* Attendance Detail Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon />
          Attendance Details
        </DialogTitle>
        <DialogContent dividers>
          {selectedDate && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">Date</Typography>
                <Typography variant="body1">
                  {new Date(currentYear, currentMonth, selectedDate.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typography>
              </Box>
              
              <Divider />
              
              <Box>
                <Typography variant="subtitle2" color="textSecondary">Status</Typography>
                <Chip
                  label={statusConfig[selectedDate.status]?.label || selectedDate.status}
                  sx={{
                    backgroundColor: statusConfig[selectedDate.status]?.bgColor,
                    color: statusConfig[selectedDate.status]?.color,
                    fontWeight: 600,
                  }}
                />
              </Box>

              {selectedDate.is_late && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon sx={{ color: '#ff9800' }} />
                  <Typography variant="body2" sx={{ color: '#ff9800', fontWeight: 500 }}>
                    Student arrived late
                  </Typography>
                </Box>
              )}

              {selectedDate.remark && (
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">Remark</Typography>
                  <Typography variant="body1">{selectedDate.remark}</Typography>
                </Box>
              )}

              <Box>
                <Typography variant="subtitle2" color="textSecondary">Time</Typography>
                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTimeIcon fontSize="small" />
                  {new Date(selectedDate.attendance_date).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alert Snackbar */}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, open: false })}
      >
        <Alert
          onClose={() => setAlert({ ...alert, open: false })}
          severity={alert.severity}
          sx={{ width: '100%' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StudentAttendance;
