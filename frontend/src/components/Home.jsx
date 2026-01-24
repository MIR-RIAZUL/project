import React, { useState, useEffect } from 'react';

const Home = ({ onLoginRedirect }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    check_in: '',
    check_out: '',
    guests: 1,
    destination: '',
    min_price: '',
    max_price: '',
    room_type: '',
    min_rating: ''
  });
  const [sortBy, setSortBy] = useState('price');
  const [currentPage, setCurrentPage] = useState(1);
  const roomsPerPage = 9; // Increased for better full-screen utilization

  useEffect(() => {
    fetchRooms();
  }, [filters, sortBy]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRooms = async () => {
    setLoading(true);
    try {
      let url = 'http://127.0.0.1:5000/rooms/search';
      const params = [];
      
      if (filters.check_in && filters.check_out) {
        params.push(`check_in=${filters.check_in}`);
        params.push(`check_out=${filters.check_out}`);
      }
      if (filters.destination) {
        params.push(`destination=${encodeURIComponent(filters.destination)}`);
      }
      if (filters.min_price) {
        params.push(`min_price=${filters.min_price}`);
      }
      if (filters.max_price) {
        params.push(`max_price=${filters.max_price}`);
      }
      if (filters.room_type) {
        params.push(`room_type=${encodeURIComponent(filters.room_type)}`);
      }
      if (filters.min_rating) {
        params.push(`min_rating=${filters.min_rating}`);
      }
      
      if (params.length > 0) {
        url += '?' + params.join('&');
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        // Sort rooms based on selected criteria
        let sortedRooms = [...data];
        switch(sortBy) {
          case 'price-low':
            sortedRooms.sort((a, b) => a.price - b.price);
            break;
          case 'price-high':
            sortedRooms.sort((a, b) => b.price - a.price);
            break;
          case 'rating':
            sortedRooms.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
            break;
          default:
            // Default sort by price ascending
            sortedRooms.sort((a, b) => a.price - b.price);
        }
        setRooms(sortedRooms);
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

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const handleBookRoom = (roomId) => {
    if (!localStorage.getItem('token')) {
      onLoginRedirect();
    } else {
      // Navigate to booking page
      window.location.href = `/user/bookings`;
    }
  };

  // Pagination
  const indexOfLastRoom = currentPage * roomsPerPage;
  const indexOfFirstRoom = indexOfLastRoom - roomsPerPage;
  const currentRooms = rooms.slice(indexOfFirstRoom, indexOfLastRoom);
  const totalPages = Math.ceil(rooms.length / roomsPerPage);

  return (
    <div className="home-container" style={{width: '100%', maxWidth: '100%'}}>
      {/* Hero Section - Full width */}
      <div className="hero-section" style={{background: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url("https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1500&q=80") center/cover', padding: '100px 20px', textAlign: 'center', color: 'white', width: '100vw', marginLeft: 'calc(-50vw + 50%)'}}>
        <div className="hero-content">
          <h1 style={{fontSize: '3.5rem', marginBottom: '1rem', textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>Find Your Perfect Stay</h1>
          <p style={{fontSize: '1.3rem', maxWidth: '700px', margin: '0 auto', textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>Discover amazing hotels, homes, and places to stay around the world</p>
        </div>
      </div>

      {/* Advanced Search Bar - Full width container */}
      <div className="booking-search-bar" style={{maxWidth: '1400px', width: '95%', margin: '30px auto'}}>
        <form onSubmit={(e) => { e.preventDefault(); fetchRooms(); }} className="booking-search-form">
          <div className="booking-form-group">
            <label htmlFor="destination">Destination</label>
            <input
              type="text"
              name="destination"
              placeholder="Where are you going?"
              value={filters.destination}
              onChange={handleFilterChange}
              className="booking-form-control"
            />
          </div>
          
          <div className="booking-form-group">
            <label htmlFor="check_in">Check In</label>
            <input
              type="date"
              name="check_in"
              value={filters.check_in}
              onChange={handleFilterChange}
              className="booking-form-control"
              required
            />
          </div>
          
          <div className="booking-form-group">
            <label htmlFor="check_out">Check Out</label>
            <input
              type="date"
              name="check_out"
              value={filters.check_out}
              onChange={handleFilterChange}
              className="booking-form-control"
              required
            />
          </div>
          
          <div className="booking-form-group">
            <label htmlFor="guests">Guests</label>
            <select
              name="guests"
              value={filters.guests}
              onChange={handleFilterChange}
              className="booking-form-control"
            >
              {[1,2,3,4,5,6,7,8].map(num => (
                <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
              ))}
            </select>
          </div>
          
          <div className="booking-form-group">
            <label htmlFor="room_type">Room Type</label>
            <select
              name="room_type"
              value={filters.room_type}
              onChange={handleFilterChange}
              className="booking-form-control"
            >
              <option value="">All Types</option>
              <option value="Standard">Standard</option>
              <option value="Deluxe">Deluxe</option>
              <option value="Suite">Suite</option>
              <option value="Executive">Executive</option>
              <option value="Presidential">Presidential</option>
            </select>
          </div>
          
          <div className="booking-form-group">
            <label htmlFor="min_price">Min Price ($)</label>
            <input
              type="number"
              name="min_price"
              placeholder="Min"
              value={filters.min_price}
              onChange={handleFilterChange}
              className="booking-form-control"
              min="0"
            />
          </div>
          
          <div className="booking-form-group">
            <label htmlFor="max_price">Max Price ($)</label>
            <input
              type="number"
              name="max_price"
              placeholder="Max"
              value={filters.max_price}
              onChange={handleFilterChange}
              className="booking-form-control"
              min="0"
            />
          </div>
          
          <div className="booking-form-group">
            <label htmlFor="min_rating">Min Rating</label>
            <select
              name="min_rating"
              value={filters.min_rating}
              onChange={handleFilterChange}
              className="booking-form-control"
            >
              <option value="">Any Rating</option>
              <option value="1">1 Star+</option>
              <option value="2">2 Stars+</option>
              <option value="3">3 Stars+</option>
              <option value="4">4 Stars+</option>
              <option value="5">5 Stars+</option>
            </select>
          </div>
          
          <button type="submit" className="booking-search-button">
            Search Properties
          </button>
        </form>
      </div>

      {/* Sort and Filter Options */}
      <div className="booking-sort-filter" style={{maxWidth: '1400px', width: '95%', margin: '0 auto 20px'}}>
        <div className="booking-results-count">
          Found {rooms.length} properties
        </div>
        <div>
          <select 
            value={sortBy} 
            onChange={handleSortChange} 
            className="booking-sort-select"
          >
            <option value="price">Sort by: Price (Low to High)</option>
            <option value="price-high">Price (High to Low)</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      {/* Hotel Listings - Full width with better grid */}
      <div className="main-content" style={{width: '100%', maxWidth: '100%', padding: '0 20px'}}>
        {loading ? (
          <div className="loading">Searching for available properties...</div>
        ) : currentRooms.length > 0 ? (
          <div className="rooms-grid" style={{maxWidth: '1400px', width: '95%', margin: '0 auto', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))'}}>
            {currentRooms.map(room => (
              <div key={room.room_id} className="booking-hotel-card">
                <div className="booking-hotel-image">
                  <img 
                    src={room.photo_url || `https://images.unsplash.com/photo-1631049307264-da0ec9d70344?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80`} 
                    alt={room.room_type}
                    onError={(e) => {
                      e.target.src = `https://placehold.co/300x200?text=Room+${room.room_number}`;
                    }}
                  />
                  <div className="booking-hotel-badge">FEATURED</div>
                  <div className="booking-hotel-score">{room.avg_rating || 0} ★ ({room.reviews_count || 0})</div>
                </div>
                
                <div className="booking-hotel-details">
                  <h3>{room.room_type}</h3>
                  <p className="booking-hotel-location">📍 {room.location || `City Center, ${room.room_number}`}</p>
                  
                  <div className="booking-hotel-rating">
                    {'★'.repeat(Math.floor(room.avg_rating || 0))}
                    {'☆'.repeat(5 - Math.floor(room.avg_rating || 0))}
                    <span style={{marginLeft: '8px', color: '#666', fontSize: '12px'}}>({room.reviews_count || 0} reviews)</span>
                  </div>
                  
                  <p className="booking-hotel-description">{room.description || 'Comfortable and spacious room with modern amenities and excellent service.'}</p>
                  
                  <div className="booking-hotel-features">
                    {(room.features || ['WiFi', 'Air Conditioning', 'TV', 'Free Breakfast']).slice(0, 4).map((feature, idx) => (
                      <span key={idx} className="booking-feature-tag">{feature}</span>
                    ))}
                  </div>
                  
                  <div className="booking-hotel-price">
                    <div>
                      <span className="booking-price">${room.price}</span>
                      <span className="booking-per-night">per night</span>
                    </div>
                  </div>
                  
                  <div className="booking-hotel-actions">
                    <button 
                      className="booking-btn-book"
                      onClick={() => handleBookRoom(room.room_id)}
                    >
                      Reserve Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="booking-no-results" style={{maxWidth: '1400px', width: '95%', margin: '0 auto'}}>
            <h3>No properties match your search</h3>
            <p>Try adjusting your search criteria to see more options</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="booking-pagination">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
              <button
                key={pageNumber}
                onClick={() => setCurrentPage(pageNumber)}
                className={`booking-page-btn ${currentPage === pageNumber ? 'active' : ''}`}
              >
                {pageNumber}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Features Section - Full width */}
      <div className="booking-features-section" style={{maxWidth: '1400px', width: '95%', margin: '50px auto'}}>
        <h2 style={{textAlign: 'center', marginBottom: '40px', fontSize: '2.5rem', color: '#002a52'}}>Why Choose Our Platform?</h2>
        <div className="booking-features-grid">
          <div className="booking-feature-item">
            <h3>🏠 Extensive Selection</h3>
            <p>Thousands of properties worldwide with verified reviews and photos</p>
          </div>
          <div className="booking-feature-item">
            <h3>💰 Best Price Guarantee</h3>
            <p>Competitive rates with no hidden fees or surprise charges</p>
          </div>
          <div className="booking-feature-item">
            <h3>🛡️ Secure Booking</h3>
            <p>Your personal and payment information is protected with industry-standard security</p>
          </div>
          <div className="booking-feature-item">
            <h3>🛎️ 24/7 Customer Support</h3>
            <p>Our dedicated support team is available anytime you need assistance</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;