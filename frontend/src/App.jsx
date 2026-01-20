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
  const [currentPage, setCurrentPage] = useState('login'); // 'home', 'login', 'register', 'user', 'admin'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
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
  }, []);

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
  );
}

export default App;