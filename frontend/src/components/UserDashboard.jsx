import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const UserDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/user/bookings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setBookings(data);
      } else {
        setError(data.error || 'Failed to fetch bookings');
      }
    } catch {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const response = await fetch(`http://127.0.0.1:5000/user/bookings/${bookingId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh bookings
        fetchBookings();
      } else {
        alert(data.error || 'Failed to cancel booking');
      }
    } catch {
      alert('Network error occurred');
    }
  };

  if (loading) return <div className="loading">Loading your bookings...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="dashboard-container" style={{width: '95%', maxWidth: '1400px', margin: '30px auto'}}>
      {/* Booking.com inspired header */}
      <div className="booking-header" style={{borderRadius: '8px 8px 0 0', marginBottom: 0}}>
        <div className="booking-logo">
          <span className="booking-logo-icon">👤</span>
          <span>User Dashboard</span>
        </div>
        <div className="booking-user-info">
          <span className="booking-user-name">Welcome, {user?.username}</span>
          <span style={{fontSize: '12px', opacity: 0.8}}>Manage your bookings</span>
        </div>
      </div>

      <div className="dashboard-main">
        <h2 style={{marginBottom: '25px', color: '#2d3748'}}>My Bookings</h2>
        
        {bookings.length === 0 ? (
          <div style={{textAlign: 'center', padding: '40px', color: '#718096'}}>
            <h3>You have no bookings yet</h3>
            <p>Browse our properties and make your first reservation!</p>
          </div>
        ) : (
          <div className="bookings-table">
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{backgroundColor: '#f8f9fa'}}>
                  <th style={{padding: '12px 15px', textAlign: 'left', borderBottom: '2px solid #e0e0e0'}}>Property</th>
                  <th style={{padding: '12px 15px', textAlign: 'left', borderBottom: '2px solid #e0e0e0'}}>Check-in</th>
                  <th style={{padding: '12px 15px', textAlign: 'left', borderBottom: '2px solid #e0e0e0'}}>Check-out</th>
                  <th style={{padding: '12px 15px', textAlign: 'left', borderBottom: '2px solid #e0e0e0'}}>Guests</th>
                  <th style={{padding: '12px 15px', textAlign: 'left', borderBottom: '2px solid #e0e0e0'}}>Total</th>
                  <th style={{padding: '12px 15px', textAlign: 'left', borderBottom: '2px solid #e0e0e0'}}>Status</th>
                  <th style={{padding: '12px 15px', textAlign: 'left', borderBottom: '2px solid #e0e0e0'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(booking => (
                  <tr key={booking.booking_id} style={{borderBottom: '1px solid #e0e0e0'}}>
                    <td style={{padding: '12px 15px'}}>
                      <strong>{booking.room_type}</strong><br/>
                      <small style={{color: '#666'}}>Room #{booking.room_number}</small>
                    </td>
                    <td style={{padding: '12px 15px'}}>{new Date(booking.check_in_date).toLocaleDateString()}</td>
                    <td style={{padding: '12px 15px'}}>{new Date(booking.check_out_date).toLocaleDateString()}</td>
                    <td style={{padding: '12px 15px'}}>{booking.guests}</td>
                    <td style={{padding: '12px 15px'}}>${booking.total_amount}</td>
                    <td style={{padding: '12px 15px'}}>
                      <span className={`status-badge status-${booking.status.toLowerCase()}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td style={{padding: '12px 15px'}}>
                      {booking.status === 'Confirmed' && (
                        <button 
                          onClick={() => cancelBooking(booking.booking_id)}
                          className="btn btn-secondary"
                          style={{padding: '6px 12px', fontSize: '12px'}}
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;