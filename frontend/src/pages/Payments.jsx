import { useEffect, useState } from "react";
import api from "../api";

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ booking_id: "", amount: "", payment_method: "Paytm", payment_status: "Pending" });

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/payments");
      setPayments(res.data);
    } catch (err) {
      setError("Failed to load payments");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => loadPayments(), []);

  const addPayment = async () => {
    try {
      await api.post("/payments", {...form, amount: Number(form.amount)});
      setForm({ booking_id: "", amount: "", payment_method: "Paytm", payment_status: "Pending" });
      loadPayments();
    } catch (err) {
      setError("Failed to add payment");
      console.error(err);
    }
  };

  const deletePayment = async (id) => {
    try {
      await api.delete(`/payments/${id}`);
      loadPayments();
    } catch (err) {
      setError("Failed to delete payment");
      console.error(err);
    }
  };

  if (loading) return <div>Loading payments...</div>;

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px 0', borderRadius: '5px' }}>
      <h3>Manage Payments</h3>
      
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      
      <div style={{ marginBottom: '20px' }}>
        <h4>Add New Payment</h4>
        <input 
          placeholder="Booking ID" 
          value={form.booking_id} 
          onChange={e => setForm({...form, booking_id: e.target.value})}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <input 
          placeholder="Amount" 
          value={form.amount} 
          onChange={e => setForm({...form, amount: e.target.value})}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <select
          value={form.payment_method}
          onChange={e => setForm({...form, payment_method: e.target.value})}
          style={{ marginRight: '10px', padding: '5px' }}
        >
          <option value="Paytm">Paytm</option>
          <option value="Credit Card">Credit Card</option>
          <option value="Debit Card">Debit Card</option>
          <option value="Cash">Cash</option>
          <option value="Net Banking">Net Banking</option>
        </select>
        <select
          value={form.payment_status}
          onChange={e => setForm({...form, payment_status: e.target.value})}
          style={{ marginRight: '10px', padding: '5px' }}
        >
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
          <option value="Failed">Failed</option>
          <option value="Refunded">Refunded</option>
        </select>
        <button onClick={addPayment} style={{ padding: '5px 10px' }}>Add Payment</button>
      </div>
      
      <h4>Existing Payments</h4>
      {payments.length === 0 ? (
        <p>No payments found</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>ID</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Booking ID</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Amount</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Method</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Status</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.payment_id}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{p.payment_id}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{p.booking_id}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>${p.amount}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{p.payment_method}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{p.payment_status}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  <button 
                    onClick={() => deletePayment(p.payment_id)}
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
