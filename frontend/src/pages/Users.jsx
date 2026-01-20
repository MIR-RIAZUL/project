import React, { useEffect, useState } from "react";
import api from "../api";

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/users");
      setUsers(res.data);
    } catch (err) {
      setError("Failed to fetch users");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addUser = async () => {
    try {
      await api.post("/users", form);
      setForm({ name: "", email: "", password: "", phone: "" });
      fetchUsers();
    } catch (err) {
      setError("Failed to add user");
      console.error(err);
    }
  };

  const deleteUser = async (id) => {
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err) {
      setError("Failed to delete user");
      console.error(err);
    }
  };

  if (loading) return <div>Loading users...</div>;

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px 0', borderRadius: '5px' }}>
      <h3>Manage Users</h3>
      
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      
      <div style={{ marginBottom: '20px' }}>
        <h4>Add New User</h4>
        <input 
          placeholder="Name" 
          value={form.name} 
          onChange={(e) => setForm({...form, name: e.target.value})}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <input 
          placeholder="Email" 
          value={form.email} 
          onChange={(e) => setForm({...form, email: e.target.value})}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <input 
          placeholder="Password" 
          value={form.password} 
          onChange={(e) => setForm({...form, password: e.target.value})}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <input 
          placeholder="Phone" 
          value={form.phone} 
          onChange={(e) => setForm({...form, phone: e.target.value})}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <button onClick={addUser} style={{ padding: '5px 10px' }}>Add User</button>
      </div>
      
      <h4>Existing Users</h4>
      {users.length === 0 ? (
        <p>No users found</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>ID</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Name</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Email</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Phone</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.user_id}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.user_id}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.name}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.email}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.phone}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  <button 
                    onClick={() => deleteUser(user.user_id)}
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

export default Users;
