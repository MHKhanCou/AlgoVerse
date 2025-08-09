import React from 'react';
import { toast } from 'react-toastify';

const ManageUsers = ({ users, searchQuery, fetchUsers, adminService }) => {
  const makeAdmin = async (userId) => {
    if (window.confirm('Make this user an admin?')) {
      try {
        await adminService.makeAdmin(userId);
        await fetchUsers();
        toast.success('User promoted to admin');
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Failed to make admin');
      }
    }
  };

  const deleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await adminService.deleteUser(userId);
        await fetchUsers();
        toast.success('User deleted');
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Failed to delete user');
      }
    }
  };

  // Log users to debug
  console.log('Users in ManageUsers:', users);

  const filteredUsers = users.filter((user) => {
    const name = user.name || ''; // Default to empty string if name is null/undefined
    const email = user.email || ''; // Default to empty string if email is null/undefined
    const searchText = `${name} ${email}`.toLowerCase(); // Combine and lowercase safely
    return searchText.includes(searchQuery.toLowerCase());
  });

  return (
    <section className="manage-section">
      <h2>Manage Users</h2>
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th className="actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name || 'N/A'}</td>
                <td>{user.email || 'N/A'}</td>
                <td>{user.is_admin ? 'Admin' : 'User'}</td>
                <td className="actions">
                  <div className="table-actions">
                    {!user.is_admin && (
                      <button onClick={() => makeAdmin(user.id)} className="cta-button warning sm">
                        Make Admin
                      </button>
                    )}
                    <button onClick={() => deleteUser(user.id)} className="cta-button danger sm">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5">No users found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
};

export default ManageUsers;