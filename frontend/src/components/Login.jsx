import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    user_type: 'user'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://127.0.0.1:5000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        onLogin(data.user, data.token);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Welcome to Hotel Booking System</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="user_type">Login As:</label>
            <select
              name="user_type"
              value={formData.user_type}
              onChange={handleChange}
              className="form-control"
            >
              <option value="user">Guest/User</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="username">
              {formData.user_type === 'admin' ? 'Username' : 'Email'}
            </label>
            <input
              type={formData.user_type === 'admin' ? 'text' : 'email'}
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="login-footer">
          <p>Admin Credentials: admin / admin123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;