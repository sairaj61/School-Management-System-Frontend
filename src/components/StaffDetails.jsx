import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Avatar, Grid, Chip, IconButton, Tooltip, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Tabs, Tab,
  List, ListItem, ListItemIcon, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions,TextField
} from '@mui/material';
import {
  CloudUpload, Visibility, Download, Email, Phone, Home, School, Person, AttachFile, Work, CalendarToday, AccountBalance, ArrowBackIosNew, Paid
} from '@mui/icons-material';
import appConfig from '../config/appConfig';
import axiosInstance from '../utils/axiosConfig';

const staffTypeColors = {
  TEACHING: 'primary',
  NON_TEACHING: 'success',
  ADMIN: 'warning',
  DRIVER: 'info',
  OTHER: 'default',
};

const defaultStaff = {
  id: '',
  name: '',
  staff_type: '',
  email: '',
  phone_number: '',
  address: '',
  qualification: '',
  date_of_joining: '',
  date_of_termination: null,
  profile_image: '',
};

const mockSalaryHistory = [
  { id: 1, month: 'August', year: 2025, amount: 35000, paid_on: '2025-08-31' },
  { id: 2, month: 'July', year: 2025, amount: 35000, paid_on: '2025-07-31' },
  { id: 3, month: 'June', year: 2025, amount: 35000, paid_on: '2025-06-30' },
];

const mockAttendanceSummary = {
  month: 'August',
  year: 2025,
  present: 22,
  absent: 2,
  late: 1,
  totalDays: 25
};

const mockFiles = [
  { id: 1, name: 'Resume.pdf', url: '', type: 'pdf' },
  { id: 2, name: 'Certificate.jpg', url: '', type: 'image' },
  { id: 3, name: 'ID Card.png', url: '', type: 'image' },
];

const mockSalary = 35000;
const mockSalaryStructure = [
  { component: 'Basic Pay', amount: 20000 },
  { component: 'House Rent Allowance (HRA)', amount: 5000 },
  { component: 'Dearness Allowance (DA)', amount: 6000 },
  { component: 'Transport Allowance', amount: 4000 },
  { component: 'Deductions (EPF)', amount: -1000 },
];

const StaffDetails = () => {
  // CTC Component Types
  const CTC_COMPONENT_TYPES = [
    "Allowance",
    "Deduction",
    "Bonus",
    "Reimbursement",
    "Tax",
    "House Rent Allowance",
    "Basic Salary",
    "Medical Allowance",
    "Transport Allowance",
    "Other"
  ];

  // State for CTC component dialog
  const [openComponentDialog, setOpenComponentDialog] = useState(false);
  const [componentCtcId, setComponentCtcId] = useState(null);
  const [componentTotal, setComponentTotal] = useState(0);
  const [componentsForm, setComponentsForm] = useState([
    { name: '', amount: '', component_type: '' }
  ]);
  const [componentError, setComponentError] = useState('');

  // Handler for adding/removing component rows
  const addComponentRow = () => setComponentsForm([...componentsForm, { name: '', amount: '', component_type: '' }]);
  const removeComponentRow = idx => setComponentsForm(componentsForm.filter((_, i) => i !== idx));

  // Handler for changing component values
  const handleComponentChange = (idx, field, value) => {
    const updated = [...componentsForm];
    updated[idx][field] = value;
    // If name is empty, use type as name
    if (field === 'component_type' && !updated[idx].name) {
      updated[idx].name = value;
    }
    setComponentsForm(updated);
  };

  // Handler for submitting components
  const submitComponents = async () => {
    setComponentError('');
    // Validate sum
    const sum = componentsForm.reduce((acc, c) => acc + Number(c.amount), 0);
    if (sum !== Number(componentTotal)) {
      setComponentError(`Sum of all components (${sum}) must match total CTC (${componentTotal})`);
      return;
    }
    // Validate required fields
    for (const comp of componentsForm) {
      if (!comp.component_type || comp.amount === '' || comp.name === '') {
        setComponentError('All fields are required for each component.');
        return;
      }
    }
    try {
      await axiosInstance.post(`${appConfig.API_PREFIX_V1}/staff/ctc-structure/${componentCtcId}/components/bulk`, {
        components: componentsForm.map(c => ({
          name: c.name,
          amount: Number(c.amount),
          component_type: c.component_type
        }))
      });
      setOpenComponentDialog(false);
      setComponentsForm([{ name: '', amount: '', component_type: '' }]);
      // Optionally refresh CTC history
      const ctcHistoryRes = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/staff/${staff.id}/ctc-structures`);
      setCtcHistory(ctcHistoryRes.data);
    } catch (err) {
      setComponentError('Failed to create components.');
    }
  };

  const { id } = useParams();
  const [tab, setTab] = useState(0);
  const [files, setFiles] = useState(mockFiles);
  const [uploading, setUploading] = useState(false);
  const [staff, setStaff] = useState(defaultStaff);
  const [profileImage, setProfileImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeCTC, setActiveCTC] = useState(null);
  const [ctcHistory, setCtcHistory] = useState([]);
  // Add state for CTC dialog and form
  const [openCtcDialog, setOpenCtcDialog] = useState(false);
  const [ctcForm, setCtcForm] = useState({ total_ctc: '', effective_from: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        // Staff details
        const staffRes = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/staff/${id}`);
        setStaff(staffRes.data);
        setProfileImage(staffRes.data.profile_image || '');
        // Active CTC
        try {
          const activeCtcRes = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/staff/${id}/ctc-structure/active`);
          setActiveCTC(activeCtcRes.data);
        } catch (ctcErr) {
          if (ctcErr?.response?.status === 404) {
            setActiveCTC(null);
          } else {
            throw ctcErr;
          }
        }
        // CTC history
        const ctcHistoryRes = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/staff/${id}/ctc-structures`);
        setCtcHistory(ctcHistoryRes.data);
      } catch (error) {
        setStaff(defaultStaff);
        setActiveCTC(null);
        setCtcHistory([]);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchAll();
  }, [id]);

  const handleFileUpload = (e) => {
    setUploading(true);
    setTimeout(() => {
      setFiles([...files, { id: files.length + 1, name: e.target.files[0].name, url: '', type: e.target.files[0].type }]);
      setUploading(false);
    }, 1000);
  };

  const handleProfileImageUpload = (e) => {
    setProfileImage(URL.createObjectURL(e.target.files[0]));
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eef2f6' }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100vh', background: '#eef2f6', p: { xs: 2, md: 4 }, overflow: 'hidden' }}>
      <Card sx={{ p: { xs: 2, md: 4 }, borderRadius: 3, boxShadow: 6, position: 'relative', height: '100%' }}>
        {/* Back Button */}
        <Tooltip title="Go Back">
          <IconButton onClick={() => navigate(-1)} sx={{ position: 'absolute', top: 16, left: 16 }}>
            <ArrowBackIosNew />
          </IconButton>
        </Tooltip>

        {/* Profile Header Section */}
        <Box sx={{
          display: 'flex', flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center', gap: 4, mb: 4, pt: { xs: 4, md: 0 },
          borderBottom: '1px solid #e0e0e0', pb: 4
        }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar src={profileImage} sx={{ width: 140, height: 140, bgcolor: 'primary.main', border: '3px solid', borderColor: 'primary.light' }}>
              <Person fontSize="large" sx={{ fontSize: 80 }} />
            </Avatar>
            <IconButton
              component="label"
              sx={{ position: 'absolute', bottom: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: 'white', '&:hover': { background: 'rgba(0,0,0,0.8)' } }}
            >
              <CloudUpload fontSize="small" />
              <input type="file" hidden accept="image/*" onChange={handleProfileImageUpload} />
            </IconButton>
          </Box>
          <Box sx={{ flexGrow: 1, textAlign: { xs: 'center', md: 'left' } }}>
            <Typography variant="h4" fontWeight={700} color="text.primary">{staff.name}</Typography>
            <Chip
              label={staff.staff_type.replace('_', ' ')}
              color={staffTypeColors[staff.staff_type] || 'default'}
              sx={{ mt: 1, mb: 2, fontWeight: 600, fontSize: 14 }}
            />
            <Grid container spacing={2} justifyContent={{ xs: 'center', md: 'flex-start' }}>
              <Grid item><Button variant="outlined" startIcon={<Email />}>{staff.email}</Button></Grid>
              <Grid item><Button variant="outlined" startIcon={<Phone />}>{staff.phone_number}</Button></Grid>
            </Grid>
          </Box>
        </Box>

        {/* Tabs for different sections */}
        <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 3 }}>
          <Tab label="Overview" icon={<Work />} iconPosition="start" />
          <Tab label="Salary Structure" icon={<Paid />} iconPosition="start" />
          <Tab label="Salary History" icon={<AccountBalance />} iconPosition="start" />
          <Tab label="Attendance" icon={<CalendarToday />} iconPosition="start" />
          <Tab label="Documents" icon={<AttachFile />} iconPosition="start" />
        </Tabs>

        {/* Tab Panels */}
        <Box sx={{ p: 2 }}>
          {/* Overview Tab */}
          {tab === 0 && (
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%', minHeight: 260, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>Personal Information</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><School color="primary" /></ListItemIcon>
                      <ListItemText primary="Qualification" secondary={staff.qualification} />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Home color="warning" /></ListItemIcon>
                      <ListItemText primary="Address" secondary={staff.address} />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CalendarToday color="info" /></ListItemIcon>
                      <ListItemText primary="Date of Joining" secondary={staff.date_of_joining ? new Date(staff.date_of_joining).toLocaleDateString() : 'N/A'} />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CalendarToday color="error" /></ListItemIcon>
                      <ListItemText primary="Date of Termination" secondary={staff.date_of_termination ? new Date(staff.date_of_termination).toLocaleDateString() : 'N/A'} />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%', minHeight: 260, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>Active CTC Structure</Typography>
                  {activeCTC ? (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                        <Typography variant="body1" sx={{ mb: 1 }}>Total CTC: <b>₹{parseFloat(activeCTC.total_ctc).toLocaleString()}</b></Typography>
                      </Box>
                      <Typography variant="body2" sx={{ mb: 1 }}>Effective From: {new Date(activeCTC.effective_from).toLocaleDateString()}</Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>Effective To: {activeCTC.effective_to ? new Date(activeCTC.effective_to).toLocaleDateString() : 'N/A'}</Typography>
                      <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Components:</Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Name</TableCell>
                              <TableCell>Amount</TableCell>
                              <TableCell>Type</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {activeCTC.components.map(comp => (
                              <TableRow key={comp.id}>
                                <TableCell>{comp.name}</TableCell>
                                <TableCell>₹{parseFloat(comp.amount).toLocaleString()}</TableCell>
                                <TableCell>{comp.component_type}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </>
                  ) : (
                    <Typography color="text.secondary">No active CTC structure found.</Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Salary Structure Tab */}
          {tab === 1 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" fontWeight={700} color="primary">
                  CTC Structure History
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button variant="contained" color="primary" onClick={() => setOpenCtcDialog(true)}>
                    Add Salary Structure
                  </Button>
                  {/* Terminate Active CTC Structure button, only if any active CTC exists */}
                  {ctcHistory.some(ctc => !ctc.effective_to) && (
                    <Button
                      variant="contained"
                      color="error"
                      onClick={async () => {
                        try {
                          await axiosInstance.post(`${appConfig.API_PREFIX_V1}/staff/${staff.id}/ctc-structure/terminate`);
                          // Refresh active CTC and history
                          try {
                            const activeCtcRes = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/staff/${staff.id}/ctc-structure/active`);
                            setActiveCTC(activeCtcRes.data);
                          } catch (ctcErr) {
                            setActiveCTC(null);
                          }
                          const ctcHistoryRes = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/staff/${staff.id}/ctc-structures`);
                          setCtcHistory(ctcHistoryRes.data);
                        } catch (err) {
                          // Optionally show error
                        }
                      }}
                    >
                      Terminate Active CTC Structure
                    </Button>
                  )}
                </Box>
              </Box>
              {ctcHistory.length === 0 ? (
                <Typography color="text.secondary">No CTC history found.</Typography>
              ) : (
                <TableContainer component={Paper} sx={{ mt: 2, boxShadow: 2, borderRadius: 2 }}>
                  <Table>
                    <TableHead sx={{ backgroundColor: 'primary.light' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Total CTC</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Effective From</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Effective To</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Components</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {[...ctcHistory]
                        .sort((a, b) => {
                          // Put active (effective_to=null) at top
                          if (!a.effective_to && b.effective_to) return -1;
                          if (a.effective_to && !b.effective_to) return 1;
                          // Otherwise, sort by effective_from descending
                          return new Date(b.effective_from) - new Date(a.effective_from);
                        })
                        .map((ctc, idx, arr) => (
                          <TableRow key={ctc.id} hover>
                            <TableCell>₹{parseFloat(ctc.total_ctc).toLocaleString()}</TableCell>
                            <TableCell>{new Date(ctc.effective_from).toLocaleDateString()}</TableCell>
                            <TableCell>{ctc.effective_to ? new Date(ctc.effective_to).toLocaleDateString() : 'N/A'}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Table size="small" sx={{ mt: 1 }}>
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>Name</TableCell>
                                      <TableCell>Amount</TableCell>
                                      <TableCell>Type</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {ctc.components.map(comp => (
                                      <TableRow key={comp.id}>
                                        <TableCell>{comp.name}</TableCell>
                                        <TableCell>₹{parseFloat(comp.amount).toLocaleString()}</TableCell>
                                        <TableCell>{comp.component_type}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                                {/* Show create components button for any active CTC with no components (robust null check) */}
                                {(ctc.effective_to == null && ctc.components.length === 0) && (
                                  <Button variant="outlined" color="primary" size="small" sx={{ mt: 1 }} onClick={() => {
                                    setOpenComponentDialog(true);
                                    setComponentCtcId(ctc.id);
                                    setComponentTotal(ctc.total_ctc);
                                  }}>Create CTC Components</Button>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              {/* Dialog for creating new CTC structure */}
              <Dialog open={openCtcDialog || false} onClose={() => setOpenCtcDialog(false)} fullWidth maxWidth="sm">
                <DialogTitle>Add Salary Structure</DialogTitle>
                <DialogContent dividers>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="Total CTC"
                      type="number"
                      value={ctcForm.total_ctc}
                      onChange={e => setCtcForm({ ...ctcForm, total_ctc: e.target.value })}
                      fullWidth
                    />
                    <TextField
                      label="Effective From"
                        type="date"
                      InputLabelProps={{ shrink: true }}
                      value={ctcForm.effective_from}
                      onChange={e => setCtcForm({ ...ctcForm, effective_from: e.target.value })}
                      fullWidth
                    />
                  </Box>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setOpenCtcDialog(false)} color="secondary">Cancel</Button>
                  <Button variant="contained" onClick={async () => {
                    try {
                      await axiosInstance.post(`${appConfig.API_PREFIX_V1}/staff/ctc-structure/`, {
                        staff_id: staff.id,
                        total_ctc: parseFloat(ctcForm.total_ctc),
                        effective_from: ctcForm.effective_from,
                      });
                      setOpenCtcDialog(false);
                      setCtcForm({ total_ctc: '', effective_from: '' });
                      // Refresh CTC history
                      const ctcHistoryRes = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/staff/${staff.id}/ctc-structures`);
                      setCtcHistory(ctcHistoryRes.data);
                      // Refresh active CTC
                      try {
                        const activeCtcRes = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/staff/${staff.id}/ctc-structure/active`);
                        setActiveCTC(activeCtcRes.data);
                      } catch (ctcErr) {
                        setActiveCTC(null);
                      }
                    } catch (err) {
                      // Optionally show error
                    }
                  }}>Create</Button>
                </DialogActions>
              </Dialog>
            </Box>
          )}

          {/* Salary History Tab */}
          {tab === 2 && (
            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>Salary History</Typography>
              <TableContainer component={Paper} sx={{ mt: 2, boxShadow: 2, borderRadius: 2 }}>
                <Table>
                  <TableHead sx={{ backgroundColor: 'primary.light' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Month</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Year</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Paid On</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mockSalaryHistory.map(s => (
                      <TableRow key={s.id} hover>
                        <TableCell>{s.month}</TableCell>
                        <TableCell>{s.year}</TableCell>
                        <TableCell>₹{s.amount.toLocaleString()}</TableCell>
                        <TableCell>{s.paid_on}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Attendance Tab */}
          {tab === 3 && (
            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>Monthly Attendance</Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={4}>
                  <Card elevation={2} sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
                    <Typography variant="h4" fontWeight={700} color="success.dark">{mockAttendanceSummary.present}</Typography>
                    <Typography variant="subtitle1" color="text.secondary">Present</Typography>
                  </Card>
                </Grid>
                <Grid item xs={4}>
                  <Card elevation={2} sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light' }}>
                    <Typography variant="h4" fontWeight={700} color="error.dark">{mockAttendanceSummary.absent}</Typography>
                    <Typography variant="subtitle1" color="text.secondary">Absent</Typography>
                  </Card>
                </Grid>
                <Grid item xs={4}>
                  <Card elevation={2} sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light' }}>
                    <Typography variant="h4" fontWeight={700} color="warning.dark">{mockAttendanceSummary.late}</Typography>
                    <Typography variant="subtitle1" color="text.secondary">Late</Typography>
                  </Card>
                </Grid>
              </Grid>
              <Typography variant="subtitle1" gutterBottom>
                Attendance for **{mockAttendanceSummary.month} {mockAttendanceSummary.year}** (Total Days: {mockAttendanceSummary.totalDays})
              </Typography>
            </Box>
          )}

          {/* Files Tab */}
          {tab === 4 && (
            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>Staff Documents</Typography>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                {files.map(f => (
                  <Grid item xs={12} sm={6} md={4} key={f.id}>
                    <Paper elevation={1} sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <AttachFile color="action" />
                        <Typography variant="body1" fontWeight={500}>{f.name}</Typography>
                      </Box>
                      <Box>
                        <Tooltip title="View"><IconButton color="info" size="small"><Visibility /></IconButton></Tooltip>
                        <Tooltip title="Download"><IconButton color="primary" size="small"><Download /></IconButton></Tooltip>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
                <Grid item xs={12} sm={6} md={4}>
                  <Paper elevation={1} sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2, minHeight: 64 }}>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={uploading ? null : <CloudUpload />}
                      disabled={uploading}
                    >
                      {uploading ? <CircularProgress size={20} /> : 'Upload New File'}
                      <input type="file" hidden onChange={handleFileUpload} />
                    </Button>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default StaffDetails;