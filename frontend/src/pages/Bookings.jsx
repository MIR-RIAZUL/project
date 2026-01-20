import { useEffect, useState } from "react";
import api from "../api";

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ user_id: "", room_id: "", check_in: "", check_out: "", booking_status: "Pending", arrival_status: "Not Arrived" });

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/bookings");
      setBookings(res.data);
    } catch (err) {
      setError("Failed to load bookings");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => loadBookings(), []);

  const addBooking = async () => {
    try {
      await api.post("/bookings", form);
      setForm({ user_id: "", room_id: "", check_in: "", check_out: "", booking_status: "Pending", arrival_status: "Not Arrived" });
      loadBookings();
    } catch (err) {
      setError("Failed to add booking");
      console.error(err);
    }
  };

  const deleteBooking = async (id) => {
    try {
      await api.delete(`/bookings/${id}`);
      loadBookings();
    } catch (err) {
      setError("Failed to delete booking");
      console.error(err);
    }
  };

  if (loading) return <div>Loading bookings...</div>;

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px 0', borderRadius: '5px' }}>
      <h3>Manage Bookings</h3>
      
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      
      <div style={{ marginBottom: '20px' }}>
        <h4>Add New Booking</h4>
        <input 
          placeholder="User ID" 
          value={form.user_id} 
          onChange={e => setForm({...form, user_id: e.target.value})}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <input 
          placeholder="Room ID" 
          value={form.room_id} 
          onChange={e => setForm({...form, room_id: e.target.value})}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <input 
          type="date" 
          value={form.check_in} 
          onChange={e => setForm({...form, check_in: e.target.value})}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <input 
          type="date" 
          value={form.check_out} 
          onChange={e => setForm({...form, check_out: e.target.value})}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <select
          value={form.booking_status}
          onChange={e => setForm({...form, booking_status: e.target.value})}
          style={{ marginRight: '10px', padding: '5px' }}
        >
          <option value="Pending">Pending</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <select
          value={form.arrival_status}
          onChange={e => setForm({...form, arrival_status: e.target.value})}
          style={{ marginRight: '10px', padding: '5px' }}
        >
          <option value="Not Arrived">Not Arrived</option>
          <option value="Arrived">Arrived</option>
          <option value="Departed">Departed</option>
        </select>
        <button onClick={addBooking} style={{ padding: '5px 10px' }}>Add Booking</button>
      </div>
      
      <h4>Existing Bookings</h4>
      {bookings.length === 0 ? (
        <p>No bookings found</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>ID</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>User</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Room</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Check In</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Check Out</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Status</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Arrival</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(b => (
              <tr key={b.booking_id}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{b.booking_id}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{b.user_name || b.user_id}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{b.room_number || b.room_id}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{b.check_in}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{b.check_out}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{b.booking_status}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{b.arrival_status}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  <button 
                    onClick={() => deleteBooking(b.booking_id)}
                    style={{ padding: '3px 8px', backgroundColor: '#ff4444', color: 'white', border: 'none', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
