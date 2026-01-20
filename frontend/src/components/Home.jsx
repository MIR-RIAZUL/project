import React, { useState, useEffect } from 'react';

const Home = ({ onLoginRedirect }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    check_in: '',
    check_out: '',
    guests: 1
  });

  useEffect(() => {
    fetchRooms();
  }, [filters]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      let url = 'http://127.0.0.1:5000/rooms/available';
      if (filters.check_in && filters.check_out) {
        url += `?check_in=${filters.check_in}&check_out=${filters.check_out}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setRooms(data);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleBookRoom = (roomId) => {
    if (!localStorage.getItem('token')) {
      onLoginRedirect();
    } else {
      // In a real app, this would navigate to booking page
      alert(`Please login to book room ${roomId}`);
    }
  };

  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Welcome to Luxury Hotel Booking</h1>
          <p>Discover the perfect accommodation for your stay</p>
        </div>
      </div>

      <div className="search-section">
        <div className="search-filters">
          <div className="filter-group">
            <label>Check In</label>
            <input
              type="date"
              name="check_in"
              value={filters.check_in}
              onChange={handleFilterChange}
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <label>Check Out</label>
            <input
              type="date"
              name="check_out"
              value={filters.check_out}
              onChange={handleFilterChange}
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <label>Guests</label>
            <select
              name="guests"
              value={filters.guests}
              onChange={handleFilterChange}
              className="filter-input"
            >
              {[1,2,3,4,5,6].map(num => (
                <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-search" onClick={fetchRooms}>
            Search Rooms
          </button>
        </div>
      </div>

      <div className="rooms-section">
        <h2>Available Rooms</h2>
        {loading ? (
          <div className="loading">Searching for available rooms...</div>
        ) : (
          <div className="rooms-grid">
            {rooms.length > 0 ? (
              rooms.map(room => (
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
                    <div className="room-features">
                      <span className="feature">★ {room.rating || 4.5}</span>
                      <span className="feature">WiFi</span>
                      <span className="feature">AC</span>
                    </div>
                  </div>
                  <div className="room-actions">
                    <button 
                      className="btn btn-book"
                      onClick={() => handleBookRoom(room.room_id)}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-rooms">
                <p>No rooms available for the selected dates. Please try different dates.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="features-section">
        <div className="features-grid">
          <div className="feature-item">
            <h3>✈️ Easy Booking</h3>
            <p>Quick and secure room reservations</p>
          </div>
          <div className="feature-item">
            <h3>💰 Best Price Guarantee</h3>
            <p>Competitive rates with no hidden fees</p>
          </div>
          <div className="feature-item">
            <h3>🌟 Premium Service</h3>
            <p>24/7 customer support and concierge</p>
          </div>
          <div className="feature-item">
            <h3>🔒 Secure Payment</h3>
            <p>Safe and encrypted payment processing</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;