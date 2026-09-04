import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import AdminConsole from './pages/AdminConsole';
import ItineraryPlanner from './pages/ItineraryPlanner';
import './styles/App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    setIsAuthenticated(!!token);
    setUserRole(role);
  }, []);

  const handleLogin = (token, role) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userRole', role);
    setIsAuthenticated(true);
    setUserRole(role);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    setIsAuthenticated(false);
    setUserRole(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
        <Route path="/register" element={!isAuthenticated ? <Register onLogin={handleLogin} /> : <Navigate to="/" />} />

        {isAuthenticated && userRole === 'admin' && (
          <>
            <Route path="/admin" element={<AdminConsole onLogout={handleLogout} />} />
            <Route path="/" element={<Navigate to="/admin" />} />
          </>
        )}

        {isAuthenticated && userRole === 'user' && (
          <>
            <Route path="/dashboard" element={<UserDashboard onLogout={handleLogout} />} />
            <Route path="/itinerary/new" element={<ItineraryPlanner onLogout={handleLogout} />} />
            <Route path="/itinerary/:id" element={<ItineraryPlanner onLogout={handleLogout} />} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </>
        )}

        <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/login'} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
