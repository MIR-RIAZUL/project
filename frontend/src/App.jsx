import React from "react";
import Users from "./pages/Users";
import Rooms from "./pages/Rooms";
import Bookings from "./pages/Bookings";
import Reviews from "./pages/Reviews";
import Payments from "./pages/Payments";
import "./App.css";

function App() {
  return (
    <div className="App">
      <header style={{ backgroundColor: '#282c34', padding: '20px', textAlign: 'center' }}>
        <h1 style={{ color: 'white', margin: 0 }}>Hotel Booking Management System</h1>
      </header>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <Users />
        <Rooms />
        <Bookings />
        <Reviews />
        <Payments />
      </div>
    </div>
  );
}

export default App;
