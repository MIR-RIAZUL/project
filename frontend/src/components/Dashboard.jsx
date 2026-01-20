import React, { useState, useEffect } from 'react';

const Dashboard = ({ user, onLogout }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      let endpoint = '';
      
      if (user.type === 'admin') {
        endpoint = 'http://127.0.0.1:5000/admin/dashboard';
      } else {
        endpoint = 'http://127.0.0.1:5000/user/bookings';
      }
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setData(Array.isArray(result) ? result : [result]);
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderAdminDashboard = () => (
    <div className="admin-dashboard">
      <h2>Admin Dashboard</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p>{data[0]?.total_users || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Rooms</h3>
          <p>{data[0]?.total_rooms || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Bookings</h3>
          <p>{data[0]?.total_bookings || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Pending Bookings</h3>
          <p>{data[0]?.pending_bookings || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Confirmed Bookings</h3>
          <p>{data[0]?.confirmed_bookings || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Revenue</h3>
          <p>${data[0]?.total_revenue || 0}</p>
        </div>
      </div>
    </div>
  );

  const renderUserDashboard = () => (
    <div className="user-dashboard">
      <h2>My Bookings</h2>
      {data.length === 0 ? (
        <p>No bookings found.</p>
      ) : (
        <div className="bookings-list">
          {data.map(booking => (
            <div key={booking.booking_id} className="booking-card">
              <h3>Booking #{booking.booking_id}</h3>
              <p><strong>Room:</strong> {booking.room_number} ({booking.room_type})</p>
              <p><strong>Dates:</strong> {booking.check_in} to {booking.check_out}</p>
              <p><strong>Status:</strong> {booking.booking_status}</p>
              <p><strong>Price:</strong> ${booking.price}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Hotel Booking Management System</h1>
        <div className="user-info">
          <span>Welcome, {user.name || user.username}!</span>
          <button onClick={onLogout} className="btn btn-secondary">
            Logout
          </button>
        </div>
      </header>
      
      <main className="dashboard-main">
        {error && <div className="error-message">{error}</div>}
        
        {loading ? (
          <div className="loading">Loading dashboard...</div>
        ) : (
          user.type === 'admin' ? renderAdminDashboard() : renderUserDashboard()
        )}
      </main>
    </div>
  );
};

export default Dashboard;