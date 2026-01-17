import { useEffect, useState } from "react";
import api from "../api";

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [form, setForm] = useState({ booking_id:"", amount:"", payment_method:"", payment_status:"" });

  const loadPayments = async () => {
    const res = await api.get("/payments");
    setPayments(res.data);
  };

  useEffect(() => loadPayments(), []);

  const addPayment = async () => {
    await api.post("/payments", {...form, amount:Number(form.amount)});
    setForm({ booking_id:"", amount:"", payment_method:"", payment_status:"" });
    loadPayments();
  };

  const deletePayment = async (id) => {
    await api.delete(`/payments/${id}`);
    loadPayments();
  };

  return (
    <div>
      <h2>Payments</h2>
      <input placeholder="Booking ID" value={form.booking_id} onChange={e=>setForm({...form,booking_id:e.target.value})}/>
      <input placeholder="Amount" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/>
      <input placeholder="Payment Method" value={form.payment_method} onChange={e=>setForm({...form,payment_method:e.target.value})}/>
      <input placeholder="Payment Status" value={form.payment_status} onChange={e=>setForm({...form,payment_status:e.target.value})}/>
      <button onClick={addPayment}>Add Payment</button>

      <ul>
        {payments.map(p => (
          <li key={p.payment_id}>
            Booking {p.booking_id} | Amount ${p.amount} | {p.payment_method} | {p.payment_status}
            <button onClick={()=>deletePayment(p.payment_id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
