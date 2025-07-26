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
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(2),
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
  background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
}));

const CalendarHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.primary.main,
  borderRadius: theme.spacing(1),
  color: theme.palette.primary.contrastText,
}));

const WeekdayHeader = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

const WeekdayCell = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  textAlign: 'center',
  fontWeight: 600,
  color: theme.palette.text.secondary,
  fontSize: '0.875rem',
}));

const CalendarGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: theme.spacing(1),
  minHeight: '400px',
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
    minHeight: '80px',
    cursor: isEmpty ? 'default' : 'pointer',
    border: `2px solid ${statusStyle.borderColor}`,
    backgroundColor: statusStyle.backgroundColor,
    color: statusStyle.color,
    opacity: isEmpty ? 0.3 : 1,
    transform: isToday ? 'scale(1.05)' : 'scale(1)',
    boxShadow: isToday 
      ? '0 4px 20px rgba(0, 0, 0, 0.15)' 
      : '0 2px 8px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': isEmpty ? {} : {
      transform: 'scale(1.05)',
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
      zIndex: 1,
    },
  };
});

const LegendContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
}));

const LegendItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(0.5),
}));

const StatusIndicator = styled(Box)(({ color }) => ({
  width: 16,
  height: 16,
  borderRadius: '50%',
  backgroundColor: color,
  border: '2px solid rgba(0, 0, 0, 0.1)',
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
        `${appConfig.API_PREFIX_V1}/students-managements/students-attendance/student/${studentId}/monthly`,
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
          <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                {date}
              </Typography>
              {attendanceRecord && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                  <Chip
                    size="small"
                    label={statusConfig[attendanceRecord.status]?.label || attendanceRecord.status}
                    sx={{
                      fontSize: '0.7rem',
                      height: '20px',
                      backgroundColor: statusConfig[attendanceRecord.status]?.bgColor,
                      color: statusConfig[attendanceRecord.status]?.color,
                    }}
                  />
                  {attendanceRecord.is_late && (
                    <WarningIcon sx={{ fontSize: 16, color: '#ff9800' }} />
                  )}
                </Box>
              )}
              {today && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 8,
                    height: 8,
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
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', color: 'white' }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
            <CalendarIcon />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
              Student Attendance
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              Monthly attendance view with detailed status tracking
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ textAlign: 'center', bgcolor: '#e8f5e8' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#2e7d32', fontWeight: 600 }}>
                {stats.present}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Present
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ textAlign: 'center', bgcolor: '#ffebee' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#c62828', fontWeight: 600 }}>
                {stats.absent}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Absent
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ textAlign: 'center', bgcolor: '#fff3e0' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#ef6c00', fontWeight: 600 }}>
                {stats.late}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Late
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ textAlign: 'center', bgcolor: '#e3f2fd' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#1565c0', fontWeight: 600 }}>
                {stats.excused}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Excused
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ textAlign: 'center', bgcolor: '#f3e5f5' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#7b1fa2', fontWeight: 600 }}>
                {stats.sick_leave}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Sick Leave
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ textAlign: 'center', bgcolor: '#fff8e1' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#f57c00', fontWeight: 600 }}>
                {stats.half_day}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Half Day
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Legend */}
      <LegendContainer>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EventNoteIcon />
          Attendance Legend
        </Typography>
        <Grid container spacing={2}>
          {Object.entries(statusConfig).map(([status, config]) => (
            <Grid item xs={6} sm={4} md={2} key={status}>
              <LegendItem>
                <StatusIndicator color={config.color} />
                <Typography variant="body2">{config.label}</Typography>
              </LegendItem>
            </Grid>
          ))}
        </Grid>
        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon sx={{ fontSize: 16, color: '#ff9800' }} />
          <Typography variant="caption" color="textSecondary">
            Warning icon indicates late arrival
          </Typography>
        </Box>
      </LegendContainer>

      {/* Calendar */}
      <CalendarContainer>
        <CalendarHeader>
          <IconButton onClick={handlePreviousMonth} sx={{ color: 'inherit' }}>
            <ChevronLeftIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {monthNames[currentMonth]} {currentYear}
            </Typography>
          </Box>
          <IconButton onClick={handleNextMonth} sx={{ color: 'inherit' }}>
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
