import { useEffect, useState } from "react";
import api from "../api";

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({ room_number:"", room_type:"", price:"", description:"" });

  const loadRooms = async () => {
    const res = await api.get("/rooms");
    setRooms(res.data);
  };

  useEffect(() => loadRooms(), []);

  const addRoom = async () => {
    await api.post("/rooms", {...form, price:Number(form.price)});
    setForm({ room_number:"", room_type:"", price:"", description:"" });
    loadRooms();
  };

  const deleteRoom = async (id) => {
    await api.delete(`/rooms/${id}`);
    loadRooms();
  };

  return (
    <div>
      <h2>Rooms</h2>
      <input placeholder="Room Number" value={form.room_number} onChange={e=>setForm({...form,room_number:e.target.value})}/>
      <input placeholder="Room Type" value={form.room_type} onChange={e=>setForm({...form,room_type:e.target.value})}/>
      <input placeholder="Price" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/>
      <input placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
      <button onClick={addRoom}>Add Room</button>

      <ul>
        {rooms.map(r => (
          <li key={r.room_id}>
            {r.room_number} | {r.room_type} | ${r.price} | {r.description}
            <button onClick={()=>deleteRoom(r.room_id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
