import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import AdminConsole from './pages/AdminConsole';
import ItineraryPlanner from './pages/ItineraryPlanner';
import './styles/App.css';

function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        setUserRole(userDoc.exists() ? userDoc.data().role : 'user');
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setUserRole(null);
      }
      setAuthChecked(true);
    });
    return unsubscribe;
  }, []);

  const handleLogin = (role) => {
    setIsAuthenticated(true);
    setUserRole(role);
  };

  const handleLogout = () => {
    signOut(auth);
    setIsAuthenticated(false);
    setUserRole(null);
  };

  if (!authChecked) {
    return null;
  }

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
