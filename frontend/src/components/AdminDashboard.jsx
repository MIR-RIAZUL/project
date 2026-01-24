import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [data, setData] = useState({
    total_bookings: 0,
    total_revenue: 0,
    total_users: 0,
    total_rooms: 0,
    recent_bookings: [],
    users: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user: _user } = useContext(AuthContext);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    
    try {
      let endpoint = '';
      switch(activeTab) {
        case 'analytics':
          endpoint = 'http://127.0.0.1:5000/admin/analytics';
          break;
        case 'bookings':
          endpoint = 'http://127.0.0.1:5000/admin/bookings';
          break;
        case 'users':
          endpoint = 'http://127.0.0.1:5000/admin/users';
          break;
        default:
          endpoint = 'http://127.0.0.1:5000/admin/analytics';
      }

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setData(result.data || result);
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderAnalytics = () => (
    <div>
      <h2 style={{marginBottom: '25px', color: '#2d3748'}}>Analytics Dashboard</h2>
      
      <div className="stats-grid" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'}}>
        <div className="stat-card">
          <h3>Total Bookings</h3>
          <p>{data.total_bookings}</p>
        </div>
        <div className="stat-card">
          <h3>Total Revenue</h3>
          <p>${data.total_revenue?.toFixed(2) || '0.00'}</p>
        </div>
        <div className="stat-card">
          <h3>Total Users</h3>
          <p>{data.total_users}</p>
        </div>
        <div className="stat-card">
          <h3>Total Rooms</h3>
          <p>{data.total_rooms}</p>
        </div>
      </div>

      <div style={{marginTop: '30px'}}>
        <h3 style={{marginBottom: '15px', color: '#4a5568'}}>Recent Bookings</h3>
        {data.recent_bookings && data.recent_bookings.length > 0 ? (
          <div className="bookings-table">
            <table style={{width: '100%'}}>
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>User</th>
                  <th>Room</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_bookings.slice(0, 5).map(booking => (
                  <tr key={booking.booking_id}>
                    <td>#{booking.booking_id}</td>
                    <td>{booking.username}</td>
                    <td>{booking.room_type} #{booking.room_number}</td>
                    <td>{new Date(booking.check_in_date).toLocaleDateString()}</td>
                    <td>{new Date(booking.check_out_date).toLocaleDateString()}</td>
                    <td>${booking.total_amount}</td>
                    <td>
                      <span className={`status-badge status-${booking.status.toLowerCase()}`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No recent bookings found</p>
        )}
      </div>
    </div>
  );

  const renderBookings = () => (
    <div>
      <h2 style={{marginBottom: '25px', color: '#2d3748'}}>All Bookings</h2>
      {data.bookings && data.bookings.length > 0 ? (
        <div className="bookings-table">
          <table style={{width: '100%'}}>
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>User</th>
                <th>Room</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Guests</th>
                <th>Total Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.bookings.map(booking => (
                <tr key={booking.booking_id}>
                  <td>#{booking.booking_id}</td>
                  <td>{booking.username}</td>
                  <td>{booking.room_type} #{booking.room_number}</td>
                  <td>{new Date(booking.check_in_date).toLocaleDateString()}</td>
                  <td>{new Date(booking.check_out_date).toLocaleDateString()}</td>
                  <td>{booking.guests}</td>
                  <td>${booking.total_amount}</td>
                  <td>
                    <span className={`status-badge status-${booking.status.toLowerCase()}`}>
                      {booking.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No bookings found</p>
      )}
    </div>
  );

  const renderUsers = () => (
    <div>
      <h2 style={{marginBottom: '25px', color: '#2d3748'}}>User Management</h2>
      {data.users && data.users.length > 0 ? (
        <div className="users-table">
          <table style={{width: '100%'}}>
            <thead>
              <tr>
                <th>User ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map(user => (
                <tr key={user.user_id}>
                  <td>{user.user_id}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`status-badge ${user.is_admin ? 'status-confirmed' : 'status-pending'}`}>
                      {user.is_admin ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No users found</p>
      )}
    </div>
  );

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="dashboard-container" style={{width: '95%', maxWidth: '1400px', margin: '30px auto'}}>
      {/* Booking.com inspired header */}
      <div className="booking-header" style={{borderRadius: '8px 8px 0 0', marginBottom: 0}}>
        <div className="booking-logo">
          <span className="booking-logo-icon">👑</span>
          <span>Admin Dashboard</span>
        </div>
        <div className="booking-user-info">
          <span className="booking-user-name">Administrator</span>
          <span style={{fontSize: '12px', opacity: 0.8}}>Manage system & users</span>
        </div>
      </div>

      <div className="dashboard-main">
        {/* Navigation Tabs */}
        <nav className="dashboard-nav">
          <button 
            className={`nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>
          <button 
            className={`nav-btn ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            Bookings
          </button>
          <button 
            className={`nav-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
        </nav>

        {/* Content Area */}
        <div style={{padding: '30px'}}>
          {activeTab === 'analytics' && renderAnalytics()}
          {activeTab === 'bookings' && renderBookings()}
          {activeTab === 'users' && renderUsers()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;