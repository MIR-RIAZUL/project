import { useEffect, useState } from "react";
import api from "../api";

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState({ user_id:"", room_id:"", rating:"", comment:"" });

  const loadReviews = async () => {
    const res = await api.get("/reviews");
    setReviews(res.data);
  };

  useEffect(() => loadReviews(), []);

  const addReview = async () => {
    await api.post("/reviews", {...form, rating:Number(form.rating)});
    setForm({ user_id:"", room_id:"", rating:"", comment:"" });
    loadReviews();
  };

  const deleteReview = async (id) => {
    await api.delete(`/reviews/${id}`);
    loadReviews();
  };

  return (
    <div>
      <h2>Reviews</h2>
      <input placeholder="User ID" value={form.user_id} onChange={e=>setForm({...form,user_id:e.target.value})}/>
      <input placeholder="Room ID" value={form.room_id} onChange={e=>setForm({...form,room_id:e.target.value})}/>
      <input placeholder="Rating" value={form.rating} onChange={e=>setForm({...form,rating:e.target.value})}/>
      <input placeholder="Comment" value={form.comment} onChange={e=>setForm({...form,comment:e.target.value})}/>
      <button onClick={addReview}>Add Review</button>

      <ul>
        {reviews.map(r => (
          <li key={r.review_id}>
            User {r.user_id} | Room {r.room_id} | Rating {r.rating} | {r.comment}
            <button onClick={()=>deleteReview(r.review_id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
