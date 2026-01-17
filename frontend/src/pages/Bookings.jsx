import { useEffect, useState } from "react";
import api from "../api";

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState({ user_id:"", room_id:"", check_in:"", check_out:"" });

  const loadBookings = async () => {
    const res = await api.get("/bookings");
    setBookings(res.data);
  };

  useEffect(() => loadBookings(), []);

  const addBooking = async () => {
    await api.post("/bookings", form);
    setForm({ user_id:"", room_id:"", check_in:"", check_out:"" });
    loadBookings();
  };

  const deleteBooking = async (id) => {
    await api.delete(`/bookings/${id}`);
    loadBookings();
  };

  return (
    <div>
      <h2>Bookings</h2>
      <input placeholder="User ID" value={form.user_id} onChange={e=>setForm({...form,user_id:e.target.value})}/>
      <input placeholder="Room ID" value={form.room_id} onChange={e=>setForm({...form,room_id:e.target.value})}/>
      <input type="date" value={form.check_in} onChange={e=>setForm({...form,check_in:e.target.value})}/>
      <input type="date" value={form.check_out} onChange={e=>setForm({...form,check_out:e.target.value})}/>
      <button onClick={addBooking}>Add Booking</button>

      <ul>
        {bookings.map(b => (
          <li key={b.booking_id}>
            Booking #{b.booking_id} | Room {b.room_id} | User {b.user_id} | {b.check_in} → {b.check_out}
            <button onClick={()=>deleteBooking(b.booking_id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
