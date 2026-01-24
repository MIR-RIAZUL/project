import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Home from './components/Home';
import './App.css';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

function App() {
  const { logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
  };

  const handleLoginRedirect = () => {
    window.location.href = '/login';
  };

  return (
    <AuthProvider>
      <Router>
        <div className="App" style={{width: '100vw', maxWidth: '100%', margin: 0, padding: 0}}>
          {/* Booking.com inspired header - Full width */}
          <header className="booking-header" style={{width: '100vw', position: 'sticky', top: 0, zIndex: 1000}}>
            <div className="booking-logo">
              <span className="booking-logo-icon">🏨</span>
              <span>HotelBooking Pro</span>
            </div>
            
            <nav className="booking-header-links">
              <a href="/" className="booking-header-link">Stays</a>
              <a href="#deals" className="booking-header-link">Deals</a>
              <a href="#support" className="booking-header-link">Support</a>
            </nav>
            
            <div className="booking-header-user">
              <button 
                onClick={handleLogout}
                className="btn btn-secondary"
                style={{padding: '8px 15px', fontSize: '13px'}}
              >
                Logout
              </button>
            </div>
          </header>

          <Routes>
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/" 
              element={<Home onLoginRedirect={handleLoginRedirect} />} 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
