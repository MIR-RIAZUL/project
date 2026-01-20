import { useEffect, useState } from "react";
import api from "../api";

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ room_number: "", room_type: "", price: "", description: "", status: "Available" });

  const loadRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/rooms");
      setRooms(res.data);
    } catch (err) {
      setError("Failed to load rooms");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => loadRooms(), []);

  const addRoom = async () => {
    try {
      await api.post("/rooms", {...form, price: Number(form.price)});
      setForm({ room_number: "", room_type: "", price: "", description: "", status: "Available" });
      loadRooms();
    } catch (err) {
      setError("Failed to add room");
      console.error(err);
    }
  };

  const deleteRoom = async (id) => {
    try {
      await api.delete(`/rooms/${id}`);
      loadRooms();
    } catch (err) {
      setError("Failed to delete room");
      console.error(err);
    }
  };

  if (loading) return <div>Loading rooms...</div>;

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px 0', borderRadius: '5px' }}>
      <h3>Manage Rooms</h3>
      
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      
      <div style={{ marginBottom: '20px' }}>
        <h4>Add New Room</h4>
        <input 
          placeholder="Room Number" 
          value={form.room_number} 
          onChange={e => setForm({...form, room_number: e.target.value})}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <input 
          placeholder="Room Type" 
          value={form.room_type} 
          onChange={e => setForm({...form, room_type: e.target.value})}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <input 
          placeholder="Price" 
          value={form.price} 
          onChange={e => setForm({...form, price: e.target.value})}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <input 
          placeholder="Description" 
          value={form.description} 
          onChange={e => setForm({...form, description: e.target.value})}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <select
          value={form.status}
          onChange={e => setForm({...form, status: e.target.value})}
          style={{ marginRight: '10px', padding: '5px' }}
        >
          <option value="Available">Available</option>
          <option value="Occupied">Occupied</option>
          <option value="Maintenance">Maintenance</option>
        </select>
        <button onClick={addRoom} style={{ padding: '5px 10px' }}>Add Room</button>
      </div>
      
      <h4>Existing Rooms</h4>
      {rooms.length === 0 ? (
        <p>No rooms found</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>ID</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Number</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Type</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Price</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Status</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Description</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map(r => (
              <tr key={r.room_id}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{r.room_id}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{r.room_number}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{r.room_type}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>${r.price}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{r.status}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{r.description}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  <button 
                    onClick={() => deleteRoom(r.room_id)}
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
