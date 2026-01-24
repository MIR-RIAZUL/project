import React, { useState, useEffect } from 'react';
import './App.css';

// Components
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('home'); // 'home', 'login', 'register', 'user', 'admin'
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false); // Add dark mode state

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
    }
    
    // Check if user is logged in from localStorage
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        // Setting state to restore authentication from localStorage on mount is a legitimate use case
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(parsedUser);
        if (parsedUser.type === 'admin') {
          setCurrentPage('admin');
        } else {
          setCurrentPage('user');
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogin = (userData, token) => {
    if (token === 'REGISTER_MODE') {
      setCurrentPage('register');
      return;
    }
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    if (userData.type === 'admin') {
      setCurrentPage('admin');
    } else {
      setCurrentPage('user');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCurrentPage('home');
  };

  const handleRegister = () => {
    setCurrentPage('login');
  };

  const handleLoginRedirect = () => {
    setCurrentPage('login');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="App">
      {/* Header */}
      <header className="booking-header">
        <div className="booking-logo">
          <span className="booking-logo-icon">🏨</span>
          <span>BookingPro</span>
        </div>
        <div className="booking-header-links">
          <a href="#" className="booking-header-link">List your property</a>
          <a href="#" className="booking-header-link">Support</a>
          <a href="#" className="booking-header-link">Deals</a>
        </div>
        <div className="booking-header-user">
          {user ? (
            <div className="booking-user-info">
              <span className="booking-user-name">Hi, {user.name || user.username}</span>
              <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
            </div>
          ) : (
            <button onClick={() => setCurrentPage('login')} className="btn btn-primary">Sign In</button>
          )}
        </div>
      </header>

      {/* Dark Mode Toggle Button */}
      <button 
        onClick={toggleDarkMode}
        className="theme-toggle"
      >
        {darkMode ? '☀️' : '🌙'}
      </button>
      
      <div className="main-content">
        {currentPage === 'home' && (
          <Home onLoginRedirect={handleLoginRedirect} />
        )}
        {currentPage === 'login' && (
          <Login onLogin={handleLogin} />
        )}
        {currentPage === 'register' && (
          <Register onRegister={handleRegister} />
        )}
        {currentPage === 'user' && user && user.type === 'user' && (
          <UserDashboard user={user} onLogout={handleLogout} />
        )}
        {currentPage === 'admin' && user && user.type === 'admin' && (
          <AdminDashboard user={user} onLogout={handleLogout} />
        )}
      </div>
    </div>
  );
}

export default App;