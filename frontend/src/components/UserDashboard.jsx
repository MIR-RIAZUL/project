import React, { useState, useEffect } from 'react';

const UserDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingForm, setBookingForm] = useState({
    room_id: '',
    check_in: '',
    check_out: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      
      if (activeTab === 'bookings') {
        const response = await fetch('http://127.0.0.1:5000/user/bookings', {
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
      } else if (activeTab === 'browse') {
        const response = await fetch('http://127.0.0.1:5000/rooms/available');
        const result = await response.json();
        
        if (response.ok) {
          setRooms(Array.isArray(result) ? result : []);
        } else {
          setError(result.error || 'Failed to fetch rooms');
        }
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://127.0.0.1:5000/user/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingForm)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert('Booking created successfully!');
        setBookingForm({ room_id: '', check_in: '', check_out: '' });
        setActiveTab('bookings');
      } else {
        setError(result.error || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Booking error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://127.0.0.1:5000/user/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert('Booking cancelled successfully!');
        setBookings(bookings.filter(booking => booking.booking_id !== bookingId));
      } else {
        setError(result.error || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Cancel error:', error);
      setError('Network error. Please try again.');
    }
  };

  const renderBookings = () => (
    <div className="user-bookings">
      <h2>My Bookings</h2>
      {loading ? (
        <div className="loading">Loading bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="no-data">
          <p>You don't have any bookings yet.</p>
          <button 
            className="btn btn-primary"
            onClick={() => setActiveTab('browse')}
          >
            Browse Rooms
          </button>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map(booking => (
            <div key={booking.booking_id} className="booking-card">
              <div className="booking-header">
                <h3>Booking #{booking.booking_id}</h3>
                <span className={`status-badge status-${booking.booking_status.toLowerCase()}`}>
                  {booking.booking_status}
                </span>
              </div>
              <div className="booking-details">
                <p><strong>Room:</strong> {booking.room_number} ({booking.room_type})</p>
                <p><strong>Dates:</strong> {booking.check_in} to {booking.check_out}</p>
                <p><strong>Price:</strong> ${booking.price}</p>
                <p><strong>Created:</strong> {new Date(booking.created_at).toLocaleDateString()}</p>
              </div>
              <div className="booking-actions">
                {booking.booking_status !== 'Cancelled' && (
                  <button 
                    className="btn btn-danger"
                    onClick={() => handleCancelBooking(booking.booking_id)}
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderBrowseRooms = () => (
    <div className="browse-rooms">
      <h2>Browse Available Rooms</h2>
      {loading ? (
        <div className="loading">Loading rooms...</div>
      ) : (
        <div className="rooms-grid">
          {rooms.map(room => (
            <div key={room.room_id} className="room-card">
              <div className="room-image">
                <img 
                  src={`https://picsum.photos/300/200?random=${room.room_id}`} 
                  alt={room.room_type}
                  onError={(e) => {
                    e.target.src = `https://placehold.co/300x200?text=Room+${room.room_number}`;
                  }}
                />
              </div>
              <div className="room-details">
                <h3>Room {room.room_number}</h3>
                <p className="room-type">{room.room_type}</p>
                <p className="room-description">{room.description || 'Comfortable and spacious room'}</p>
                <div className="room-price">
                  <span className="price">${room.price}</span>
                  <span className="per-night">per night</span>
                </div>
              </div>
              <div className="room-actions">
                <button 
                  className="btn btn-book"
                  onClick={() => setBookingForm({...bookingForm, room_id: room.room_id})}
                >
                  Select Room
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderMakeBooking = () => (
    <div className="make-booking">
      <h2>Make a New Booking</h2>
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <form onSubmit={handleBookingSubmit} className="booking-form">
          <div className="form-group">
            <label htmlFor="room_id">Select Room</label>
            <select
              name="room_id"
              value={bookingForm.room_id}
              onChange={(e) => setBookingForm({...bookingForm, room_id: e.target.value})}
              className="form-control"
              required
            >
              <option value="">Choose a room</option>
              {rooms.map(room => (
                <option key={room.room_id} value={room.room_id}>
                  Room {room.room_number} - {room.room_type} (${room.price}/night)
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="check_in">Check In</label>
              <input
                type="date"
                name="check_in"
                value={bookingForm.check_in}
                onChange={(e) => setBookingForm({...bookingForm, check_in: e.target.value})}
                className="form-control"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="check_out">Check Out</label>
              <input
                type="date"
                name="check_out"
                value={bookingForm.check_out}
                onChange={(e) => setBookingForm({...bookingForm, check_out: e.target.value})}
                className="form-control"
                required
              />
            </div>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading || !bookingForm.room_id || !bookingForm.check_in || !bookingForm.check_out}
          >
            {loading ? 'Creating Booking...' : 'Create Booking'}
          </button>
        </form>
      )}
    </div>
  );

  return (
    <div className="user-dashboard-container">
      <header className="dashboard-header">
        <h1>Hotel Booking Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user.name || user.email}!</span>
          <button onClick={onLogout} className="btn btn-secondary">
            Logout
          </button>
        </div>
      </header>
      
      <nav className="dashboard-nav">
        <button
          className={`nav-btn ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          My Bookings
        </button>
        <button
          className={`nav-btn ${activeTab === 'browse' ? 'active' : ''}`}
          onClick={() => setActiveTab('browse')}
        >
          Browse Rooms
        </button>
        <button
          className={`nav-btn ${activeTab === 'new' ? 'active' : ''}`}
          onClick={() => setActiveTab('new')}
        >
          Make Booking
        </button>
      </nav>
      
      <main className="dashboard-main">
        {error && <div className="error-message">{error}</div>}
        
        {activeTab === 'bookings' && renderBookings()}
        {activeTab === 'browse' && renderBrowseRooms()}
        {activeTab === 'new' && renderMakeBooking()}
      </main>
    </div>
  );
};

export default UserDashboard;