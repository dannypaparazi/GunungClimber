import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { getAllUsers, updateUserRole, deleteUserProfile } from '../firestoreApi';
import '../styles/Admin.css';

function AdminConsole({ onLogout }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setUsers(await getAllUsers());
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = async (user) => {
    try {
      await updateUserRole(user.id, user.role === 'admin' ? 'user' : 'admin');
      fetchUsers();
    } catch (err) {
      setError('Failed to update role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Remove this user\'s profile? They will no longer be able to use the app.')) {
      try {
        await deleteUserProfile(userId);
        fetchUsers();
      } catch (err) {
        setError('Failed to delete user');
      }
    }
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>Admin Console</h1>
        <button onClick={() => { onLogout(); navigate('/login'); }} className="btn-logout">
          Logout
        </button>
      </header>

      <div className="admin-content">
        <div className="users-section">
          <div className="section-header">
            <h2>User Management</h2>
          </div>

          {error && <div className="error-message">{error}</div>}

          {loading ? (
            <p>Loading users...</p>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Full Name</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{user.full_name}</td>
                    <td>{user.role}</td>
                    <td>{user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</td>
                    <td>
                      <button
                        onClick={() => handleToggleRole(user)}
                        className="btn-secondary"
                        disabled={user.id === auth.currentUser.uid}
                      >
                        {user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="btn-danger"
                        disabled={user.id === auth.currentUser.uid}
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
      </div>
    </div>
  );
}

export default AdminConsole;
