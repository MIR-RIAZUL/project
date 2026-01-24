import React, { useState, useEffect } from 'react';

const AdminDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roomForm, setRoomForm] = useState({
    room_number: '',
    room_type: '',
    price: '',
    description: '',
    photo_url: '',
    status: 'Available'
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      
      if (activeTab === 'dashboard') {
        const response = await fetch('http://127.0.0.1:5000/admin/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const result = await response.json();
        
        if (response.ok) {
          setStats(result);
        } else {
          setError(result.error || 'Failed to fetch dashboard data');
        }
      } else if (activeTab === 'users') {
        const response = await fetch('http://127.0.0.1:5000/admin/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const result = await response.json();
        
        if (response.ok) {
          setUsers(Array.isArray(result) ? result : []);
        } else {
          setError(result.error || 'Failed to fetch users');
        }
      } else if (activeTab === 'rooms') {
        const response = await fetch('http://127.0.0.1:5000/rooms', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const result = await response.json();
        
        if (response.ok) {
          setRooms(Array.isArray(result) ? result : []);
        } else {
          setError(result.error || 'Failed to fetch rooms');
        }
      } else if (activeTab === 'bookings') {
        const response = await fetch('http://127.0.0.1:5000/admin/bookings', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const result = await response.json();
        
        if (response.ok) {
          setBookings(Array.isArray(result) ? result : []);
        } else {
          setError(result.error || 'Failed to fetch bookings');
        }
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://127.0.0.1:5000/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...roomForm,
          price: parseFloat(roomForm.price),
          photo_url: roomForm.photo_url
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert('Room added successfully!');
        setRoomForm({ room_number: '', room_type: '', price: '', description: '', status: 'Available' });
        setActiveTab('rooms');
      } else {
        setError(result.error || 'Failed to add room');
      }
    } catch (error) {
      console.error('Add room error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://127.0.0.1:5000/rooms/${roomId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert('Room deleted successfully!');
        setRooms(rooms.filter(room => room.room_id !== roomId));
      } else {
        setError(result.error || 'Failed to delete room');
      }
    } catch (error) {
      console.error('Delete room error:', error);
      setError('Network error. Please try again.');
    }
  };

  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://127.0.0.1:5000/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          booking_status: newStatus
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert(`Booking status updated to ${newStatus}`);
        // Refresh bookings list
        fetchData();
      } else {
        setError(result.error || 'Failed to update booking status');
      }
    } catch (error) {
      console.error('Update booking error:', error);
      setError('Network error. Please try again.');
    }
  };

  const renderDashboard = () => (
    <div className="admin-dashboard">
      <h2>Admin Dashboard</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p>{stats.total_users || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Rooms</h3>
          <p>{stats.total_rooms || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Bookings</h3>
          <p>{stats.total_bookings || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Pending Bookings</h3>
          <p>{stats.pending_bookings || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Confirmed Bookings</h3>
          <p>{stats.confirmed_bookings || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Revenue</h3>
          <p>${stats.total_revenue || 0}</p>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="admin-users">
      <h2>Manage Users</h2>
      {loading ? (
        <div className="loading">Loading users...</div>
      ) : (
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.user_id}>
                  <td>{user.user_id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.phone || '-'}</td>
                  <td>
                    <span className={`status-badge status-${user.status.toLowerCase()}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderRooms = () => (
    <div className="admin-rooms">
      <h2>Manage Rooms</h2>
      
      <div className="room-form-section">
        <h3>Add New Room</h3>
        <form onSubmit={handleAddRoom} className="room-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="room_number">Room Number</label>
              <input
                type="text"
                name="room_number"
                value={roomForm.room_number}
                onChange={(e) => setRoomForm({...roomForm, room_number: e.target.value})}
                className="form-control"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="room_type">Room Type</label>
              <input
                type="text"
                name="room_type"
                value={roomForm.room_type}
                onChange={(e) => setRoomForm({...roomForm, room_type: e.target.value})}
                className="form-control"
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Price</label>
              <input
                type="number"
                name="price"
                value={roomForm.price}
                onChange={(e) => setRoomForm({...roomForm, price: e.target.value})}
                className="form-control"
                required
                min="0"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                name="status"
                value={roomForm.status}
                onChange={(e) => setRoomForm({...roomForm, status: e.target.value})}
                className="form-control"
                required
              >
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              name="description"
              value={roomForm.description}
              onChange={(e) => setRoomForm({...roomForm, description: e.target.value})}
              className="form-control"
              rows="3"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="photo_url">Photo URL</label>
            <input
              type="text"
              name="photo_url"
              value={roomForm.photo_url}
              onChange={(e) => setRoomForm({...roomForm, photo_url: e.target.value})}
              className="form-control"
              placeholder="Enter URL to room photo (optional)"
            />
            <small className="form-hint">Provide a URL to an image of the room (e.g., https://example.com/room.jpg)</small>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Adding Room...' : 'Add Room'}
          </button>
        </form>
      </div>
      
      <div className="rooms-list">
        <h3>Existing Rooms</h3>
        {loading ? (
          <div className="loading">Loading rooms...</div>
        ) : (
          <div className="rooms-grid">
            {rooms.map(room => (
              <div key={room.room_id} className="booking-hotel-card">
                <div className="booking-hotel-image">
                  {room.photo_url ? (
                    <img src={room.photo_url} alt={`Room ${room.room_number}`} className="booking-hotel-image" />
                  ) : (
                    <img src={`https://images.unsplash.com/photo-1631049307264-da0ec9d70344?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80`} alt={`Room ${room.room_number}`} className="booking-hotel-image" />
                  )}
                </div>
                <div className="booking-hotel-details">
                  <div className="booking-hotel-header">
                    <h3>Room {room.room_number}</h3>
                    <span className={`status-badge status-${room.status.toLowerCase()}`}>
                      {room.status}
                    </span>
                  </div>
                  <p><strong>Type:</strong> {room.room_type}</p>
                  <p><strong>Price:</strong> ${room.price}</p>
                  <p><strong>Description:</strong> {room.description || '-'}</p>
                  <div className="room-actions">
                    <button 
                      className="btn btn-danger"
                      onClick={() => handleDeleteRoom(room.room_id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderBookings = () => (
    <div className="admin-bookings">
      <h2>Manage Bookings</h2>
      {loading ? (
        <div className="loading">Loading bookings...</div>
      ) : (
        <div className="bookings-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Room</th>
                <th>Dates</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(booking => (
                <tr key={booking.booking_id}>
                  <td>{booking.booking_id}</td>
                  <td>{booking.user_name || booking.user_email}</td>
                  <td>{booking.room_number} ({booking.room_type})</td>
                  <td>{booking.check_in} to {booking.check_out}</td>
                  <td>
                    <span className={`status-badge status-${booking.booking_status.toLowerCase()}`}>
                      {booking.booking_status}
                    </span>
                  </td>
                  <td>{new Date(booking.created_at).toLocaleDateString()}</td>
                  <td>
                    <select
                      value={booking.booking_status}
                      onChange={(e) => handleUpdateBookingStatus(booking.booking_id, e.target.value)}
                      className="form-control"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="admin-dashboard-container">
      <header className="booking-header">
        <div className="booking-logo">
          <span className="booking-logo-icon">🏨</span>
          <span>BookingPro Admin</span>
        </div>
        <div className="booking-header-links">
          <a href="#" className="booking-header-link">Dashboard</a>
          <a href="#" className="booking-header-link">Reports</a>
        </div>
        <div className="booking-header-user">
          <div className="booking-user-info">
            <span className="booking-user-name">Welcome, {user.username} (Admin)!</span>
            <button onClick={onLogout} className="btn btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </header>
      
      <div className="dashboard-container">
        <nav className="dashboard-nav">
          <button
            className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`nav-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button
            className={`nav-btn ${activeTab === 'rooms' ? 'active' : ''}`}
            onClick={() => setActiveTab('rooms')}
          >
            Rooms
          </button>
          <button
            className={`nav-btn ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            Bookings
          </button>
        </nav>
        
        <main className="dashboard-main">
          {error && <div className="error-message">{error}</div>}
          
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'rooms' && renderRooms()}
          {activeTab === 'bookings' && renderBookings()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;