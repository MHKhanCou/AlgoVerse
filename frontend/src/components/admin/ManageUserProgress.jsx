import React from 'react';
import { toast } from 'react-toastify';

const ManageUserProgress = ({ userProgress, users, algorithms, searchQuery, fetchUserProgress, adminService }) => {
  const deleteProgress = async (progressId) => {
    if (window.confirm('Are you sure you want to delete this progress?')) {
      try {
        await adminService.deleteProgress(progressId);
        await fetchUserProgress();
        toast.success('Progress deleted');
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Failed to delete progress');
      }
    }
  };

  const deleteUserProgress = async (userId) => {
    if (window.confirm('Delete all progress for this user?')) {
      try {
        await adminService.deleteUserProgress(userId);
        await fetchUserProgress();
        toast.success('User progress deleted');
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Failed to delete user progress');
      }
    }
  };

  const filteredProgress = userProgress.filter((progress) => {
    const user = users.find((u) => u.id === progress.user_id);
    const algo = algorithms.find((a) => a.id === progress.algo_id);
    return (
      (user?.name || user?.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (algo?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <section className="manage-section">
      <h2>Manage User Progress</h2>
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>User</th>
            <th>Algorithm</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredProgress.length > 0 ? (
            filteredProgress.map((progress) => {
              const user = users.find((u) => u.id === progress.user_id);
              const algo = algorithms.find((a) => a.id === progress.algo_id);
              return (
                <tr key={progress.id}>
                  <td>{progress.id}</td>
                  <td>{user?.name || user?.email || 'Unknown'}</td>
                  <td>{algo?.name || 'Unknown'}</td>
                  <td>{progress.status}</td>
                  <td>
                    <button onClick={() => deleteProgress(progress.id)} className="action-btn delete">
                      Delete
                    </button>
                    <button onClick={() => deleteUserProgress(progress.user_id)} className="action-btn delete">
                      Delete All for User
                    </button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="5">No progress found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
};

export default ManageUserProgress;