import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify'; // Import ToastContainer
import 'react-toastify/dist/ReactToastify.css'; // Import Toastify CSS
import GlobalAlert from './components/GlobalAlert';

import Navbar from './components/Navbar';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import StudentDetails from './components/StudentDetails';
import StudentManager from './components/StudentManager';
import ClassManager from './components/ClassManager';
import SectionManager from './components/SectionManager';
import FeeManager from './components/FeeManager';
import AcademicYearManager from './components/AcademicYearManager';
import FeeCategoryManager from './components/FeeCategoryManager';
import ConcessionTypeManager from './components/ConcessionTypeManager';
import ClassFeeManager from './components/ClassFeeManager';
import DriverManager from './components/DriverManager';
import RouteManager from './components/RouteManager';

// New Imports for Staff and Expenditure Management
import StaffManager from './components/StaffManager';
import StaffDetails from './components/StaffDetails';
import ExpenditureManager from './components/ExpenditureManager';
import ExpenditureCategoryManager from './components/ExpenditureCategoryManager';
import UserMapping from './components/UserMapping';
import SubjectManager from './components/SubjectManager';
import RoutineManager from './components/RoutineManager';

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    // Listen for a custom event from api.js when token expires
    const handleTokenExpired = () => {
      setToken(null);
      setAlert({ open: true, message: 'Session expired or unauthorized. Please log in again.', severity: 'error' });
    };
    window.addEventListener('token-expired', handleTokenExpired);
    // Listen for global alert events
    const handleGlobalAlert = (e) => {
      setAlert({ open: true, ...e.detail });
    };
    window.addEventListener('global-alert', handleGlobalAlert);
    return () => {
      window.removeEventListener('token-expired', handleTokenExpired);
      window.removeEventListener('global-alert', handleGlobalAlert);
    };
  }, []);

  const handleLogin = (newToken) => {
    console.log('Login successful, token:', newToken);
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    console.log('Logout successful, token:', token);
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <Router>
      <CssBaseline />
      {/* Add ToastContainer here for notifications */}
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <GlobalAlert open={alert.open} severity={alert.severity} message={alert.message} onClose={() => setAlert(a => ({ ...a, open: false }))} />
      <Routes>
  {/* <Route path="/superuser-login" element={<SuperUserLogin />} /> Removed: Super admin code segregated */}
        {token ? (
          <Route path="/*" element={<AuthenticatedApp onLogout={handleLogout} />} />
        ) : (
          <Route path="/*" element={<UnauthenticatedApp onLogin={handleLogin} />} />
        )}
      </Routes>
    </Router>
  );
};

const AuthenticatedApp = ({ onLogout }) => {
  return (
    <div>
      <Navbar onLogout={onLogout} />
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/students" element={<StudentManager />} />
        <Route path="/academic/:id" element={<StudentDetails />} />
        <Route path="/classes" element={<ClassManager />} />
        <Route path="/subjects" element={<SubjectManager />} />
        <Route path="/routine" element={<RoutineManager />} />
        <Route path="/sections" element={<SectionManager />} />
        <Route path="/fees" element={<FeeManager />} />
        <Route path="/fee-categories" element={<FeeCategoryManager />} />
        <Route path="/finance/concessions" element={<ConcessionTypeManager />} />
        <Route path="/fee-structure" element={<ClassFeeManager />} />
        <Route path="/routes" element={<RouteManager />} />
        <Route path="/drivers" element={<DriverManager />} />
        <Route path="/academic-years" element={<AcademicYearManager />} />
        {/* New Administrative Routes */}
        <Route path="/staff" element={<StaffManager />} />
        <Route path="/staff/:id" element={<StaffDetails />} />
        <Route path="/expenditures" element={<ExpenditureManager />} />
        <Route path="/expenditure-categories" element={<ExpenditureCategoryManager />} />
        <Route path="/user-mapping" element={<UserMapping />} />
        {/* Remove ManagementDashboard from normal user routes */}
        {/* <Route path="/management" element={<ManagementDashboard />} /> */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </div>
  );
}

export default App;