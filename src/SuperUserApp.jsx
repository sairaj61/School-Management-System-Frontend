import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SuperUserLogin from './components/SuperUserLogin';

const SuperUserApp = () => {
  return (
    <Router>
      <Routes>
        <Route path="/superuser-login" element={<SuperUserLogin />} />
        <Route path="*" element={<Navigate to="/superuser-login" />} />
      </Routes>
    </Router>
  );
};

export default SuperUserApp;
