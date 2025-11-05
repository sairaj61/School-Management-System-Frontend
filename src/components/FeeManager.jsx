import { useState, useEffect, useMemo } from 'react';
import {
  Container, Typography, TextField, Button, MenuItem, Grid, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Card, CardContent, Box, Paper, Autocomplete,
  Tabs, Tab, IconButton
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { handleApiError } from '../utils/errorHandler';
import PaymentIcon from '@mui/icons-material/Payment';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CategoryIcon from '@mui/icons-material/Category';
import CloseIcon from '@mui/icons-material/Close'; // Import CloseIcon for dialogs

import axiosInstance from '../utils/axiosConfig';
import appConfig from '../config/appConfig';

const MONTHS_MAP = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const containerStyle = {
  minHeight: 'calc(100vh - 80px)',
  display: 'flex',
  flexDirection: 'column',
  padding: '16px 0',
};

const dataGridStyle = {
  flex: 1,
  width: '100%',
  minHeight: '400px',
  '& .MuiDataGrid-root': {
    backgroundColor: 'white',
  },
  display: 'flex',
  flexDirection: 'column',
};

const FeeManager = () => {
  const [cumulativePayments, setCumulativePayments] = useState([]);
  const [studentsForAutocomplete, setStudentsForAutocomplete] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [addPaymentModalOpen, setAddPaymentModalOpen] = useState(false);
  const [paymentDetailsModalOpen, setPaymentDetailsModalOpen] = useState(false);
  
  // States for the two new tabs in View Payments modal
  const [paidPaymentDetails, setPaidPaymentDetails] = useState([]);
  const [pendingPaymentDetails, setPendingPaymentDetails] = useState([]);
  const [viewPaymentTabValue, setViewPaymentTabValue] = useState(0); // 0 for Already Paid, 1 for Pending

  const [searchTerm, setSearchTerm] = useState('');
  const [activeAcademicYearId, setActiveAcademicYearId] = useState(null);
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState(null);
  const [paymentFormData, setPaymentFormData] = useState({
    student_id: '',
    academic_year_id: '',
    payment_method: 'Cash',
    description: '',
    payment_details: []
  });

  const [allMonthsCategorySummary, setAllMonthsCategorySummary] = useState([]);
  const [stats, setStats] = useState({
    totalCollected: 0,
    pendingFees: 0,
    paidStudents: 0,
    defaulters: 0
  });
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [mainTabValue, setMainTabValue] = useState(0);
  const [categoryBreakdownModalOpen, setCategoryBreakdownModalOpen] = useState(false);
  const [selectedMonthCategoryBreakdownData, setSelectedMonthCategoryBreakdownData] = useState([]);
  const [selectedMonthForBreakdown, setSelectedMonthForBreakdown] = useState('');

  // State for payment modal tabs (within Add Payment modal)
  const [paymentTabValue, setPaymentTabValue] = useState(0); // 0 for Pending, 1 for Upcoming
  const [pendingInstallments, setPendingInstallments] = useState([]);
  const [upcomingInstallments, setUpcomingInstallments] = useState([]);


  const handleMainTabChange = (event, newValue) => {
    setMainTabValue(newValue);
  };

  const handlePaymentTabChange = (event, newValue) => {
    setPaymentTabValue(newValue);
  };

  const handleViewPaymentTabChange = (event, newValue) => {
    setViewPaymentTabValue(newValue);
  };

  useEffect(() => {
    fetchActiveAcademicYear();
  }, []);

  useEffect(() => {
    if (activeAcademicYearId) {
      fetchCumulativePayments(activeAcademicYearId);
      fetchAllMonthsCategorySummary(activeAcademicYearId, new Date().getFullYear());
    }
  }, [activeAcademicYearId]);

  useEffect(() => {
    const filtered = cumulativePayments.filter(payment => {
      const searchString = (payment.student_name || '').toLowerCase() +
                           (payment.student_roll_number || '').toLowerCase() +
                           (payment.class_name || '').toLowerCase() +
                           (payment.section_name || '').toLowerCase() +
                           (payment.student_parent_name || '').toLowerCase();
      return searchString.includes(searchTerm.toLowerCase());
    });
    setFilteredPayments(filtered);

    const uniqueStudents = {};
    cumulativePayments.forEach(payment => {
      if (!uniqueStudents[payment.student_id]) {
        uniqueStudents[payment.student_id] = {
          id: payment.student_id,
          name: payment.student_name,
          roll_number: payment.student_roll_number,
          class_name: payment.class_name,
          section_name: payment.section_name,
          parent_name: payment.student_parent_name,
        };
      }
    });
    setStudentsForAutocomplete(Object.values(uniqueStudents));
  }, [cumulativePayments, searchTerm]);

  const fetchActiveAcademicYear = async () => {
    try {
      const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/timetable/academic-years/active_academic_years`);
      setActiveAcademicYearId(response.data.id);
      setPaymentFormData(prev => ({
        ...prev,
        academic_year_id: response.data.id
      }));
    } catch (error) {
      handleApiError(error, setAlert);
    }
  };

  const fetchCumulativePayments = async (academicYearId) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/finance/fees-payments/cumulative_details?current_year_id=${academicYearId}`);
      const transformedPayments = response.data.map(payment => ({
        ...payment,
        id: payment.student_id,
        total_fees_to_be_paid: parseFloat(payment.total_fees_to_be_paid),
        total_fees_paid: parseFloat(payment.total_fees_paid),
        due_amount: parseFloat(payment.total_fees_to_be_paid) - parseFloat(payment.total_fees_paid),
        // normalize father's name field: some APIs return `parent_name`, older code expects `student_parent_name`
        student_parent_name: payment.student_parent_name || payment.parent_name || ''
      }));
      setCumulativePayments(transformedPayments);
      calculateStats(transformedPayments);
    } catch (error) {
      handleApiError(error, setAlert);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllMonthsCategorySummary = async (academicYearId, year) => {
    if (!academicYearId) return;

    const allMonthsData = [];
    for (let month = 1; month <= 12; month++) {
      const date = new Date(year, month - 1, 1);
      const formattedDate = date.toISOString().split('T')[0];
      try {
        const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/finance/fees-payments/category_summary?target_date=${formattedDate}&academic_year_id=${academicYearId}`);
        allMonthsData.push({
          id: `${year}-${month}`,
          month_label: MONTHS_MAP.find(m => m.value === month).label,
          ...response.data
        });
      } catch (error) {
        console.error(`Error fetching summary for ${MONTHS_MAP.find(m => m.value === month).label} ${year}:`, error);
        allMonthsData.push({
          id: `${year}-${month}`,
          month_label: MONTHS_MAP.find(m => m.value === month).label,
          month_year: `${MONTHS_MAP.find(m => m.value === month).label} ${year}`,
          summary_by_category: [],
          total_collected_this_month: 0,
          total_pending_this_month: 0,
          total_payable_this_month: 0
        });
      }
    }
    setAllMonthsCategorySummary(allMonthsData);
  };

  const fetchStudentPaymentDetails = async (studentId) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/finance/fees-payments/student_payment_status/${studentId}`);
      const transformedDetails = response.data.map(detail => ({
        ...detail,
        id: detail.student_fixed_fee_payment_schedule_mapping_id,
        fees_to_be_paid: parseFloat(detail.fees_to_be_paid),
        fees_paid: parseFloat(detail.fees_paid),
        pending_amount: parseFloat(detail.pending_amount),
      }));
      
      // Separate into paid and pending for the "View Payments" modal
      setPaidPaymentDetails(transformedDetails.filter(detail => detail.payment_status === 'PAID' || parseFloat(detail.fees_paid) > 0));
      setPendingPaymentDetails(transformedDetails.filter(detail => detail.payment_status === 'PENDING' || parseFloat(detail.pending_amount) > 0));
      
      // Reset to default tab when opening
      setViewPaymentTabValue(0); 
      setPaymentDetailsModalOpen(true);
    } catch (error) {
      handleApiError(error, setAlert);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentModalOpen = (studentFromRow = null) => {
    if (studentFromRow) {
      setSelectedStudentForPayment(studentFromRow);
      setPaymentFormData(prev => ({
        ...prev,
        student_id: studentFromRow.id,
        payment_details: [],
      }));
      fetchStudentPaymentDetailsForAddPayment(studentFromRow.id);
    } else {
      setSelectedStudentForPayment(null);
      setPaymentFormData({
        student_id: '',
        academic_year_id: activeAcademicYearId,
        payment_method: 'Cash',
        description: '',
        payment_details: []
      });
    }
    setPaymentTabValue(0); // Default to Pending tab when opening
    setAddPaymentModalOpen(true);
  };

  const fetchStudentPaymentDetailsForAddPayment = async (studentId) => {
    try {
      const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/finance/fees-payments/student_payment_status/${studentId}`);
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Normalize to start of today for comparison

      const allInstallments = response.data
        .filter(item => parseFloat(item.pending_amount) > 0) // Only show items with pending amount
        .map(item => ({
          fee_id: item.fee_id,
          fee_category_id: item.fee_category_id,
          student_fixed_fee_id: item.student_fixed_fee_id,
          student_fixed_fee_payment_schedule_mapping_id: item.student_fixed_fee_payment_schedule_mapping_id,
          // Initialize amount_paying to the pending amount (string) so it's prefilled but editable
          amount_paying: parseFloat(item.pending_amount).toString(),
          pending_amount: parseFloat(item.pending_amount),
          fee_category_name: item.fee_category_name,
          payment_due_date: item.payment_due_date,
          payment_date: new Date().toISOString().split('T')[0], // New: Initialize payment_date to today
          // Add a flag to easily distinguish
          is_pending: new Date(item.payment_due_date) <= now
        }));

      setPendingInstallments(allInstallments.filter(item => item.is_pending));
      setUpcomingInstallments(allInstallments.filter(item => !item.is_pending));

      // When setting payment_details, initialize amount_paying to the pending amount so inputs show it by default
      // Keep as strings to preserve user input behavior and validation logic
      setPaymentFormData(prev => ({
        ...prev,
        payment_details: allInstallments.map(item => ({ 
          ...item, 
          amount_paying: item.amount_paying ?? parseFloat(item.pending_amount).toString(), 
          payment_date: item.payment_date ?? new Date().toISOString().split('T')[0]
        })) 
      }));

    } catch (error) {
      handleApiError(error, setAlert);
    }
  };

  const handleAddPaymentModalClose = () => {
    setAddPaymentModalOpen(false);
    setSelectedStudentForPayment(null);
    setPaymentFormData({
      student_id: '',
      academic_year_id: activeAcademicYearId,
      payment_method: 'Cash',
      description: '',
      payment_details: []
    });
    setPendingInstallments([]); // Clear installment lists
    setUpcomingInstallments([]);
  };

  const handlePaymentDetailsModalClose = () => {
    setPaymentDetailsModalOpen(false);
    setPaidPaymentDetails([]); // Clear paid details
    setPendingPaymentDetails([]); // Clear pending details
  };

  const handleViewCategoryBreakdown = (rowData) => {
    setSelectedMonthCategoryBreakdownData(rowData.summary_by_category);
    setSelectedMonthForBreakdown(rowData.month_label);
    setCategoryBreakdownModalOpen(true);
  };

  const handleCategoryBreakdownModalClose = () => {
    setCategoryBreakdownModalOpen(false);
    setSelectedMonthCategoryBreakdownData([]);
    setSelectedMonthForBreakdown('');
  };

  const handleFormInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePaymentDetailChange = (id, field, value) => {
    // If value is an empty string, store it as empty string. Otherwise, try to parse.
    const numericValue = value === '' ? '' : parseFloat(value);
    const isValidNumber = value === '' || (!isNaN(numericValue) && numericValue >= 0);

    setPaymentFormData(prev => {
      const newPaymentDetails = prev.payment_details.map(detail => {
        if (detail.student_fixed_fee_payment_schedule_mapping_id === id) {
          if (field === 'amount_paying') {
            const pending = parseFloat(detail.pending_amount);

            if (!isValidNumber) {
              setAlert({
                open: true,
                message: 'Please enter a valid non-negative number.',
                severity: 'error'
              });
              return { ...detail, [field]: value }; // Keep the invalid input for user to correct
            } else if (value !== '' && numericValue > pending) {
              setAlert({
                open: true,
                message: `Payment amount (₹${numericValue.toFixed(2)}) cannot exceed pending amount (₹${pending.toFixed(2)}) for ${detail.fee_category_name}.`,
                severity: 'error'
              });
              // Cap the input visually and internally if it exceeds pending
              return { ...detail, [field]: pending.toString() };
            } else {
              setAlert({ open: false, message: '', severity: 'success' }); // Clear previous error
              return { ...detail, [field]: value }; // Store the value (empty string or valid number string)
            }
          } else {
            // For payment_date or other fields
            return { ...detail, [field]: value };
          }
        }
        return detail;
      });

      // Also update the respective pending/upcoming lists to reflect the visual changes
      setPendingInstallments(prevPending => 
        prevPending.map(item => item.student_fixed_fee_payment_schedule_mapping_id === id ? { ...item, [field]: value } : item)
      );
      setUpcomingInstallments(prevUpcoming =>
        prevUpcoming.map(item => item.student_fixed_fee_payment_schedule_mapping_id === id ? { ...item, [field]: value } : item)
      );

      return { ...prev, payment_details: newPaymentDetails };
    });
  };


  const handleProcessPayment = async (e) => {
    e.preventDefault();
    try {
      // Filter out items where amount_paying is empty string or 0
      const filteredPaymentDetails = paymentFormData.payment_details
        .filter(detail => detail.amount_paying !== '' && parseFloat(detail.amount_paying) > 0)
        .map(detail => ({
          fee_id: detail.fee_id,
          fee_category_id: detail.fee_category_id,
          student_fixed_fee_id: detail.student_fixed_fee_id,
          student_fixed_fee_payment_schedule_mapping_id: detail.student_fixed_fee_payment_schedule_mapping_id,
          amount_paying: parseFloat(detail.amount_paying), // Ensure it's a number for API
          pending_amount: parseFloat(detail.pending_amount),
          payment_date: detail.payment_date // New: Include payment_date
        }));

      const invalidPayments = filteredPaymentDetails.filter(
        detail => detail.amount_paying > detail.pending_amount
      );

      if (invalidPayments.length > 0) {
        const errorMessages = invalidPayments.map(
          detail => `Payment of ₹${detail.amount_paying.toFixed(2)} for ${detail.fee_category_name} exceeds pending amount of ₹${detail.pending_amount.toFixed(2)}.`
        ).join('\n');
        setAlert({
          open: true,
          message: `Invalid payment amounts:\n${errorMessages}`,
          severity: 'error'
        });
        return;
      }

      if (filteredPaymentDetails.length === 0) {
        setAlert({
          open: true,
          message: 'Please enter a valid payment amount (greater than 0) for at least one fee.',
          severity: 'warning'
        });
        return;
      }

      if (!paymentFormData.student_id) {
        setAlert({
          open: true,
          message: 'Please select a student.',
          severity: 'warning'
        });
        return;
      }

      const requestData = {
        student_id: paymentFormData.student_id,
        academic_year_id: paymentFormData.academic_year_id,
        payment_method: paymentFormData.payment_method,
        description: paymentFormData.description,
        payment_details: filteredPaymentDetails
      };

      await axiosInstance.post(`${appConfig.API_PREFIX_V1}/finance/fees-payments/process_payment`, requestData);
      setAlert({
        open: true,
        message: 'Payment processed successfully!',
        severity: 'success'
      });
      handleAddPaymentModalClose();
      fetchCumulativePayments(activeAcademicYearId);
      fetchAllMonthsCategorySummary(activeAcademicYearId, new Date().getFullYear());

      if (paymentDetailsModalOpen && selectedStudentForPayment?.id === paymentFormData.student_id) {
        fetchStudentPaymentDetails(paymentFormData.student_id);
      }
    } catch (error) {
      handleApiError(error, setAlert);
    }
  };

  const handleStudentSearch = (event, value) => {
    if (value) {
      setSelectedStudentForPayment(value);
      setPaymentFormData(prev => ({
        ...prev,
        student_id: value.id,
      }));
      fetchStudentPaymentDetailsForAddPayment(value.id);
    } else {
      setSelectedStudentForPayment(null);
      setPaymentFormData(prev => ({
        ...prev,
        student_id: '',
        payment_details: []
      }));
      setPendingInstallments([]); // Clear installment lists
      setUpcomingInstallments([]);
    }
  };

  const calculateStats = (data) => {
    try {
      const totalCollected = data.reduce((sum, payment) => sum + payment.total_fees_paid, 0);
      const pendingFees = data.reduce((sum, payment) => sum + payment.due_amount, 0);
      
      // Calculate paidStudents based on whether total_fees_paid is greater than 0
      const paidStudents = data.filter(p => p.total_fees_paid > 0).length;
      
      // Calculate total unique students. This should ideally come from a master student list if some students have no fees yet.
      // For now, based on cumulative payments, or fallback to studentsForAutocomplete if it's more comprehensive.
      const totalStudentsPresent = data.length; 
      const defaulters = totalStudentsPresent - paidStudents; // Simplified: students with pending amount > 0

      setStats({
        totalCollected,
        pendingFees,
        paidStudents,
        defaulters
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };

  const columns = useMemo(() => [
    {
      field: 'student_name',
      headerName: 'Student Name',
      flex: 1.2, minWidth: 120
    },
    {
      field: 'student_roll_number',
      headerName: 'Roll No.',
      flex: 0.8, minWidth: 80
    },
    {
      field: 'class_name',
      headerName: 'Class',
      flex: 0.6, minWidth: 60
    },
    {
      field: 'section_name',
      headerName: 'Section',
      flex: 0.6, minWidth: 60
    },
    {
      field: 'total_fees_to_be_paid',
      headerName: 'Total Payable',
      flex: 1, minWidth: 120,
      valueFormatter: (params) => `₹${parseFloat(params.value).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`
    },
    {
      field: 'total_fees_paid',
      headerName: 'Total Paid',
      flex: 1, minWidth: 120,
      valueFormatter: (params) => `₹${parseFloat(params.value).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`
    },
    {
      field: 'due_amount',
      headerName: 'Pending Amount',
      flex: 1, minWidth: 120,
      valueFormatter: (params) => `₹${parseFloat(params.value).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`
    },
    {
      field: 'payment_status',
      headerName: 'Status',
      flex: 0.8, minWidth: 90
    },
    {
      field: 'student_enrolment_date',
      headerName: 'Enrollment Date',
      flex: 1, minWidth: 120,
      valueFormatter: (params) => {
        if (!params.value) return '';
        const date = new Date(params.value);
        return date.toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.8, minWidth: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton
            color="primary"
            size="small"
            onClick={() => {
              setSelectedStudentForPayment(params.row);
              fetchStudentPaymentDetails(params.row.student_id);
            }}
            title="View Details"
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton
            color="secondary"
            size="small"
            onClick={() => handleAddPaymentModalOpen(params.row)}
            title="Add Payment"
          >
            <AddCircleOutlineIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ], []);

  const paymentDetailColumns = useMemo(() => [
    { field: 'fee_category_name', headerName: 'Fee Category', flex: 1.2, minWidth: 120 },
    { field: 'fees_to_be_paid', headerName: 'Total Payable', flex: 1, minWidth: 100, valueFormatter: (params) => `₹${params.value.toLocaleString('en-IN', {minimumFractionDigits: 2})}` },
    { field: 'fees_paid', headerName: 'Amount Paid', flex: 1, minWidth: 100, valueFormatter: (params) => `₹${params.value.toLocaleString('en-IN', {minimumFractionDigits: 2})}` },
    { field: 'pending_amount', headerName: 'Pending', flex: 0.8, minWidth: 80, valueFormatter: (params) => `₹${params.value.toLocaleString('en-IN', {minimumFractionDigits: 2})}` },
    { field: 'payment_due_date', headerName: 'Due Date', flex: 1, minWidth: 120, valueFormatter: (params) => new Date(params.value).toLocaleDateString('en-IN') },
    { field: 'paid_date', headerName: 'Paid Date', flex: 1, minWidth: 120, valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString('en-IN') : 'N/A' },
    { field: 'payment_status', headerName: 'Status', flex: 0.8, minWidth: 90 },
  ], []);

  const monthlySummaryColumns = useMemo(() => [
    { field: 'month_label', headerName: 'Month', width: 100, flex: 0.7 },
    { field: 'total_payable_this_month', headerName: 'Total Payable', width: 120, flex: 1,
      valueFormatter: (params) => `₹${parseFloat(params.value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
    { field: 'total_collected_this_month', headerName: 'Total Collected', width: 120, flex: 1,
      valueFormatter: (params) => `₹${parseFloat(params.value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
    { field: 'total_pending_this_month', headerName: 'Total Pending', width: 120, flex: 1,
      valueFormatter: (params) => `₹${parseFloat(params.value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
    {
      field: 'view_categories',
      headerName: 'Categories',
      width: 100,
      flex: 0.6,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={() => handleViewCategoryBreakdown(params.row)}
          title={`View category breakdown for ${params.row.month_label}`}
        >
          <CategoryIcon fontSize="small" />
        </IconButton>
      )
    }
  ], []);

  const categoryBreakdownModalColumns = useMemo(() => [
    { field: 'fee_category_name', headerName: 'Category', flex: 1.2, minWidth: 120 },
    { field: 'total_amount_to_be_paid', headerName: 'Payable', flex: 1, minWidth: 90,
      valueFormatter: (params) => `₹${parseFloat(params.value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
    { field: 'total_amount_paid', headerName: 'Paid', flex: 1, minWidth: 90,
      valueFormatter: (params) => `₹${parseFloat(params.value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
    { field: 'total_pending_amount', headerName: 'Pending', flex: 1, minWidth: 90,
      valueFormatter: (params) => `₹${parseFloat(params.value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
  ], []);

  const renderInstallmentList = (installments) => (
    installments.length === 0 ? (
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        No {paymentTabValue === 0 ? 'pending' : 'upcoming'} payments for this student.
      </Typography>
    ) : (
      <Grid container spacing={2}>
        {installments.map(detail => (
          <Grid item xs={12} key={detail.student_fixed_fee_payment_schedule_mapping_id}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <Typography variant="body2">
                    {detail.fee_category_name}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Due: {new Date(detail.payment_due_date).toLocaleDateString('en-IN')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="body2">
                    Pending: ₹{detail.pending_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Amount Paying"
                    value={detail.amount_paying}
                    onChange={(e) => handlePaymentDetailChange(detail.student_fixed_fee_payment_schedule_mapping_id, 'amount_paying', e.target.value)}
                    type="number"
                    inputProps={{ min: 0, step: "0.01" }}
                    size="small"
                    error={parseFloat(detail.amount_paying) > detail.pending_amount || (detail.amount_paying !== '' && isNaN(parseFloat(detail.amount_paying)))}
                    helperText={
                      (detail.amount_paying !== '' && isNaN(parseFloat(detail.amount_paying)))
                        ? 'Invalid number'
                        : parseFloat(detail.amount_paying) > detail.pending_amount
                          ? `Max: ₹${detail.pending_amount.toFixed(2)}`
                          : ''
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Payment Date"
                    type="date"
                    value={detail.payment_date}
                    onChange={(e) => handlePaymentDetailChange(detail.student_fixed_fee_payment_schedule_mapping_id, 'payment_date', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                    required
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        ))}
      </Grid>
    )
  );

  return (
    <Container maxWidth="xl" sx={containerStyle}>
      <Paper sx={{ mb: 2, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Tabs value={mainTabValue} onChange={handleMainTabChange} aria-label="main fee tabs">
          <Tab label="Overview & Stats" />
          <Tab label="Student Payment Records" />
        </Tabs>

        {mainTabValue === 0 && (
          <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Card sx={{ mb: 3, boxShadow: 3 }}>
              <CardContent sx={{ pb: '16px !important' }}>
                <Typography variant="h6" gutterBottom>All Time Collection</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ p: 2, bgcolor: 'primary.light', color: 'white', borderRadius: 1 }}>
                      <Typography variant="subtitle2">Total Collected</Typography>
                      <Typography variant="h6">
                        ₹{stats.totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ p: 2, bgcolor: 'error.light', color: 'white', borderRadius: 1 }}>
                      <Typography variant="subtitle2">Pending Fees</Typography>
                      <Typography variant="h6">
                        ₹{stats.pendingFees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ p: 2, bgcolor: 'secondary.light', color: 'white', borderRadius: 1 }}>
                      <Typography variant="subtitle2">Students Paid</Typography>
                      <Typography variant="h6">
                        {stats.paidStudents.toLocaleString()}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ p: 2, bgcolor: 'warning.light', color: 'white', borderRadius: 1 }}>
                      <Typography variant="subtitle2">Defaulters</Typography>
                      <Typography variant="h6">
                        {stats.defaulters.toLocaleString()}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Monthly Breakdowns ({new Date().getFullYear()})</Typography>
            <Paper sx={{ height: 450, width: '100%', mb: 2 }}>
                <DataGrid
                    rows={allMonthsCategorySummary}
                    columns={monthlySummaryColumns}
                    pageSize={12}
                    rowsPerPageOptions={[12]}
                    disableSelectionOnClick
                    loading={loading}
                    getRowId={(row) => row.id}
                    hideFooter
                    sx={{
                        height: '100%',
                        '& .MuiDataGrid-row:hover': {
                            backgroundColor: 'action.hover'
                        }
                    }}
                />
            </Paper>
          </Box>
        )}

        {mainTabValue === 1 && (
          <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Grid item xs>
                <Typography variant="h5">Student Payment Records</Typography>
              </Grid>
              <Grid item>
                <TextField
                  size="small"
                  placeholder="Search by student name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{ mr: 2 }}
                />
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  onClick={() => handleAddPaymentModalOpen()}
                  startIcon={<PaymentIcon />}
                  sx={{ height: 40 }}
                >
                  Add Payment
                </Button>
              </Grid>
            </Grid>
            <Paper sx={dataGridStyle}>
              <DataGrid
                rows={filteredPayments}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[10, 25, 50]}
                disableSelectionOnClick
                loading={loading}
                getRowId={(row) => row.id}
                sx={{
                  height: '100%',
                  '& .MuiDataGrid-row:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
              />
            </Paper>
          </Box>
        )}
      </Paper>

      <Dialog open={addPaymentModalOpen} onClose={handleAddPaymentModalClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pr: 6 }}>
          Add Payment {selectedStudentForPayment ? `for ${selectedStudentForPayment.name}` : ''}
          <IconButton
            onClick={handleAddPaymentModalClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleProcessPayment}>
          <DialogContent sx={{ p: 3 }}>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12}>
                <Autocomplete
                  fullWidth
                  options={studentsForAutocomplete}
                  getOptionLabel={(student) =>
                    `${student.name} - ${student.roll_number} (${student.class_name || ''} ${student.section_name || ''})`
                  }
                  renderOption={(props, student) => (
                    <Box component="li" {...props}>
                      <Box>
                        <Typography variant="subtitle1">
                          {student.name} ({student.roll_number})
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Class: {student.class_name || 'N/A'} | Section: {student.section_name || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Parent's Name: {student.parent_name || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Student"
                      variant="outlined"
                      required
                    />
                  )}
                  onChange={(event, value) => handleStudentSearch(event, value)}
                  value={studentsForAutocomplete.find(student => student.id === paymentFormData.student_id) || null}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  disabled={!!selectedStudentForPayment}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Payment Method"
                  name="payment_method"
                  value={paymentFormData.payment_method}
                  onChange={handleFormInputChange}
                  required
                  select
                >
                  <MenuItem value="Cash">Cash</MenuItem>
                  <MenuItem value="Card">Card</MenuItem>
                  <MenuItem value="Online">Online</MenuItem>
                  <MenuItem value="Cheque">Cheque</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={paymentFormData.description}
                  onChange={handleFormInputChange}
                  multiline
                  rows={1}
                />
              </Grid>
            </Grid>

            {/* New Tabs for Pending and Upcoming Installments */}
            {paymentFormData.student_id && (
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={paymentTabValue} onChange={handlePaymentTabChange} aria-label="installment tabs">
                  <Tab label={`Pending Installments (${pendingInstallments.length})`} />
                  <Tab label={`Upcoming Installments (${upcomingInstallments.length})`} />
                </Tabs>
              </Box>
            )}

            {/* Render content based on selected payment tab */}
            {paymentTabValue === 0 && renderInstallmentList(pendingInstallments)}
            {paymentTabValue === 1 && renderInstallmentList(upcomingInstallments)}

            {!paymentFormData.student_id && (
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Select a student to see their payments.
              </Typography>
            )}

          </DialogContent>
          <DialogActions>
            <Button variant="contained" color="primary" onClick={handleProcessPayment}>Process Payment</Button>
            <Button onClick={handleAddPaymentModalClose}>Cancel</Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={paymentDetailsModalOpen} onClose={handlePaymentDetailsModalClose} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ pr: 6 }}>
          Payment Details for {selectedStudentForPayment ? selectedStudentForPayment.student_name : 'Student'}
          <IconButton
            onClick={handlePaymentDetailsModalClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {/* New Tabs for Already Paid and Pending Payments */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={viewPaymentTabValue} onChange={handleViewPaymentTabChange} aria-label="view payment tabs">
              <Tab label={`Already Paid (${paidPaymentDetails.length})`} />
              <Tab label={`Pending (${pendingPaymentDetails.length})`} />
            </Tabs>
          </Box>

          {viewPaymentTabValue === 0 && (
            <Box sx={{ height: Math.min(paidPaymentDetails.length * 52 + 56, 500), width: '100%' }}>
              {paidPaymentDetails.length === 0 ? (
                <Typography variant="body2" color="textSecondary">No paid payments for this student.</Typography>
              ) : (
                <DataGrid
                  rows={paidPaymentDetails}
                  columns={paymentDetailColumns}
                  pageSize={5}
                  rowsPerPageOptions={[5, 10, 20]}
                  disableSelectionOnClick
                  getRowId={(row) => row.id}
                  sx={{
                    '& .MuiDataGrid-row:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                />
              )}
            </Box>
          )}

          {viewPaymentTabValue === 1 && (
            <Box sx={{ height: Math.min(pendingPaymentDetails.length * 52 + 56, 500), width: '100%' }}>
              {pendingPaymentDetails.length === 0 ? (
                <Typography variant="body2" color="textSecondary">No pending payments for this student.</Typography>
              ) : (
                <DataGrid
                  rows={pendingPaymentDetails}
                  columns={paymentDetailColumns}
                  pageSize={5}
                  rowsPerPageOptions={[5, 10, 20]}
                  disableSelectionOnClick
                  getRowId={(row) => row.id}
                  sx={{
                    '& .MuiDataGrid-row:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                />
              )}
            </Box>
          )}

        </DialogContent>
        <DialogActions>
          <Button onClick={handlePaymentDetailsModalClose}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={categoryBreakdownModalOpen} onClose={handleCategoryBreakdownModalClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pr: 6 }}>
          Category Breakdown for {selectedMonthForBreakdown}
          <IconButton
            onClick={handleCategoryBreakdownModalClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            Close
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {(selectedMonthCategoryBreakdownData || []).length === 0 ? (
            <Typography variant="body2" color="textSecondary">No detailed category data for this month.</Typography>
          ) : (
            <Box sx={{ height: Math.min((selectedMonthCategoryBreakdownData || []).length * 52 + 56, 550), width: '100%' }}>
              <DataGrid
                rows={(selectedMonthCategoryBreakdownData || []).map((item, index) => ({ id: item.fee_category_name + index, ...item }))}
                columns={categoryBreakdownModalColumns}
                pageSize={10}
                rowsPerPageOptions={[10, 20]}
                disableSelectionOnClick
                getRowId={(row) => row.id}
                sx={{
                  '& .MuiDataGrid-row:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCategoryBreakdownModalClose}>Close</Button>
        </DialogActions>
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

export default FeeManager;
