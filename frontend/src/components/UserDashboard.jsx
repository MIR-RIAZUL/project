import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';

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
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

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
        // Fetch room details for receipt
        const roomResponse = await fetch(`http://127.0.0.1:5000/rooms/${bookingForm.room_id}`);
        const roomResult = await roomResponse.json();
        
        if (roomResponse.ok) {
          const receiptInfo = {
            booking_id: result.booking_id,
            room: roomResult,
            check_in: bookingForm.check_in,
            check_out: bookingForm.check_out,
            user: user,
            booking_date: new Date().toISOString().split('T')[0]
          };
          setReceiptData(receiptInfo);
          setShowReceipt(true);
        }
        
        setBookingForm({ room_id: '', check_in: '', check_out: '' });
        // Optionally fetch bookings to update the list
        setTimeout(() => {
          fetchData();
        }, 1000);
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

  const closeReceipt = () => {
    setShowReceipt(false);
    setReceiptData(null);
  };

  const downloadReceiptAsPDF = () => {
    if (!receiptData) return;
    
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('Hotel Booking Receipt', 20, 20);
    
    // Add booking details
    doc.setFontSize(12);
    doc.text(`Booking ID: #${receiptData.booking_id}`, 20, 40);
    doc.text(`Booking Date: ${receiptData.booking_date}`, 20, 50);
    doc.text(`Status: Pending`, 20, 60);
    
    // Add room information
    doc.setFontSize(14);
    doc.text('Room Information', 20, 80);
    doc.setFontSize(12);
    doc.text(`Room Number: ${receiptData.room.room_number}`, 20, 90);
    doc.text(`Room Type: ${receiptData.room.room_type}`, 20, 100);
    doc.text(`Description: ${receiptData.room.description || 'N/A'}`, 20, 110);
    
    // Add stay details
    doc.setFontSize(14);
    doc.text('Stay Details', 20, 130);
    doc.setFontSize(12);
    doc.text(`Check-in: ${receiptData.check_in}`, 20, 140);
    doc.text(`Check-out: ${receiptData.check_out}`, 20, 150);
    
    const nights = Math.max(1, Math.floor((new Date(receiptData.check_out) - new Date(receiptData.check_in)) / (1000 * 60 * 60 * 24)));
    doc.text(`Duration: ${nights} nights`, 20, 160);
    
    // Add guest information
    doc.setFontSize(14);
    doc.text('Guest Information', 20, 180);
    doc.setFontSize(12);
    doc.text(`Name: ${receiptData.user.name || receiptData.user.email}`, 20, 190);
    doc.text(`Email: ${receiptData.user.email}`, 20, 200);
    
    // Add payment summary
    doc.setFontSize(14);
    doc.text('Payment Summary', 20, 220);
    doc.setFontSize(12);
    doc.text(`Room Rate: $${receiptData.room.price}/night`, 20, 230);
    doc.text(`Nights: ${nights}`, 20, 240);
    doc.text(`Subtotal: $${(receiptData.room.price * nights).toFixed(2)}`, 20, 250);
    doc.text(`Taxes & Fees: $${(receiptData.room.price * nights * 0.1).toFixed(2)}`, 20, 260);
    doc.text(`Total Amount: $${(receiptData.room.price * nights * 1.1).toFixed(2)}`, 20, 270);
    
    // Add footer
    doc.setFontSize(10);
    doc.text('Thank you for choosing our hotel!', 20, 290);
    doc.text('Please keep this receipt for your records.', 20, 300);
    
    // Save the PDF
    doc.save(`booking_receipt_${receiptData.booking_id}.pdf`);
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
                {room.photo_url ? (
                  <img 
                    src={room.photo_url}
                    alt={room.room_type}
                    onError={(e) => {
                      e.target.src = `https://placehold.co/300x200?text=Room+${room.room_number}`;
                    }}
                  />
                ) : (
                  <img 
                    src={`https://picsum.photos/300/200?random=${room.room_id}`} 
                    alt={room.room_type}
                    onError={(e) => {
                      e.target.src = `https://placehold.co/300x200?text=Room+${room.room_number}`;
                    }}
                  />
                )}
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
                  onClick={() => {
                    setBookingForm({...bookingForm, room_id: room.room_id});
                    setActiveTab('new');
                  }}
                >
                  Select & Book
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
      
      {/* Receipt Modal */}
      {showReceipt && receiptData && (
        <div className="modal-overlay" onClick={closeReceipt}>
          <div className="receipt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="receipt-header">
              <h2>Booking Receipt</h2>
              <button className="close-btn" onClick={closeReceipt}>×</button>
            </div>
            <div className="receipt-content">
              <div className="receipt-section">
                <h3>Booking Details</h3>
                <p><strong>Booking ID:</strong> #{receiptData.booking_id}</p>
                <p><strong>Booking Date:</strong> {receiptData.booking_date}</p>
                <p><strong>Status:</strong> <span className="status-badge status-pending">Pending</span></p>
              </div>
              
              <div className="receipt-section">
                <h3>Room Information</h3>
                <p><strong>Room Number:</strong> {receiptData.room.room_number}</p>
                <p><strong>Room Type:</strong> {receiptData.room.room_type}</p>
                <p><strong>Room Description:</strong> {receiptData.room.description || 'N/A'}</p>
              </div>
              
              <div className="receipt-section">
                <h3>Stay Details</h3>
                <p><strong>Check-in:</strong> {receiptData.check_in}</p>
                <p><strong>Check-out:</strong> {receiptData.check_out}</p>
                <p><strong>Duration:</strong> {Math.max(1, Math.floor((new Date(receiptData.check_out) - new Date(receiptData.check_in)) / (1000 * 60 * 60 * 24)))} nights</p>
              </div>
              
              <div className="receipt-section">
                <h3>Guest Information</h3>
                <p><strong>Name:</strong> {receiptData.user.name || receiptData.user.email}</p>
                <p><strong>Email:</strong> {receiptData.user.email}</p>
              </div>
              
              <div className="receipt-section">
                <h3>Payment Summary</h3>
                <p><strong>Room Rate:</strong> ${receiptData.room.price}/night</p>
                <p><strong>Nights:</strong> {Math.max(1, Math.floor((new Date(receiptData.check_out) - new Date(receiptData.check_in)) / (1000 * 60 * 60 * 24)))}</p>
                <p><strong>Subtotal:</strong> ${(receiptData.room.price * Math.max(1, Math.floor((new Date(receiptData.check_out) - new Date(receiptData.check_in)) / (1000 * 60 * 60 * 24)))).toFixed(2)}</p>
                <p><strong>Taxes & Fees:</strong> ${(receiptData.room.price * Math.max(1, Math.floor((new Date(receiptData.check_out) - new Date(receiptData.check_in)) / (1000 * 60 * 60 * 24)))*0.1).toFixed(2)}</p>
                <div className="total-amount">
                  <strong>Total Amount:</strong> ${(receiptData.room.price * Math.max(1, Math.floor((new Date(receiptData.check_out) - new Date(receiptData.check_in)) / (1000 * 60 * 60 * 24)))*1.1).toFixed(2)}
                </div>
              </div>
            </div>
            <div className="receipt-footer">
              <p>Please keep this receipt for your records.</p>
              <div className="receipt-actions">
                <button className="btn btn-secondary" onClick={downloadReceiptAsPDF}>
                  Download PDF
                </button>
                <button className="btn btn-primary" onClick={closeReceipt}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;