import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import { toast } from 'react-toastify';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/ProfilePage.css';

const ProfilePage = () => {
  const { user, setUser, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [blogs, setBlogs] = useState([]);
  const [settingsForm, setSettingsForm] = useState({
    email: user?.email || '',
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const profile = await userService.getProfile();
        const statsData = await userService.getStats();
        setUser(profile);
        setStats(statsData);
        setSettingsForm((prev) => ({ ...prev, email: profile.email }));

        if (isAuthenticated) {
          const token = localStorage.getItem('token');
          const response = await axios.get('http://localhost:8000/profile/my-blogs', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setBlogs(response.data);
        }
      } catch (err) {
        setError('Failed to load profile data');
        toast.error(err.message || 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [setUser, isAuthenticated]);

  const validateForm = () => {
    const errors = {};
    if (activeTab === 'settings') {
      if (!settingsForm.email || !/\S+@\S+\.\S+/.test(settingsForm.email)) {
        errors.email = 'A valid email is required';
      }
      if (settingsForm.oldPassword || settingsForm.newPassword || settingsForm.confirmNewPassword) {
        if (!settingsForm.oldPassword) {
          errors.oldPassword = 'Old password is required';
        }
        if (!settingsForm.newPassword) {
          errors.newPassword = 'New password is required';
        } else if (settingsForm.newPassword.length < 6) {
          errors.newPassword = 'New password must be at least 6 characters';
        }
        if (settingsForm.newPassword !== settingsForm.confirmNewPassword) {
          errors.confirmNewPassword = 'Passwords do not match';
        }
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const response = await userService.updateEmail({ email: settingsForm.email });
      setUser((prev) => ({ ...prev, email: settingsForm.email }));
      localStorage.setItem('token', response.access_token);
      toast.success('Email updated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update email');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await userService.updatePassword({
        old_password: settingsForm.oldPassword,
        new_password: settingsForm.newPassword,
      });
      toast.success('Password updated successfully');
      setSettingsForm((prev) => ({
        ...prev,
        oldPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      }));
    } catch (err) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? All progress and blogs will be permanently removed.')) return;
    setIsSubmitting(true);
    try {
      await userService.deleteAccount();
      logout();
      toast.success('Account deleted successfully');
      navigate('/signin');
    } catch (err) {
      toast.error(err.message || 'Failed to delete account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettingsForm((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleViewProgress = () => {
    navigate('/my-progress');
  };

  if (loading) return <div className="profile-loading">Loading profile...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-info">
          <h1>{user?.name || 'User'}</h1>
          <p className="email">{user?.email}</p>
        </div>
      </div>

      <div className="profile-tabs">
        <button className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
        <button className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>Settings</button>
        <button className={`tab-button ${activeTab === 'blogs' ? 'active' : ''}`} onClick={() => setActiveTab('blogs')}>My Blogs</button>
      </div>

      <div className="profile-content">
        {activeTab === 'dashboard' && (
          <>
            <section className="stats-section">
              <div className="stats-header">
                <h2>Your Progress</h2>
                <button className="view-progress-button" onClick={handleViewProgress}>View Detailed Progress</button>
              </div>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Problems Solved</h3>
                  <p className="stat-value">{stats?.solved_problems ?? 0}</p>
                </div>
                <div className="stat-card">
                  <h3>Total Problems</h3>
                  <p className="stat-value">{stats?.total_problems ?? 0}</p>
                </div>
                <div className="stat-card">
                  <h3>Completion Rate</h3>
                  <p className="stat-value">{stats?.completion_rate ?? 0}%</p>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${stats?.completion_rate ?? 0}%` }}></div>
                  </div>
                </div>
                {stats?.by_difficulty && ['easy', 'medium', 'hard'].map(level => (
                  <div key={level} className="stat-card">
                    <h3>{level.charAt(0).toUpperCase() + level.slice(1)} Problems</h3>
                    <p className="stat-value">
                      {stats.by_difficulty[level]?.completed ?? 0}/{stats.by_difficulty[level]?.total ?? 0}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="recent-activity">
              <h2>Recent Activity</h2>
              <div className="activity-list">
                {stats?.recent_completions?.length > 0 ? (
                  <ul className="activity-items">
                    {stats.recent_completions.map((item, index) => (
                      <li key={index} className="activity-item">
                        <span className="activity-name">{item.algorithm_name}</span>
                        <span className={`difficulty ${item.difficulty.toLowerCase()}`}>{item.difficulty}</span>
                        <span className="activity-date">{new Date(item.completed_at).toLocaleDateString()}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-activity">No recent activity to show</p>
                )}
              </div>
            </section>
          </>
        )}

        {activeTab === 'settings' && (
          <section className="settings-section">
            <h2>Account Settings</h2>
            <div className="settings-form">
              <form onSubmit={handleUpdateEmail} className="form-group">
                <h3>Update Email</h3>
                <div className="form-field">
                  <label htmlFor="email">Email</label>
                  <input type="email" id="email" name="email" value={settingsForm.email} onChange={handleInputChange} placeholder="Enter your new email" />
                  {formErrors.email && <p className="error-text">{formErrors.email}</p>}
                </div>
                <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Updating...' : 'Update Email'}</button>
              </form>

              <form onSubmit={handleUpdatePassword} className="form-group">
                <h3>Update Password</h3>
                {['oldPassword', 'newPassword', 'confirmNewPassword'].map(field => (
                  <div className="form-field" key={field}>
                    <label htmlFor={field}>{field.replace(/([A-Z])/g, ' $1')}</label>
                    <input type="password" id={field} name={field} value={settingsForm[field]} onChange={handleInputChange} placeholder={`Enter your ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`} />
                    {formErrors[field] && <p className="error-text">{formErrors[field]}</p>}
                  </div>
                ))}
                <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Updating...' : 'Update Password'}</button>
              </form>

              <div className="form-group danger-zone">
                <h2>Delete Account</h2>
                <p>Deleting your account is permanent and cannot be undone. All your progress and blogs will be removed.</p>
                <button className="delete-button" onClick={handleDeleteAccount} disabled={isSubmitting}>{isSubmitting ? 'Deleting...' : 'Delete Account'}</button>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'blogs' && (
          <section className="my-blogs-section">
            <h2>My Blogs</h2>
            <div className="blogs-list">
              {blogs.length === 0 ? (
                <p>You haven't created any blogs yet.</p>
              ) : (
                blogs.map((blog) => (
                  <div key={blog.id} className="blog-card">
                    <Link to={`/blogs/${blog.id}`} className="blog-title"><h3>{blog.title}</h3></Link>
                    <p className="blog-author">By {blog.author}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
