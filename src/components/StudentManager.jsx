import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, TextField, Button, MenuItem, Grid, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Box, Paper, Card, CardContent, FormControl, InputLabel, Select, IconButton, List, ListItem, ListItemText, Tooltip, Divider, Tabs, Tab, Chip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { handleApiError } from '../utils/errorHandler';
import axiosInstance from '../utils/axiosConfig';
import appConfig from '../config/appConfig';
import StudentAttendance from './StudentAttendance';
import StudentDetails from './StudentDetails';
import JSZip from 'jszip';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// Icons
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'; 
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import ArchiveIcon from '@mui/icons-material/Archive'; // For Dropout
import UnarchiveIcon from '@mui/icons-material/Unarchive'; // For Activate
import AssignmentIcon from '@mui/icons-material/Assignment'; // For Manage Facilities (alternative to VisibilityIcon)
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'; // For Attendance
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; // For back navigation

const StudentManager = (props) => {
	const [students, setStudents] = useState([]);
	const [classes, setClasses] = useState([]);
	const [sections, setSections] = useState([]);
	const [academicYears, setAcademicYears] = useState([]);
	const [feeCategories, setFeeCategories] = useState([]);
	const [concessionTypes, setConcessionTypes] = useState([]);
	const [classFees, setClassFees] = useState([]); // Non-optional fees for Admit Student modal
	const [optionalFeesForSelectedClass, setOptionalFeesForSelectedClass] = useState([]); // Optional fees for Manage Facilities modal
	const [routes, setRoutes] = useState([]); // All transport routes
	const [drivers, setDrivers] = useState([]); // All drivers

	const [loading, setLoading] = useState(true);
	const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
	const [addEditModalOpen, setAddEditModalOpen] = useState(false); // For Add/Edit Student
	const [admitModalOpen, setAdmitModalOpen] = useState(false); // For Admit Student
	
	// Removed studentDetailsModalOpen as it's replaced by a top-level tab
	const [addFacilitySubModalOpen, setAddFacilitySubModalOpen] = useState(false); // For Adding NEW facility within studentDetailsTab

	const [searchTerm, setSearchTerm] = useState('');

	// Filter states
	const [filterStatus, setFilterStatus] = useState('ACTIVE');
	const [filterAcademicYear, setFilterAcademicYear] = useState('');

	const [selectedStudent, setSelectedStudent] = useState(null); // For Add/Edit Student / View Details
	const [studentFacilities, setStudentFacilities] = useState([]); // Facilities enrolled by the selected student
	const [studentFixedFees, setStudentFixedFees] = useState([]); // State for student's fixed fees
	
	// New state to hold the student whose details are currently being viewed in the dedicated tab
	const [viewedStudent, setViewedStudent] = useState(null); 
	const [studentDetailsTabValue, setStudentDetailsTabValue] = useState(0); // For sub-tabs within student details 

	const [formData, setFormData] = useState({
		name: '',
		roll_number: '',
		date_of_birth: '',
		gender: '',
		email: '',
		phone_number: '',
		address: '',
		class_id: '',
		section_id: '',
		academic_year_id: '',
		medical_history: '',
		emergency_contact_number: '',
		old_school_name: '',
		enrollment_date: '',
		fee_categories_with_concession: [],
		parents: [], // <-- Add parents array
	});

	const [newFacilityForm, setNewFacilityForm] = useState({ // For adding new facilities
		fee_category_id: '',
		start_date: new Date().toISOString().split('T')[0],
		end_date: '',
		concession_type_id: '',
		concession_amount: 0,
		route_id: '', // For transport
		driver_id: '' // For transport
	});

	const [stats, setStats] = useState({
		totalStudents: 0,
		totalClasses: 0,
		totalSections: 0,
	});

	const [filteredSectionsForDropdown, setFilteredSectionsForDropdown] = useState([]);

	// Main tabs state: 0 for "All Students", 1 for "Students by Category", 2 for "Student Details"
	const [tabValue, setTabValue] = useState(0); 
	const [studentsByCategory, setStudentsByCategory] = useState([]);
	const [selectedFeeCategory, setSelectedFeeCategory] = useState('');
	const [searchTermCategory, setSearchTermCategory] = useState(''); 
	const [filterRoute, setFilterRoute] = useState(''); 
	const [filterDriver, setFilterDriver] = useState(''); 

	// Add state for upload
	const [uploading, setUploading] = useState(false);

	useEffect(() => {
		fetchInitialData();
	}, []);

	useEffect(() => {
		if (tabValue === 0) {
			fetchStudents(filterStatus, filterAcademicYear);
		} else if (tabValue === 1) { // Students by Category tab
			if (selectedFeeCategory) {
				fetchStudentsByFeeCategory(selectedFeeCategory, filterRoute, filterDriver);
			}
		}
		// No explicit fetch for tabValue === 2 (Student Details) here,
		// as it's triggered by clicking "View Details" and sets 'viewedStudent'
	}, [filterStatus, filterAcademicYear, tabValue, selectedFeeCategory, filterRoute, filterDriver]);

	// Updated useEffect for stats to reflect the active tab's data
	useEffect(() => {
		if (tabValue === 0) {
			setStats({
				totalStudents: students.length,
				totalClasses: classes.length,
				totalSections: sections.length,
			});
		} else if (tabValue === 1) {
			setStats({
				totalStudents: studentsByCategory.length, 
				totalClasses: classes.length,
				totalSections: sections.length,
			});
		} else { // For the "Student Details" tab, stats might not be directly relevant or would show 1 student
			setStats({
				totalStudents: viewedStudent ? 1 : 0,
				totalClasses: classes.length,
				totalSections: sections.length,
			});
		}
	}, [students, studentsByCategory, classes, sections, tabValue, viewedStudent]); 

	const fetchInitialData = async () => {
		try {
			setLoading(true);
			const [
				classesResponse,
				academicYearsResponse,
				sectionsResponse,
				feeCategoriesResponse,
				concessionTypesResponse,
				routesResponse,
				driversResponse
			] = await Promise.all([
				axiosInstance.get(`${appConfig.API_PREFIX_V1}/students-managements/classes/`),
				axiosInstance.get(`${appConfig.API_PREFIX_V1}/timetable/academic-years/`),
				axiosInstance.get(`${appConfig.API_PREFIX_V1}/students-managements/sections/`),
				axiosInstance.get(`${appConfig.API_PREFIX_V1}/fees-management/fee-categories/`),
				axiosInstance.get(`${appConfig.API_PREFIX_V1}/concessions-management/concession-types/`),
				axiosInstance.get(`${appConfig.API_PREFIX_V1}/students-managements/transport/routes`),
				axiosInstance.get(`${appConfig.API_PREFIX_V1}/students-managements/transport/drivers/`)
			]);
			setClasses(classesResponse.data);
			setAcademicYears(academicYearsResponse.data);
			setSections(sectionsResponse.data);
			setFeeCategories(feeCategoriesResponse.data);
			setConcessionTypes(concessionTypesResponse.data);
			setRoutes(routesResponse.data);
			setDrivers(driversResponse.data);

			// Set default selected fee category to ADMISSION if available
			const admissionCategory = feeCategoriesResponse.data.find(cat => cat.category_name === 'ADMISSION');
			if (admissionCategory) {
				setSelectedFeeCategory(admissionCategory.id);
			}

		} catch (error) {
			handleApiError(error, setAlert);
		} finally {
			setLoading(false);
		}
	};

	const fetchStudents = async (status, academicYearId) => {
		try {
			setLoading(true);
			let url = `${appConfig.API_PREFIX_V1}/students-managements/students/?status=${status}`;
			if (academicYearId) {
				url += `&academic_year_id=${academicYearId}`;
			}
			const response = await axiosInstance.get(url);
			setStudents(response.data);
		} catch (error) {
			handleApiError(error, setAlert);
		} finally {
			setLoading(false);
		}
	};

	const fetchStudentsByFeeCategory = async (feeCategoryId, routeId = '', driverId = '') => {
		try {
			setLoading(true);
			let url = `${appConfig.API_PREFIX_V1}/students-managements/students/by-fee-category/${feeCategoryId}`;

			// Check if the selected category is TRANSPORT before adding route/driver filters
			const selectedCategoryDetails = feeCategories.find(cat => cat.id === feeCategoryId);
			if (selectedCategoryDetails && selectedCategoryDetails.category_name === 'TRANSPORT') {
				if (routeId) {
					url += `?route_id=${routeId}`;
				}
				if (driverId) {
					url += routeId ? `&driver_id=${driverId}` : `?driver_id=${driverId}`;
				}
			}

			const response = await axiosInstance.get(url);
			setStudentsByCategory(response.data);
		} catch (error) {
			handleApiError(error, setAlert);
			setStudentsByCategory([]);
		} finally {
			setLoading(false);
		}
	};

	const fetchStudentFacilities = async (studentId) => {
		try {
			setLoading(true); 
			const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/students-managements/students-facility/${studentId}/facilities`);
			setStudentFacilities(response.data);
		} catch (error) {
			handleApiError(error, setAlert);
			setStudentFacilities([]);
		} finally {
			setLoading(false);
		}
	};

	// New: Fetch student's fixed fees
	const fetchStudentFixedFees = async (studentId) => {
		try {
			setLoading(true);
			const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/students-managements/students/${studentId}/fees`);
			setStudentFixedFees(response.data.fixed_fees);
		} catch (error) {
			handleApiError(error, setAlert);
			setStudentFixedFees([]);
		} finally {
			setLoading(false);
		}
	};

	const fetchOptionalFeesByClass = async (classId) => {
		try {
			const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/fees/by-class/${classId}`);
			setOptionalFeesForSelectedClass(response.data.filter(fee => fee.is_optional));
		} catch (error) {
			handleApiError(error, setAlert);
			setOptionalFeesForSelectedClass([]);
		}
	};

	const filterSectionsByClass = (classId) => {
		const filtered = sections.filter(section => section.class_id === classId);
		setFilteredSectionsForDropdown(filtered);
	};

	const fetchClassFees = async (classId) => {
		try {
			const response = await axiosInstance.get(`${appConfig.API_PREFIX_V1}/fees/by-class/${classId}`);
			const nonOptionalFees = response.data.filter(fee => !fee.is_optional);
			setClassFees(nonOptionalFees.map(fee => ({
				...fee,
				start_date: new Date().toISOString().split('T')[0],
				end_date: '',
				concession_type_id: '',
				concession_amount: 0
			})));
		} catch (error) {
			handleApiError(error, setAlert);
			setClassFees([]);
		}
	};

	const resetFormData = () => {
		setFormData({
			name: '', roll_number: '', date_of_birth: '', gender: '', email: '', phone_number: '', address: '',
			class_id: '', section_id: '', academic_year_id: '', medical_history: '', emergency_contact_number: '', old_school_name: '',
			enrollment_date: '', fee_categories_with_concession: [], parents: []
		});
		setFilteredSectionsForDropdown([]);
		setClassFees([]);
		setOptionalFeesForSelectedClass([]);
		setParentForm({ name: '', phone_number: '', email: '', relation: '' });
		setParentEditIndex(null);
	};

	const handleAddEditModalOpen = (student = null) => {
		if (student) {
			setSelectedStudent(student);
			setFormData({
				name: student.name, roll_number: student.roll_number, date_of_birth: student.date_of_birth?.split('T')[0] || '', gender: student.gender || '', email: student.email || '', phone_number: student.phone_number || '', address: student.address,
				class_id: student.class_id, section_id: student.section_id, academic_year_id: student.academic_year_id,
				medical_history: student.medical_history || '', emergency_contact_number: student.emergency_contact_number || '', old_school_name: student.old_school_name || '',
				fee_categories_with_concession: []
			});
			if (student.class_id) {
				filterSectionsByClass(student.class_id);
			}
			setAddEditModalOpen(true);
		} else {
			resetFormData();
			setAddEditModalOpen(true);
		}
	};

	const handleAddEditModalClose = () => {
		setAddEditModalOpen(false);
		setSelectedStudent(null);
		resetFormData();
	};

	const handleAdmitModalOpen = () => {
		resetFormData();
		setAdmitModalOpen(true);
	};

	const handleAdmitModalClose = () => {
		setAdmitModalOpen(false);
		resetFormData();
	};

	// New: Handle opening the main student details page (navigate to standalone route)
	const navigate = useNavigate();
	const handleViewStudentDetails = (student) => {
		if (!student || !student.id) return;
		// Prefetch some data for a snappy experience (best-effort)
		try {
			fetchStudentFacilities(student.id);
			fetchStudentFixedFees(student.id);
			if (student.class_id) fetchOptionalFeesByClass(student.class_id);
		} catch (err) {
			// Ignore prefetch errors
		}
		// Navigate to the standalone StudentDetails route so it renders full-page
		navigate(`/students/${student.id}`);
	};

	// New: Handle opening the student attendance tab
	const handleViewStudentAttendance = (student) => {
		// Enrich student object with computed fields for StudentDetails component
		const enrichedStudent = {
			...student,
			class_name: classes.find(c => c.id === student.class_id)?.class_name || 'N/A',
			section_name: sections.find(s => s.id === student.section_id)?.name || 'N/A', 
			academic_year_name: academicYears.find(ay => ay.id === student.academic_year_id)?.year_name || 'N/A'
		};
		
		setViewedStudent(enrichedStudent); // Set the enriched student object for the dedicated tab
		fetchStudentFacilities(student.id); 
		fetchStudentFixedFees(student.id); 
		if (student.class_id) {
			fetchOptionalFeesByClass(student.class_id); 
		} else {
			setOptionalFeesForSelectedClass([]);
		}
		setStudentDetailsTabValue(3); // Switch to the "Attendance" sub-tab (index 3)
		setTabValue(2); // Switch to the "Student Details" tab (index 2)
	};

	// No separate close function for the tab, as it's part of the main tab system.
	// Clearing viewedStudent data when switching away from the tab or on component unmount
	// can be handled by useEffect if needed, but not explicitly requested.

	// New: Handle opening the "Add New Facility" sub-modal
	const handleAddFacilitySubModalOpen = () => {
		setNewFacilityForm({ 
			fee_category_id: '',
			start_date: new Date().toISOString().split('T')[0],
			end_date: '',
			concession_type_id: '',
			concession_amount: 0,
			route_id: '', 
			driver_id: '' 
		});
		setAddFacilitySubModalOpen(true);
	};

	const handleAddFacilitySubModalClose = () => {
		setAddFacilitySubModalOpen(false);
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value
		}));

		if (name === 'class_id') {
			setFormData(prev => ({
				...prev,
				[name]: value,
				section_id: '',
				academic_year_id: academicYears.find(year => year.status === 'ACTIVE')?.id || ''
			}));
			filterSectionsByClass(value);
			fetchClassFees(value);
		}
	};

	const handleFeeConcessionChange = (index, field, value) => {
		setFormData(prev => {
			const newFees = [...prev.fee_categories_with_concession];
			if (newFees[index]) {
				newFees[index][field] = value;
			}
			return { ...prev, fee_categories_with_concession: newFees };
		});
	};

	const handleNewFacilityChange = (e) => {
		// Fix for TypeError: Cannot destructure property 'name' of 'e.target' as it is undefined.
		// Ensure 'e' is always the event object for TextField onChange.
		const { name, value } = e.target; 
		setNewFacilityForm(prev => ({
			...prev,
			[name]: value
		}));
	};

	useEffect(() => {
		if (classFees.length > 0) {
			setFormData(prev => ({
				...prev,
				fee_categories_with_concession: classFees.map(fee => ({
					start_date: new Date().toISOString().split('T')[0],
					end_date: '',
					fee_category_id: fee.fee_category_id,
					concession_type_id: '',
					concession_amount: 0
				}))
			}));
		} else {
			setFormData(prev => ({
				...prev,
				fee_categories_with_concession: []
			}));
		}
	}, [classFees]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			const studentData = {
				name: formData.name.trim(),
				roll_number: formData.roll_number.trim(),
				date_of_birth: formData.date_of_birth,
				gender: formData.gender,
				email: formData.email.trim(),
				phone_number: formData.phone_number.trim(),
				address: formData.address.trim(),
				class_id: formData.class_id,
				academic_year_id: formData.academic_year_id,
				section_id: formData.section_id,
				medical_history: formData.medical_history.trim(),
				emergency_contact_number: formData.emergency_contact_number.trim(),
				old_school_name: formData.old_school_name.trim()
			};

			if (selectedStudent) {
				await axiosInstance.put(`${appConfig.API_PREFIX_V1}/students-managements/students/${selectedStudent.id}`, studentData);
				setAlert({ open: true, message: 'Student updated successfully!', severity: 'success' });
			} else {
				await axiosInstance.post(`${appConfig.API_PREFIX_V1}/students-managements/students/`, studentData);
				setAlert({ open: true, message: 'Student added successfully!', severity: 'success' });
			}

			handleAddEditModalClose();
			fetchStudents(filterStatus, filterAcademicYear);
		} catch (error) {
			handleApiError(error, setAlert);
		}
	};

	const handleAdmitStudentSubmit = async (e) => {
		e.preventDefault();
		try {
			const admitData = {
				name: formData.name.trim(),
				roll_number: formData.roll_number.trim(),
				date_of_birth: formData.date_of_birth,
				gender: formData.gender,
				email: formData.email.trim(),
				phone_number: formData.phone_number.trim(),
				address: formData.address.trim(),
				class_id: formData.class_id,
				academic_year_id: formData.academic_year_id,
				section_id: formData.section_id,
				medical_history: formData.medical_history.trim(),
				emergency_contact_number: formData.emergency_contact_number.trim(),
				old_school_name: formData.old_school_name.trim(),
				enrollment_date: formData.enrollment_date,
				parents: formData.parents, // <-- send parents array
				fee_categories_with_concession: formData.fee_categories_with_concession.map(fee => ({
					start_date: fee.start_date,
					end_date: fee.end_date || null,
					fee_category_id: fee.fee_category_id,
					concession_type_id: fee.concession_type_id || null,
					concession_amount: parseFloat(fee.concession_amount) || 0
				}))
			};

			await axiosInstance.post(`${appConfig.API_PREFIX_V1}/students-managements/students/admit`, admitData);
			setAlert({ open: true, message: 'Student admitted successfully!', severity: 'success' });

			handleAdmitModalClose();
			fetchStudents(filterStatus, filterAcademicYear);
		} catch (error) {
			handleApiError(error, setAlert);
		}
	};

	const handleAddFacility = async (e) => {
		e.preventDefault();
		// Use viewedStudent for context in the new tab structure
		if (!viewedStudent) return; 

		const selectedOptionalFee = optionalFeesForSelectedClass.find(f => f.id === newFacilityForm.fee_category_id);
		if (!selectedOptionalFee) {
			setAlert({ open: true, message: 'Please select a facility.', severity: 'error' });
			return;
		}
		const feeCategory = feeCategories.find(cat => cat.id === selectedOptionalFee?.fee_category_id);

		try {
			if (feeCategory?.category_name === 'TRANSPORT') {
				const transportAssignmentData = {
					student_id: viewedStudent.id, // Use viewedStudent.id
					route_id: newFacilityForm.route_id,
					driver_id: newFacilityForm.driver_id,
					fee_categories_with_concession: {
						start_date: newFacilityForm.start_date,
						end_date: newFacilityForm.end_date || null,
						fee_category_id: selectedOptionalFee.fee_category_id,
						concession_type_id: newFacilityForm.concession_type_id || null,
						concession_amount: parseFloat(newFacilityForm.concession_amount) || 0
					}
				};
				await axiosInstance.post(`${appConfig.API_PREFIX_V1}/students-managements/students-facility/${viewedStudent.id}/transport-assignment`, transportAssignmentData);
			} else {
				const facilityData = {
					student_id: viewedStudent.id, // Use viewedStudent.id
					fee_categories_with_concession: [{
						start_date: newFacilityForm.start_date,
						end_date: newFacilityForm.end_date || null,
						fee_category_id: selectedOptionalFee.fee_category_id,
						concession_type_id: newFacilityForm.concession_type_id || null,
						concession_amount: parseFloat(newFacilityForm.concession_amount) || 0
					}]
				};
				await axiosInstance.post(`${appConfig.API_PREFIX_V1}/students-managements/students-facility/${viewedStudent.id}/facilities`, facilityData);
			}

			setAlert({ open: true, message: 'Facility added successfully!', severity: 'success' });
			fetchStudentFacilities(viewedStudent.id); // Refresh facilities list for the viewed student
			fetchStudentFixedFees(viewedStudent.id); // Refresh fixed fees for the viewed student
			handleAddFacilitySubModalClose(); 
		} catch (error) {
			handleApiError(error, setAlert);
		}
	};


	const handleDeleteFacility = async (facilityId) => {
		// Use viewedStudent for context in the new tab structure
		if (!viewedStudent) return; 

		if (window.confirm('Are you sure you want to remove this facility?')) {
			try {
				await axiosInstance.delete(`${appConfig.API_PREFIX_V1}/students-managements/students-facility/${viewedStudent.id}/facilities/${facilityId}`);
				setAlert({ open: true, message: 'Facility removed successfully!', severity: 'success' });
				fetchStudentFacilities(viewedStudent.id); // Refresh facilities list
				fetchStudentFixedFees(viewedStudent.id); // Refresh fixed fees list
			} catch (error) {
				handleApiError(error, setAlert);
			}
		}
	};

	const handleDelete = async (id) => {
		if (window.confirm('Are you sure you want to delete this student?')) {
			try {
				await axiosInstance.delete(`${appConfig.API_PREFIX_V1}/students-managements/students/${id}`);
				setAlert({ open: true, message: 'Student deleted successfully!', severity: 'success' });
				fetchStudents(filterStatus, filterAcademicYear);
			}
			catch (error) {
				handleApiError(error, setAlert);
			}
		}
	};

	const handleStatusChange = async (id, currentStatus) => {
		const newStatus = currentStatus === 'ACTIVE' ? 'DROPPED_OUT' : 'ACTIVE';
		const action = currentStatus === 'ACTIVE' ? 'dropped out' : 'activated';
		try {
			await axiosInstance.put(`${appConfig.API_PREFIX_V1}/students-managements/students/${id}`, { status: newStatus });
			setAlert({ open: true, message: `Student ${action} successfully!`, severity: 'success' });
			fetchStudents(filterStatus, filterAcademicYear);
		} catch (error) {
			handleApiError(error, setAlert);
		}
	};

	const filteredStudents = students.filter(student => {
		const className = classes.find(c => c.id === student.class_id)?.class_name || '';
		const sectionName = sections.find(s => s.id === student.section_id)?.name || '';
		const academicYearName = academicYears.find(ay => ay.id === student.academic_year_id)?.year_name || '';

		const searchString = (
			student.name +
			student.roll_number +
			student.email +
			student.phone_number +
			student.address +
			className +
			sectionName +
			academicYearName +
			student.medical_history +
			student.emergency_contact_number +
			student.old_school_name
		).toLowerCase();
		return searchString.includes(searchTerm.toLowerCase());
	});

	const filteredStudentsByCategory = studentsByCategory.filter(item => {
		const student = item.student_details;
		const searchString = (
			student.name +
			student.roll_number
		).toLowerCase(); 
		return searchString.includes(searchTermCategory.toLowerCase());
	});


	const columns = [
		{ field: 'name', headerName: 'Name', width: 160 },
		{ field: 'roll_number', headerName: 'Roll No', width: 100 },
		{ field: 'phone_number', headerName: 'Contact', width: 120 },
		{ field: 'email', headerName: 'Email', width: 200 },
		{
			field: 'class_name',
			headerName: 'Class',
			width: 100,
			valueGetter: (params) => {
				const cls = classes.find(c => c.id === params.row.class_id);
				return cls ? cls.class_name : '';
			}
		},
		{
			field: 'section_name',
			headerName: 'Section',
			width: 90,
			valueGetter: (params) => {
				const section = sections.find(s => s.id === params.row.section_id);
				return section ? section.name : '';
			}
		},
		{
			field: 'actions',
			headerName: 'Actions',
			width: 250, 
			renderCell: (params) => (
				<Box sx={{ display: 'flex', gap: 0.5 }}>
					<Tooltip title="View Details">
						<IconButton
							color="primary"
							size="small"
							onClick={() => handleViewStudentDetails(params.row)} // Changed to new handler
						>
							<VisibilityIcon fontSize="small" />
						</IconButton>
					</Tooltip>
					<Tooltip title="View Attendance">
						<IconButton
							color="secondary"
							size="small"
							onClick={() => handleViewStudentAttendance(params.row)}
						>
							<CalendarTodayIcon fontSize="small" />
						</IconButton>
					</Tooltip>
					<Tooltip title="Edit Student">
						<IconButton
							color="primary"
							size="small"
							onClick={() => handleAddEditModalOpen(params.row)}
						>
							<EditIcon fontSize="small" />
						</IconButton>
					</Tooltip>
					<Tooltip title={params.row.status === 'ACTIVE' ? 'Dropout Student' : 'Activate Student'}>
						<IconButton
							color={params.row.status === 'ACTIVE' ? 'warning' : 'success'}
							size="small"
							onClick={() => handleStatusChange(params.row.id, params.row.status)}
						>
							{params.row.status === 'ACTIVE' ? <ArchiveIcon fontSize="small" /> : <UnarchiveIcon fontSize="small" />}
						</IconButton>
					</Tooltip>
					<Tooltip title="Delete Student">
						<IconButton
							color="error"
							size="small"
							onClick={() => handleDelete(params.row.id)}
						>
							<DeleteIcon fontSize="small" />
						</IconButton>
					</Tooltip>
				</Box>
			),
		},
	];

	const columnsByCategory = [
		{ field: 'name', headerName: 'Name', width: 150, valueGetter: (params) => params.row.student_details.name },
		{ field: 'roll_number', headerName: 'Roll No', width: 100, valueGetter: (params) => params.row.student_details.roll_number },
		{
			field: 'class_name',
			headerName: 'Class',
			width: 90,
			valueGetter: (params) => {
				const cls = classes.find(c => c.id === params.row.student_details.class_id);
				return cls ? cls.class_name : '';
			}
		},
		{
			field: 'section_name',
			headerName: 'Section',
			width: 90,
			valueGetter: (params) => {
				const section = sections.find(s => s.id === params.row.student_details.section_id);
				return section ? section.name : '';
			}
		},
		{
			field: 'start_date',
			headerName: 'Start Date',
			width: 120,
			valueGetter: (params) => {
				const facility = params.row.facilities.find(f => f.fee_category_id === selectedFeeCategory);
				return facility ? new Date(facility.start_date).toLocaleDateString() : 'N/A';
			},
		},
		{
			field: 'end_date',
			headerName: 'End Date',
			width: 120,
			valueGetter: (params) => {
				const facility = params.row.facilities.find(f => f.fee_category_id === selectedFeeCategory);
				return facility && facility.end_date ? new Date(facility.end_date).toLocaleDateString() : 'N/A';
			},
		},
		{
			field: 'actions',
			headerName: 'Actions',
			width: 150,
			renderCell: (params) => (
				<Box sx={{ display: 'flex', gap: 0.5 }}>
					<Tooltip title="View Details">
						<IconButton
							color="primary"
							size="small"
							onClick={() => handleViewStudentDetails(params.row.student_details)} // Changed to new handler
						>
							<VisibilityIcon fontSize="small" />
						</IconButton>
					</Tooltip>
					<Tooltip title="View Attendance">
						<IconButton
							color="secondary"
							size="small"
							onClick={() => handleViewStudentAttendance(params.row.student_details)}
						>
							<CalendarTodayIcon fontSize="small" />
						</IconButton>
					</Tooltip>
				</Box>
			),
		},
	];

	// Columns for the Fixed Fees table in the student details tab
	const fixedFeesColumns = [
		{ field: 'fee_category_name', headerName: 'Fee Category', width: 150, valueGetter: (params) => params.row.fee_category.category_name },
		{ field: 'fee_description', headerName: 'Fee Name (Description)', width: 250, valueGetter: (params) => params.row.fee.description },
		{ field: 'concession_amount', headerName: 'Concession Amt', width: 130, 
			valueFormatter: (params) => `₹${parseFloat(params.value).toLocaleString('en-IN', {minimumFractionDigits: 2})}`
		},
		{ field: 'actual_amount', headerName: 'Actual Amount', width: 120, 
			valueGetter: (params) => params.row.amount - params.row.concession_amount, // Calculate actual amount
			valueFormatter: (params) => `₹${parseFloat(params.value).toLocaleString('en-IN', {minimumFractionDigits: 2})}`
		},
		{ field: 'created_at', headerName: 'Created At', width: 150, 
			valueFormatter: (params) => new Date(params.value).toLocaleDateString('en-IN') 
		},
		{ field: 'status', headerName: 'Status', width: 100 },
	];

	// Columns for the Facilities table in the student details tab
	const facilityColumns = [
		{ field: 'fee_category_name', headerName: 'Facility Type', width: 150, valueGetter: (params) => params.row.fee_category.category_name },
		{ field: 'start_date', headerName: 'Start Date', width: 120, valueFormatter: (params) => new Date(params.value).toLocaleDateString('en-IN') },
		{ field: 'end_date', headerName: 'End Date', width: 120, valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString('en-IN') : 'N/A' },
		{ field: 'concession_amount', headerName: 'Concession Amt', width: 130, 
			valueFormatter: (params) => `₹${parseFloat(params.value || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}` 
		},
		{ field: 'amount', headerName: 'Fee Amount', width: 100, 
			valueGetter: (params) => {
				// The API response for facilities has 'amount' directly on the facility object.
				return params.row.amount || 'N/A'; 
			},
			valueFormatter: (params) => params.value !== 'N/A' ? `₹${parseFloat(params.value).toLocaleString('en-IN', {minimumFractionDigits: 2})}` : 'N/A'
		},
		{ field: 'status', headerName: 'Status', width: 100, valueGetter: (params) => params.row.status || 'N/A' }, 
		{ field: 'created_at', headerName: 'Created At', width: 150, valueFormatter: (params) => new Date(params.value).toLocaleDateString('en-IN') },
		{
			field: 'actions',
			headerName: 'Actions',
			width: 100,
			renderCell: (params) => (
				<IconButton color="error" onClick={() => handleDeleteFacility(params.row.id)}>
					<DeleteIcon />
				</IconButton>
			),
		},
	];


	const getFeeCategoryName = (feeCategoryId) => {
		return feeCategories.find(cat => cat.id === feeCategoryId)?.category_name || 'N/A';
	};

	const getConcessionTypeName = (concessionTypeId) => {
		return concessionTypes.find(type => type.id === concessionTypeId)?.concession_name || 'N/A';
	};

	const getRouteDetails = (routeId, driverId) => {
		const route = routes.find(r => r.id === routeId);
		const driver = drivers.find(d => d.id === driverId);
		return {
			routeName: route?.route_name || 'N/A',
			driverName: driver?.driver_name || 'N/A'
		};
	};

	const isNewFacilityTransport = (() => {
		const selectedFee = optionalFeesForSelectedClass.find(f => f.id === newFacilityForm.fee_category_id);
		if (!selectedFee) return false;
		const feeCategory = feeCategories.find(cat => cat.id === selectedFee.fee_category_id);
		return feeCategory?.category_name === 'TRANSPORT';
	})();

	const isSelectedCategoryTransport = (() => {
		const selectedCategoryDetails = feeCategories.find(cat => cat.id === selectedFeeCategory);
		return selectedCategoryDetails?.category_name === 'TRANSPORT';
	})();


	// Add these lines after your useState for formData:
	const [parentForm, setParentForm] = useState({
		name: '',
		phone_number: '',
		email: '',
		relation: '',
	});
	const [parentEditIndex, setParentEditIndex] = useState(null);

	const handleParentInputChange = (e) => {
		const { name, value } = e.target;
		setParentForm(prev => ({ ...prev, [name]: value }));
	};

	const handleAddParent = () => {
		if (!parentForm.name || !parentForm.relation) return;
		setFormData(prev => ({
			...prev,
			parents: [...prev.parents, parentForm]
		}));
		setParentForm({ name: '', phone_number: '', email: '', relation: '' });
		setParentEditIndex(null);
	};

	const handleEditParent = (idx) => {
		setParentForm(formData.parents[idx]);
		setParentEditIndex(idx);
	};

	const handleUpdateParent = () => {
		if (parentEditIndex === null) return;
		setFormData(prev => {
			const updated = [...prev.parents];
			updated[parentEditIndex] = parentForm;
			return { ...prev, parents: updated };
		});
		setParentForm({ name: '', phone_number: '', email: '', relation: '' });
		setParentEditIndex(null);
	};

	const handleRemoveParent = (idx) => {
		setFormData(prev => ({
			...prev,
			parents: prev.parents.filter((_, i) => i !== idx)
		}));
		setParentForm({ name: '', phone_number: '', email: '', relation: '' });
		setParentEditIndex(null);
	};


	// Download Student Manager handler
	const handleDownloadStudentManager = async () => {
		try {
			setLoading(true);
			const response = await axiosInstance.get(
				`${appConfig.API_PREFIX_V1}/students-managements/students/all-student-parent-fee-list`
			);
			// Always default to empty array if undefined
			let students = Array.isArray(response.data.students) ? response.data.students : [];
			let parents = Array.isArray(response.data.parents) ? response.data.parents : [];
			let fees = Array.isArray(response.data.fees) ? response.data.fees : [];

			// Remove 'id' from students
			students = students.map(({ id, ...rest }) => ({ ...rest }));

			// Remove 'parent_id' and 'student_id' from parents
			parents = parents.map(({ parent_id, student_id, ...rest }) => ({ ...rest }));

			// Remove 'student_id' from fees
			fees = fees.map(({ student_id, ...rest }) => ({ ...rest }));

			// Prepare workbook with three sheets
			const wb = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(students), 'students');
			XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(parents), 'parents');
			XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(fees), 'fees');

			// Write workbook to binary and trigger download
			const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
			const blob = new Blob([wbout], { type: 'application/octet-stream' });
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'student_manager_export.xlsx';
			document.body.appendChild(a);
			a.click();
			a.remove();
			window.URL.revokeObjectURL(url);

			setAlert({ open: true, message: 'Download started!', severity: 'success' });
		} catch (error) {
			handleApiError(error, setAlert);
		} finally {
			setLoading(false);
		}
	};

	// Upload Student Manager handler
	const handleUploadStudentManager = async (event) => {
		const file = event.target.files[0];
		if (!file) return;
		setUploading(true);
		try {
			// Prepare FormData for file upload
			const formData = new FormData();
			formData.append('file', file);

			// Send file directly to backend API
			await axiosInstance.post(
				`${appConfig.API_PREFIX_V1}/students-managements/students/bulk-admit-int-id-file`,
				formData,
				{
					headers: {
						'Content-Type': 'multipart/form-data'
					}
				}
			);
			setAlert({ open: true, message: 'Bulk student upload successful!', severity: 'success' });
			fetchStudents(filterStatus, filterAcademicYear);
		} catch (error) {
			handleApiError(error, setAlert);
		} finally {
			setUploading(false);
			event.target.value = '';
		}
	};

	return (
		<Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
			{/* Statistics Cards - Only show for "All Students" and "Students by Category" tabs */}
			{tabValue !== 2 && (
				<Grid container spacing={3} sx={{ mb: 4 }}>
					<Grid item xs={12} sm={6} md={4}> 
						<Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
							<CardContent>
								<Box display="flex" alignItems="center" mb={1}>
									<PeopleIcon sx={{ mr: 1 }} />
									<Typography variant="h6" gutterBottom>
										Total Students
									</Typography>
								</Box>
								<Typography variant="h3">
									{stats.totalStudents}
								</Typography>
							</CardContent>
						</Card>
					</Grid>
					<Grid item xs={12} sm={6} md={4}> 
						<Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
							<CardContent>
								<Box display="flex" alignItems="center" mb={1}>
									<SchoolIcon sx={{ mr: 1 }} />
									<Typography variant="h6" gutterBottom>
										Total Classes
									</Typography>
								</Box>
								<Typography variant="h3">
									{stats.totalClasses}
								</Typography>
							</CardContent>
						</Card>
					</Grid>
					<Grid item xs={12} sm={6} md={4}> 
						<Card sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
							<CardContent>
								<Box display="flex" alignItems="center" mb={1}>
									<ViewWeekIcon sx={{ mr: 1 }} />
									<Typography variant="h6" gutterBottom>
										Total Sections
									</Typography>
								</Box>
								<Typography variant="h3">
									{stats.totalSections}
								</Typography>
							</CardContent>
						</Card>
					</Grid>
				</Grid>
			)}

			{/* Main Tabs */}
			<Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
				<Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} aria-label="student management tabs">
					<Tab label="All Students" />
					<Tab label="Students by Category" />
					<Tab label="Student Details" disabled={!viewedStudent} />
				</Tabs>
			</Box>

			{/* Content for "All Students" Tab */}
			{tabValue === 0 && (
				<>
					{/* Actions Bar and Filters */}
					<Paper sx={{ p: 2, mb: 3 }}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs>
								<Typography variant="h5">All Students</Typography>
							</Grid>
							<Grid item>
								<Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
									<TextField
										size="small"
										placeholder="Search students..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
									/>
									{/* Added Academic Year and Status filters outside the table for better UX */}
									<FormControl size="small" sx={{ minWidth: 120 }}>
										<InputLabel id="filter-status-label">Status</InputLabel>
										<Select
											labelId="filter-status-label"
											value={filterStatus}
											label="Status"
											onChange={(e) => setFilterStatus(e.target.value)}
										>
											<MenuItem value="ACTIVE">Active</MenuItem>
											<MenuItem value="DROPPED_OUT">Dropped Out</MenuItem>
										</Select>
									</FormControl>
									<FormControl size="small" sx={{ minWidth: 150 }}>
										<InputLabel id="filter-academic-year-label">Academic Year</InputLabel>
										<Select
											labelId="filter-academic-year-label"
											value={filterAcademicYear}
											label="Academic Year"
											onChange={(e) => setFilterAcademicYear(e.target.value)}
										>
											<MenuItem value=""><em>All Years</em></MenuItem>
											{academicYears.map((year) => (
												<MenuItem key={year.id} value={year.id}>
													{year.year_name}
												</MenuItem>
											))}
										</Select>
									</FormControl>
									<Button
										variant="contained"
										color="secondary"
										onClick={handleAdmitModalOpen}
										startIcon={<AddCircleOutlineIcon />}
									>
										Admit Student
									</Button>
									<Button
										variant="contained"
										onClick={() => handleAddEditModalOpen()}
									>
										Add Student (Generic)
									</Button>
								</Box>
							</Grid>
						</Grid>
					</Paper>

					{/* Download & Upload Student Manager Buttons */}
					<Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 2 }}>
						<Button
							variant="outlined"
							color="primary"
							onClick={handleDownloadStudentManager}
						>
							Download Student Manager
						</Button>
						<Button
							variant="outlined"
							color="secondary"
							component="label"
							disabled={uploading}
						>
							Upload Student Manager
							<input
								type="file"
								accept=".xlsx"
								hidden
								onChange={handleUploadStudentManager}
							/>
						</Button>
					</Box>

					{/* Data Grid */}
					<Paper sx={{ height: 600, width: '100%' }}>
						<DataGrid
							rows={filteredStudents}
							columns={columns}
							pageSize={10}
							rowsPerPageOptions={[10, 20, 50]}
							disableSelectionOnClick
							loading={loading}
							getRowId={(row) => row.id}
							sx={{
								'& .MuiDataGrid-row:hover': {
									backgroundColor: 'action.hover'
								}
							}}
						/>
					</Paper>
				</>
			)}

			{/* Content for "Students by Category" Tab */}
			{tabValue === 1 && (
				<>
					<Paper sx={{ p: 2, mb: 3 }}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} sm={4}>
								<Typography variant="h5">Students by Fee Category</Typography>
							</Grid>
							<Grid item xs={12} sm={8}>
								<Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
									<TextField
										size="small"
										placeholder="Search by student name..."
										value={searchTermCategory}
										onChange={(e) => setSearchTermCategory(e.target.value)}
										sx={{ flexGrow: 1 }}
									/>
									<FormControl size="small" sx={{ minWidth: 200 }}>
										<InputLabel id="fee-category-filter-label">Select Fee Category</InputLabel>
										<Select
											labelId="fee-category-filter-label"
											value={selectedFeeCategory}
											label="Select Fee Category"
											onChange={(e) => {
												setSelectedFeeCategory(e.target.value);
												setFilterRoute(''); 
												setFilterDriver(''); 
											}}
										>
											{feeCategories.map((category) => (
												<MenuItem key={category.id} value={category.id}>
													{category.category_name}
												</MenuItem>
											))}
										</Select>
									</FormControl>

									{/* New: Transport specific filters */}
									{isSelectedCategoryTransport && (
										<>
											<FormControl size="small" sx={{ minWidth: 150 }}>
												<InputLabel id="transport-route-filter-label">Route</InputLabel>
												<Select
													labelId="transport-route-filter-label"
													value={filterRoute}
													label="Route"
													onChange={(e) => setFilterRoute(e.target.value)}
												>
													<MenuItem value=""><em>All Routes</em></MenuItem>
													{routes.map((route) => (
														<MenuItem key={route.id} value={route.id}>
															{route.route_name}
														</MenuItem>
													))}
												</Select>
											</FormControl>
											<FormControl size="small" sx={{ minWidth: 150 }}>
												<InputLabel id="transport-driver-filter-label">Driver</InputLabel>
												<Select
													labelId="transport-driver-filter-label"
													value={filterDriver}
													label="Driver"
													onChange={(e) => setFilterDriver(e.target.value)}
												>
													<MenuItem value=""><em>None</em></MenuItem>
													{drivers.map((driver) => (
														<MenuItem key={driver.id} value={driver.id}>
															{driver.driver_name}
														</MenuItem>
													))}
												</Select>
											</FormControl>
										</>
									)}
								</Box>
							</Grid>
						</Grid>
					</Paper>

					<Paper sx={{ height: 600, width: '100%' }}>
						<DataGrid
							rows={filteredStudentsByCategory}
							columns={columnsByCategory}
							pageSize={10}
							rowsPerPageOptions={[10, 20, 50]}
							disableSelectionOnClick
							loading={loading}
							getRowId={(row) => row.student_details.id} 
							sx={{
								'& .MuiDataGrid-row:hover': {
									backgroundColor: 'action.hover'
								}
							}}
						/>
					</Paper>
				</>
			)}

			{/* New: Content for "Student Details" Tab */}
			{tabValue === 2 && viewedStudent && (
				<StudentDetails 
					student={viewedStudent}
					onBack={() => setTabValue(0)}
					onEdit={handleAddEditModalOpen}
				/>
			)}
			{!viewedStudent && tabValue === 2 && (
				<Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
					<Typography variant="h6" color="textSecondary">
						Please select a student from "All Students" or "Students by Category" tab to view their details.
					</Typography>
				</Paper>
			)}


			{/* Dialog for Add/Edit Student (Generic) */}
			<Dialog open={addEditModalOpen} onClose={handleAddEditModalClose} maxWidth="md" fullWidth>
				<DialogTitle>
					{selectedStudent ? 'Edit Student' : 'Add Student (Generic)'}
					<IconButton
						onClick={handleAddEditModalClose}
						sx={{ position: 'absolute', right: 8, top: 8 }}
					>
						<CloseIcon />
					</IconButton>
				</DialogTitle>
				<form onSubmit={handleSubmit}>
					<DialogContent dividers>
						<Grid container spacing={2}>
							<Grid item xs={12} sm={6}>
								<TextField fullWidth label="Name" name="name" value={formData.name} onChange={handleInputChange} required />
							</Grid>
							<Grid item xs={12} sm={6}>
								<TextField fullWidth label="Roll Number" name="roll_number" value={formData.roll_number} onChange={handleInputChange} required />
							</Grid>
							<Grid item xs={12} sm={6}>
								<TextField fullWidth label="Date of Birth" name="date_of_birth" type="date" value={formData.date_of_birth} onChange={handleInputChange} required InputLabelProps={{ shrink: true }} />
							</Grid>
							<Grid item xs={12} sm={6}>
								<FormControl fullWidth required>
									<InputLabel id="gender-label">Gender</InputLabel>
									<Select labelId="gender-label" name="gender" value={formData.gender} onChange={handleInputChange} label="Gender">
										<MenuItem value=""><em>None</em></MenuItem>
										<MenuItem value="MALE">Male</MenuItem>
										<MenuItem value="FEMALE">Female</MenuItem>
										<MenuItem value="OTHER">Other</MenuItem>
									</Select>
								</FormControl>
							</Grid>
							<Grid item xs={12} sm={6}>
								<TextField fullWidth label="Email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
							</Grid>
							<Grid item xs={12} sm={6}>
								<TextField fullWidth label="Phone Number" name="phone_number" value={formData.phone_number} onChange={handleInputChange} required />
							</Grid>
							<Grid item xs={12}>
								<TextField fullWidth label="Address" name="address" value={formData.address} onChange={handleInputChange} multiline rows={2} required />
							</Grid>
							<Grid item xs={12} sm={6}>
								<TextField fullWidth label="Medical History" name="medical_history" value={formData.medical_history} onChange={handleInputChange} multiline rows={1} />
							</Grid>
							<Grid item xs={12} sm={6}>
								<TextField fullWidth label="Emergency Contact Number" name="emergency_contact_number" value={formData.emergency_contact_number} onChange={handleInputChange} />
							</Grid>
							<Grid item xs={12}>
								<TextField fullWidth label="Old School Name" name="old_school_name" value={formData.old_school_name} onChange={handleInputChange} />
							</Grid>
							<Grid item xs={12} sm={6}>
								<TextField fullWidth label="Enrollment Date" name="enrollment_date" type="date" value={formData.enrollment_date} onChange={handleInputChange} required InputLabelProps={{ shrink: true }} />
							</Grid>
							<Grid item xs={12} sm={6}>
								<FormControl fullWidth required>
									<InputLabel id="academic-year-label">Academic Year</InputLabel>
									<Select labelId="academic-year-label" name="academic_year_id" value={formData.academic_year_id} onChange={handleInputChange} label="Academic Year">
										{academicYears.map((year) => (
											<MenuItem key={year.id} value={year.id}>
												{year.year_name}
											</MenuItem>
										))}
									</Select>
								</FormControl>
							</Grid>
							<Grid item xs={12} sm={6}>
								<FormControl fullWidth required>
									<InputLabel id="class-label">Class</InputLabel>
									<Select labelId="class-label" name="class_id" value={formData.class_id} onChange={handleInputChange} label="Class">
										{classes.map((cls) => (
											<MenuItem key={cls.id} value={cls.id}>
												{cls.class_name}
											</MenuItem>
										))}
										{classes.map((cls) => (
											<MenuItem key={cls.id} value={cls.id}>
												{cls.class_name}
											</MenuItem>
										))}
									</Select>
								</FormControl>
							</Grid>
							<Grid item xs={12} sm={6}>
								<FormControl fullWidth required>
									<InputLabel id="section-label">Section</InputLabel>
									<Select labelId="section-label" name="section_id" value={formData.section_id} onChange={handleInputChange} label="Section" disabled={!formData.class_id || filteredSectionsForDropdown.length === 0}>
										<MenuItem value="">
											{formData.class_id ? 'Select a section' : 'Select a class first'}
										</MenuItem>
										{filteredSectionsForDropdown.map((section) => (
											<MenuItem key={section.id} value={section.id}>
												{section.name}
											</MenuItem>
										))}
									</Select>
								</FormControl>
							</Grid>
						</Grid>
					</DialogContent>
					<DialogActions>
						<Button onClick={handleAddEditModalClose}>Cancel</Button>
						<Button type="submit" variant="contained" color="primary">
							{selectedStudent ? 'Update' : 'Add'} Student
						</Button>
					</DialogActions>
				</form>
			</Dialog>

			{/* Dialog for Admit Student */}
			<Dialog open={admitModalOpen} onClose={handleAdmitModalClose} maxWidth="lg" fullWidth>
				<DialogTitle>
					Admit Student
					<IconButton
						onClick={handleAdmitModalClose}
						sx={{ position: 'absolute', right: 8, top: 8 }}
					>
						<CloseIcon />
					</IconButton>
				</DialogTitle>
				<form onSubmit={handleAdmitStudentSubmit}>
					<DialogContent dividers>
						<Typography variant="h6" gutterBottom>Personal Details</Typography>
						<Grid container spacing={2}>
							<Grid item xs={12} sm={6}>
								<TextField fullWidth label="Name" name="name" value={formData.name} onChange={handleInputChange} required />
							</Grid>
							<Grid item xs={12} sm={6}>
								<TextField fullWidth label="Roll Number" name="roll_number" value={formData.roll_number} onChange={handleInputChange} required />
							</Grid>
							<Grid item xs={12} sm={6}>
								<TextField fullWidth label="Date of Birth" name="date_of_birth" type="date" value={formData.date_of_birth} onChange={handleInputChange} required InputLabelProps={{ shrink: true }} />
							</Grid>
							<Grid item xs={12} sm={6}>
								<FormControl fullWidth required>
									<InputLabel id="gender-admit-label">Gender</InputLabel>
									<Select labelId="gender-admit-label" name="gender" value={formData.gender} onChange={handleInputChange} label="Gender">
										<MenuItem value=""><em>None</em></MenuItem>
										<MenuItem value="MALE">Male</MenuItem>
										<MenuItem value="FEMALE">Female</MenuItem>
										<MenuItem value="OTHER">Other</MenuItem>
									</Select>
								</FormControl>
							</Grid>
							<Grid item xs={12} sm={6}>
								<TextField fullWidth label="Email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
							</Grid>
							<Grid item xs={12} sm={6}>
								<TextField fullWidth label="Phone Number" name="phone_number" value={formData.phone_number} onChange={handleInputChange} required />
							</Grid>
							<Grid item xs={12}>
								<TextField fullWidth label="Address" name="address" value={formData.address} onChange={handleInputChange} multiline rows={2} required />
							</Grid>
							<Grid item xs={12} sm={6}>
								<TextField fullWidth label="Medical History" name="medical_history" value={formData.medical_history} onChange={handleInputChange} multiline rows={1} />
							</Grid>
							<Grid item xs={12} sm={6}>
								<TextField fullWidth label="Emergency Contact Number" name="emergency_contact_number" value={formData.emergency_contact_number} onChange={handleInputChange} />
							</Grid>
							<Grid item xs={12}>
								<TextField fullWidth label="Old School Name" name="old_school_name" value={formData.old_school_name} onChange={handleInputChange} />
							</Grid>
							<Grid item xs={12} sm={6}>
								<TextField fullWidth label="Enrollment Date" name="enrollment_date" type="date" value={formData.enrollment_date} onChange={handleInputChange} required InputLabelProps={{ shrink: true }} />
							</Grid>
							<Grid item xs={12} sm={6}>
								<FormControl fullWidth required>
									<InputLabel id="academic-year-admit-label">Academic Year</InputLabel>
									<Select labelId="academic-year-admit-label" name="academic_year_id" value={formData.academic_year_id} onChange={handleInputChange} label="Academic Year">
										{academicYears.map((year) => (
											<MenuItem key={year.id} value={year.id}>
												{year.year_name}
											</MenuItem>
										))}
									</Select>
								</FormControl>
							</Grid>
							<Grid item xs={12} sm={6}>
								<FormControl fullWidth required>
									<InputLabel id="class-admit-label">Class</InputLabel>
									<Select labelId="class-admit-label" name="class_id" value={formData.class_id} onChange={handleInputChange} label="Class">
										{classes.map((cls) => (
											<MenuItem key={cls.id} value={cls.id}>
												{cls.class_name}
											</MenuItem>
										))}
									</Select>
								</FormControl>
							</Grid>
							<Grid item xs={12} sm={6}>
								<FormControl fullWidth required>
									<InputLabel id="section-admit-label">Section</InputLabel>
									<Select labelId="section-admit-label" name="section_id" value={formData.section_id} onChange={handleInputChange} label="Section" disabled={!formData.class_id || filteredSectionsForDropdown.length === 0}>
										<MenuItem value="">
											{formData.class_id ? 'Select a section' : 'Select a class first'}
										</MenuItem>
										{filteredSectionsForDropdown.map((section) => (
											<MenuItem key={section.id} value={section.id}>
												{section.name}
											</MenuItem>
										))}
									</Select>
								</FormControl>
							</Grid>
						</Grid>

						{/* Parent List Section */}
						<Box sx={{ mt: 3, mb: 2 }}>
							<Typography variant="h6" gutterBottom>Parents</Typography>
							<Grid container spacing={2} alignItems="center">
								<Grid item xs={12} sm={3}>
									<TextField
										fullWidth
										label="Parent Name"
										name="name"
										value={parentForm.name}
										onChange={handleParentInputChange}
										required
									/>
								</Grid>
								<Grid item xs={12} sm={3}>
									<TextField
										fullWidth
										label="Relation"
										name="relation"
										value={parentForm.relation}
										onChange={handleParentInputChange}
										required
									/>
								</Grid>
								<Grid item xs={12} sm={3}>
									<TextField
										fullWidth
										label="Phone Number"
										name="phone_number"
										value={parentForm.phone_number}
										onChange={handleParentInputChange}
									/>
								</Grid>
								<Grid item xs={12} sm={3}>
									<TextField
										fullWidth
										label="Email"
										name="email"
										value={parentForm.email}
										onChange={handleParentInputChange}
									/>
								</Grid>
								<Grid item xs={12} sm={3}>
									{parentEditIndex === null ? (
										<Button variant="outlined" onClick={handleAddParent} sx={{ mt: { xs: 1, sm: 0 } }}>
											Add Parent
										</Button>
									) : (
										<Button variant="contained" onClick={handleUpdateParent} sx={{ mt: { xs: 1, sm: 0 } }}>
											Update Parent
										</Button>
									)}
								</Grid>
							</Grid>
							{/* List of added parents */}
							{formData.parents.length > 0 && (
								<Box sx={{ mt: 2 }}>
									<Typography variant="subtitle1">Added Parents:</Typography>
									<Grid container spacing={1}>
										{formData.parents.map((parent, idx) => (
											<Grid item xs={12} key={idx}>
												<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
													<Typography>
														{parent.name} ({parent.relation}) {parent.phone_number ? `- ${parent.phone_number}` : ''} {parent.email ? `- ${parent.email}` : ''}
													</Typography>
													<Button size="small" onClick={() => handleEditParent(idx)}>Edit</Button>
													<Button size="small" color="error" onClick={() => handleRemoveParent(idx)}>Remove</Button>
												</Box>
											</Grid>
										))}
									</Grid>
								</Box>
							)}
						</Box>

						{/* Fee Details & Concessions section */}
						{formData.class_id && classFees.length > 0 && (
							<>
								<Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Fee Details & Concessions</Typography>
								{classFees.map((fee, index) => (
									<Paper key={fee.id} sx={{ p: 2, mb: 2, border: '1px solid #e0e0e0' }}>
										<Typography variant="subtitle1" gutterBottom>
											**{getFeeCategoryName(fee.fee_category_id)}** (Amount: ${fee.amount})
										</Typography>
										<Grid container spacing={2}>
											<Grid item xs={12} sm={4}>
												<TextField
													fullWidth
													label="Concession Start Date"
													name="start_date"
													type="date"
													value={formData.fee_categories_with_concession[index]?.start_date || ''}
													onChange={(e) => handleFeeConcessionChange(index, 'start_date', e.target.value)}
													required
													InputLabelProps={{ shrink: true }}
												/>
											</Grid>
											<Grid item xs={12} sm={4}>
												<TextField
													fullWidth
													label="Concession End Date (Optional)"
													name="end_date"
													type="date"
													value={formData.fee_categories_with_concession[index]?.end_date || ''}
													onChange={(e) => handleFeeConcessionChange(index, 'end_date', e.target.value)}
													InputLabelProps={{ shrink: true }}
												/>
											</Grid>
											<Grid item xs={12} sm={4}>
												<FormControl fullWidth>
													<InputLabel id={`concession-type-label-${index}`}>Concession Type (Optional)</InputLabel>
													<Select
														labelId={`concession-type-label-${index}`}
														name="concession_type_id"
														value={formData.fee_categories_with_concession[index]?.concession_type_id || ''}
														onChange={(e) => handleFeeConcessionChange(index, 'concession_type_id', e.target.value)}
														label="Concession Type (Optional)"
													>
														<MenuItem value=""><em>None</em></MenuItem>
														{concessionTypes.map((concession) => (
															<MenuItem key={concession.id} value={concession.id}>
																{concession.concession_name}
															</MenuItem>
														))}
													</Select>
												</FormControl>
											</Grid>
											<Grid item xs={12}>
												<TextField
													fullWidth
													label="Concession Amount (Optional)"
													name="concession_amount"
													type="number"
													value={formData.fee_categories_with_concession[index]?.concession_amount || 0}
													onChange={(e) => handleFeeConcessionChange(index, 'concession_amount', e.target.value)}
													inputProps={{ min: 0, step: "0.01" }}
												/>
											</Grid>
										</Grid>
									</Paper>
								))}
							</>
						)}
						{formData.class_id && classFees.length === 0 && (
							<Typography variant="body1" color="textSecondary" sx={{ mt: 3 }}>
								No non-optional fees found for the selected class.
							</Typography>
						)}
						{!formData.class_id && (
							<Typography variant="body1" color="textSecondary" sx={{ mt: 3 }}>
								Select a class to view associated fees.
							</Typography>
						)}
					</DialogContent>
					<DialogActions>
						<Button onClick={handleAdmitModalClose}>Cancel</Button>
						<Button type="submit" variant="contained" color="primary">
							Admit Student
						</Button>
					</DialogActions>
				</form>
			</Dialog>

			{/* Content for "Student Details" Tab */}
			{tabValue === 2 && viewedStudent && (
				<StudentDetails
					student={viewedStudent}
					onBack={() => {
						setViewedStudent(null);
						setTabValue(0);
					}}
					onEdit={() => handleAddEditModalOpen(viewedStudent)}
				/>
			)}

			{/* New: Sub-Dialog for Adding New Facility (Compact) */}
			<Dialog open={addFacilitySubModalOpen} onClose={handleAddFacilitySubModalClose} maxWidth="sm" fullWidth>
				<DialogTitle>
					Add New Facility for {viewedStudent?.name} {/* Use viewedStudent here */}
					<IconButton
						onClick={handleAddFacilitySubModalClose}
						sx={{ position: 'absolute', right: 8, top: 8 }}
					>
						<CloseIcon />
					</IconButton>
				</DialogTitle>
				<form onSubmit={handleAddFacility}>
					<DialogContent dividers>
						<Grid container spacing={2}>
							<Grid item xs={12}>
								<FormControl fullWidth required>
									<InputLabel id="new-facility-category-label">Select Facility (Optional Fee)</InputLabel>
									<Select
										labelId="new-facility-category-label"
										name="fee_category_id"
										value={newFacilityForm.fee_category_id}
										onChange={handleNewFacilityChange}
										label="Select Facility (Optional Fee)"
									>
										<MenuItem value=""><em>None</em></MenuItem>
										{optionalFeesForSelectedClass.map((fee) => (
											<MenuItem key={fee.id} value={fee.id}>
												{getFeeCategoryName(fee.fee_category_id)} (Amount: ${fee.amount})
											</MenuItem>
										))}
									</Select>
								</FormControl>
							</Grid>
							<Grid item xs={12} sm={6}>
								<TextField
									fullWidth
									label="Start Date"
									name="start_date"
									type="date"
									value={newFacilityForm.start_date}
									onChange={handleNewFacilityChange}
									required
									InputLabelProps={{ shrink: true }}
								/>
							</Grid>
							<Grid item xs={12} sm={6}>
								<TextField
									fullWidth
									label="End Date (Optional)"
									name="end_date"
									type="date"
									value={newFacilityForm.end_date}
									onChange={handleNewFacilityChange}
									InputLabelProps={{ shrink: true }}
								/>
							</Grid>
							<Grid item xs={12} sm={6}>
								<FormControl fullWidth>
									<InputLabel id="new-concession-type-label">Concession Type (Optional)</InputLabel>
									<Select
										labelId="new-concession-type-label"
										name="concession_type_id"
										value={newFacilityForm.concession_type_id}
										onChange={handleNewFacilityChange}
										label="Concession Type (Optional)"
									>
										<MenuItem value=""><em>None</em></MenuItem>
										{concessionTypes.map((concession) => (
											<MenuItem key={concession.id} value={concession.id}>
												{concession.concession_name}
											</MenuItem>
										))}
									</Select>
								</FormControl>
							</Grid>
							<Grid item xs={12} sm={6}>
								<TextField
									fullWidth
									label="Concession Amount (Optional)"
									name="concession_amount"
									type="number"
									value={newFacilityForm.concession_amount}
									onChange={handleNewFacilityChange} // Fixed: Pass event object directly
									inputProps={{ min: 0, step: "0.01" }}
								/>
							</Grid>
							{isNewFacilityTransport && (
								<>
									<Grid item xs={12} sm={6}>
										<FormControl fullWidth required>
											<InputLabel id="new-route-label">Transport Route</InputLabel>
											<Select
												labelId="new-route-label"
												name="route_id"
												value={newFacilityForm.route_id}
												onChange={handleNewFacilityChange}
												label="Transport Route"
											>
												<MenuItem value=""><em>None</em></MenuItem>
												{routes.map((route) => (
													<MenuItem key={route.id} value={route.id}>
														{route.route_name}
													</MenuItem>
												))}
											</Select>
										</FormControl>
									</Grid>
									<Grid item xs={12} sm={6}>
										<FormControl fullWidth required>
											<InputLabel id="new-driver-label">Assign Driver</InputLabel>
											<Select
												labelId="new-driver-label"
												name="driver_id"
												value={newFacilityForm.driver_id}
												onChange={handleNewFacilityChange}
												label="Assign Driver"
											>
												<MenuItem value=""><em>None</em></MenuItem>
												{drivers.map((driver) => (
													<MenuItem key={driver.id} value={driver.id}>
														{driver.driver_name}
													</MenuItem>
												))}
											</Select>
										</FormControl>
									</Grid>
								</>
							)}
						</Grid>
					</DialogContent>
					<DialogActions>
						<Button onClick={handleAddFacilitySubModalClose}>Cancel</Button>
						<Button type="submit" variant="contained" color="primary" startIcon={<AddIcon />}>
							Add Facility
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

export default StudentManager;