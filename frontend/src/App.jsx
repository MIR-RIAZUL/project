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
      <h1>Hotel Booking Management System</h1>
      <hr />
      <h2>Users</h2>
      <Users />
      <h2>Rooms</h2>
      <Rooms />
      <h2>Bookings</h2>
      <Bookings />
      <h2>Reviews</h2>
      <Reviews />
      <h2>Payments</h2>
      <Payments />
    </div>
  );
}

export default App;
