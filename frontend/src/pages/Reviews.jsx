import { useEffect, useState } from "react";
import api from "../api";

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ user_id: "", room_id: "", rating: "", comment: "" });

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/reviews");
      setReviews(res.data);
    } catch (err) {
      setError("Failed to load reviews");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => loadReviews(), []);

  const addReview = async () => {
    try {
      await api.post("/reviews", {...form, rating: Number(form.rating)});
      setForm({ user_id: "", room_id: "", rating: "", comment: "" });
      loadReviews();
    } catch (err) {
      setError("Failed to add review");
      console.error(err);
    }
  };

  const deleteReview = async (id) => {
    try {
      await api.delete(`/reviews/${id}`);
      loadReviews();
    } catch (err) {
      setError("Failed to delete review");
      console.error(err);
    }
  };

  if (loading) return <div>Loading reviews...</div>;

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px 0', borderRadius: '5px' }}>
      <h3>Manage Reviews</h3>
      
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      
      <div style={{ marginBottom: '20px' }}>
        <h4>Add New Review</h4>
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
        <select
          value={form.rating}
          onChange={e => setForm({...form, rating: e.target.value})}
          style={{ marginRight: '10px', padding: '5px' }}
        >
          <option value="">Select Rating</option>
          <option value="1">1 Star</option>
          <option value="2">2 Stars</option>
          <option value="3">3 Stars</option>
          <option value="4">4 Stars</option>
          <option value="5">5 Stars</option>
        </select>
        <input 
          placeholder="Comment" 
          value={form.comment} 
          onChange={e => setForm({...form, comment: e.target.value})}
          style={{ marginRight: '10px', padding: '5px', width: '200px' }}
        />
        <button onClick={addReview} style={{ padding: '5px 10px' }}>Add Review</button>
      </div>
      
      <h4>Existing Reviews</h4>
      {reviews.length === 0 ? (
        <p>No reviews found</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>ID</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>User</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Room</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Rating</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Comment</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map(r => (
              <tr key={r.review_id}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{r.review_id}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{r.user_name || r.user_id}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{r.room_number || r.room_id}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{r.rating} ★</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{r.comment}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  <button 
                    onClick={() => deleteReview(r.review_id)}
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
