  // Local relative time formatter (no API changes)
  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date)) return '';
    const now = new Date();
    const diffMs = now - date;
    const sec = Math.floor(diffMs / 1000);
    if (sec < 5) return 'just now';
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day}d ago`;
    // Fallback to date + time for older entries
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import { authService } from '../services/authService';
import { userProgressService } from '../services/userProgressService';
import { toast } from 'react-toastify';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import api from '../services/api';
import CodeforcesAnalyzer from '../components/CodeforcesAnalyzer';
import ContestTracker from '../components/ContestTracker';
import '../styles/ProfilePage.css';

const ProfilePage = () => {
  const { user, setUser, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [blogs, setBlogs] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [settingsForm, setSettingsForm] = useState({
    email: user?.email || '',
    emailPassword: '',
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
    deletePassword: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [emailSectionOpen, setEmailSectionOpen] = useState(true);
  const [passwordSectionOpen, setPasswordSectionOpen] = useState(false);
  const [dangerSectionOpen, setDangerSectionOpen] = useState(false);
  const [myBlogsStatusFilter, setMyBlogsStatusFilter] = useState('approved'); // 'all' | 'approved' | 'unapproved'
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState('');

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const profile = await userService.getProfile();
        const statsData = await userService.getStats();
        setUser(profile);
        setStats(statsData);
        setSettingsForm((prev) => ({ ...prev, email: profile.email }));

        // Build robust recent activity list from multiple possible sources
        try {
          let recent = Array.isArray(statsData?.recent_completions)
            ? statsData.recent_completions
            : (Array.isArray(statsData?.recent_activities) ? statsData.recent_activities : []);

          if (!recent || recent.length === 0) {
            // Try detailed stats endpoint
            const detailed = await userProgressService.getDetailedStats().catch(() => null);
            if (detailed) {
              recent = detailed.recent || detailed.recent_completions || detailed.activities || [];
            }
          }

          if (!recent || recent.length === 0) {
            // Fallback: derive from all progress entries
            const allProgress = await userProgressService.getAllProgress().catch(() => []);
            recent = (allProgress || [])
              .filter(Boolean)
              .sort((a, b) => new Date(b.completed_at || b.updated_at || b.last_accessed_at || 0) - new Date(a.completed_at || a.updated_at || a.last_accessed_at || 0))
              .slice(0, 8)
              .map(p => ({
                algorithm_id: p.algo_id || p.algorithm_id || p.id || p.algorithm?.id,
                algorithm_name: p.algorithm_name || p.name || p.algorithm?.name,
                difficulty: p.difficulty || p.algorithm_difficulty || p.algorithm?.difficulty,
                completed_at: p.completed_at || p.updated_at || p.last_accessed_at,
              }));
          }

          // Normalize shape
          const normalized = (recent || []).map(item => ({
            id: item.algorithm_id || item.algo_id || item.id || item.algorithm?.id,
            name: item.algorithm_name || item.name || item.title,
            difficulty: (item.difficulty || item.difficulty_level || '').toString(),
            date: item.completed_at || item.updated_at || item.last_accessed_at || item.date,
          })).filter(r => r.name);

          setRecentActivity(normalized);
        } catch (_) {
          setRecentActivity([]);
        }

        if (isAuthenticated) {
          const params = {};
          if (myBlogsStatusFilter !== 'all') {
            params.status_filter = myBlogsStatusFilter;
          }
          const response = await api.get('/profile/my-blogs', { params });
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
  }, [setUser, isAuthenticated, myBlogsStatusFilter]);

  const validateForm = () => {
    const errors = {};
    if (activeTab === 'settings') {
      if (!settingsForm.email || !/\S+@\S+\.\S+/.test(settingsForm.email)) {
        errors.email = 'Please enter a valid email address';
      }
      // Require current password to re-authenticate before changing email
      if (!settingsForm.emailPassword) {
        errors.emailPassword = 'Please enter your current password to confirm email change';
      }
      if (settingsForm.oldPassword || settingsForm.newPassword || settingsForm.confirmNewPassword) {
        if (!settingsForm.oldPassword) {
          errors.oldPassword = 'Please enter your old password';
        }
        if (!settingsForm.newPassword) {
          errors.newPassword = 'Please enter a new password';
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

  const handleSendEmailOtp = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    // Frontend guard: avoid server call if email hasn't changed
    const newEmail = (settingsForm.email || '').trim().toLowerCase();
    const currentEmail = (user?.email || '').trim().toLowerCase();
    if (newEmail && currentEmail && newEmail === currentEmail) {
      toast.info('New email is the same as your current email');
      return;
    }
    setIsSubmitting(true);
    try {
      // Re-authenticate with current credentials before updating email
      await authService.login(user?.email, settingsForm.emailPassword);
      // Try OTP request flow if backend supports it
      await userService.requestEmailOtp({ email: settingsForm.email });
      setEmailOtpSent(true);
      toast.info('Verification code sent to your new email. Please enter the OTP to confirm.');
    } catch (error) {
      // Fallback to immediate update if OTP endpoints are not available
      try {
        const response = await userService.updateEmail({ email: settingsForm.email });
        setUser((prev) => ({ ...prev, email: settingsForm.email }));
        toast.success('Email updated successfully');
        setSettingsForm((prev) => ({ ...prev, emailPassword: '' }));
        setEmailOtpSent(false);
        setEmailOtpCode('');
      } catch (fallbackErr) {
        console.error('Error updating email:', fallbackErr);
        toast.error(fallbackErr.message || 'Failed to update email. Please verify your current password.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyEmailOtp = async (e) => {
    e.preventDefault();
    if (!emailOtpCode) {
      toast.error('Please enter the OTP code sent to your email');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await userService.verifyEmailOtp({ email: settingsForm.email, otp: emailOtpCode });
      setUser((prev) => ({ ...prev, email: settingsForm.email }));
      toast.success('Email verified and updated successfully');
      setSettingsForm((prev) => ({ ...prev, emailPassword: '' }));
      setEmailOtpSent(false);
      setEmailOtpCode('');
    } catch (err) {
      toast.error(err.message || 'Failed to verify OTP');
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
    if (!settingsForm.deletePassword) {
      toast.error('Please enter your current password to confirm deletion');
      return;
    }
    if (!window.confirm('Are you sure you want to delete your account? All progress and blogs will be permanently removed.')) return;
    setIsSubmitting(true);
    try {
      // Re-authenticate before allowing deletion
      await authService.login(user?.email, settingsForm.deletePassword);
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
        <button className={`tab-button ${activeTab === 'codeforces' ? 'active' : ''}`} onClick={() => setActiveTab('codeforces')}>CF Analytics</button>
        <button className={`tab-button ${activeTab === 'contests' ? 'active' : ''}`} onClick={() => setActiveTab('contests')}>Contests</button>
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
                  <h3>Topics Covered</h3>
                  <p className="stat-value">{stats?.solved_problems ?? 0}</p>
                </div>
                <div className="stat-card">
                  <h3>Total Topics</h3>
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
                    <h3>{level.charAt(0).toUpperCase() + level.slice(1)} Topics</h3>
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
                {recentActivity && recentActivity.length > 0 ? (
                  <ul className="activity-items">
                    {recentActivity.map((item, index) => {
                      const diff = (item.difficulty || '').toLowerCase();
                      const dateStr = item.date ? new Date(item.date).toLocaleDateString() : '';
                      const rel = formatRelativeTime(item.date);
                      return (
                        <li key={index} className="activity-item">
                          {item.id ? (
                            <Link className="activity-name" to={`/algorithms/${item.id}`}>{item.name}</Link>
                          ) : (
                            <span className="activity-name">{item.name}</span>
                          )}
                          {diff && <span className={`difficulty ${diff}`}>{diff.charAt(0).toUpperCase() + diff.slice(1)}</span>}
                          <span className="activity-date">{rel || dateStr}</span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="no-activity">No recent activity to show</p>
                )}
              </div>
            </section>

          </>
        )}

        {activeTab === 'codeforces' && (
          <section className="codeforces-section">
            <CodeforcesAnalyzer />
          </section>
        )}

        {activeTab === 'contests' && (
          <section className="contests-section">
            <ContestTracker />
          </section>
        )}

        {activeTab === 'settings' && (
          <section className="settings-section">
            <h2>Account Settings</h2>
            <div className="settings-form">
              {/* Update Email - Expandable */}
              <div className="form-group">
                <button type="button" className="btn-ghost" onClick={() => setEmailSectionOpen(v => !v)} aria-expanded={emailSectionOpen} style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontWeight: 600 }}>Update Email</span>
                  <span>{emailSectionOpen ? '▾' : '▸'}</span>
                </button>
                {emailSectionOpen && (
                  <form onSubmit={emailOtpSent ? handleVerifyEmailOtp : handleSendEmailOtp} className="form-inner">
                    <div className="form-field">
                      <label htmlFor="email">New Email</label>
                      <input className="input" type="email" id="email" name="email" value={settingsForm.email} onChange={handleInputChange} placeholder="Enter your new email" />
                      {formErrors.email && <p className="error-text">{formErrors.email}</p>}
                    </div>
                    <div className="form-field password-group">
                      <label htmlFor="emailPassword">Current Password</label>
                      <input
                        className="input"
                        id="emailPassword"
                        type="password"
                        name="emailPassword"
                        value={settingsForm.emailPassword}
                        onChange={handleInputChange}
                        placeholder="Enter your current password to confirm"
                      />
                      {formErrors.emailPassword && <p className="error-text">{formErrors.emailPassword}</p>}
                    </div>
                    {emailOtpSent && (
                      <div className="form-field">
                        <label htmlFor="emailOtp">Email OTP</label>
                        <input
                          className="input"
                          id="emailOtp"
                          type="text"
                          name="emailOtp"
                          value={emailOtpCode}
                          onChange={(e) => setEmailOtpCode(e.target.value)}
                          placeholder="Enter the 6-digit code sent to your new email"
                        />
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button className="btn btn-white" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (emailOtpSent ? 'Verifying...' : 'Sending...') : (emailOtpSent ? 'Verify & Update Email' : 'Send Verification Code')}
                      </button>
                      {emailOtpSent && (
                        <button type="button" className="btn btn-ghost" onClick={() => { setEmailOtpSent(false); setEmailOtpCode(''); }} disabled={isSubmitting}>
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>

              {/* Update Password - Expandable */}
              <div className="form-group">
                <button type="button" className="btn-ghost" onClick={() => setPasswordSectionOpen(v => !v)} aria-expanded={passwordSectionOpen} style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontWeight: 600 }}>Update Password</span>
                  <span>{passwordSectionOpen ? '▾' : '▸'}</span>
                </button>
                {passwordSectionOpen && (
                  <form onSubmit={handleUpdatePassword} className="form-inner">
                  <div className="form-field password-group">
                    <label htmlFor="oldPassword">Old Password</label>
                    <input
                      className="input"
                      id="oldPassword"
                      type={showOldPassword ? 'text' : 'password'}
                      name="oldPassword"
                      value={settingsForm.oldPassword}
                      onChange={handleInputChange}
                      placeholder="Enter your old password"
                    />
                    <span
                      className="toggle-password"
                      onClick={() => setShowOldPassword(prev => !prev)}
                      role="button"
                      tabIndex={0}
                      aria-label={showOldPassword ? 'Hide old password' : 'Show old password'}
                    >
                      {showOldPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M10.58 10.58A3 3 0 0012 15a3 3 0 002.42-4.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M6.71 6.71C4.27 8.3 2.77 10.5 2 12c1.73 3.46 5.54 7 10 7 2.02 0 3.9-.6 5.5-1.61M9.88 4.14C10.56 4.05 11.27 4 12 4c4.46 0 8.27 3.54 10 7-.46.92-1.09 1.86-1.84 2.76" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
                        </svg>
                      )}
                    </span>
                    {formErrors.oldPassword && <p className="error-text">{formErrors.oldPassword}</p>}
                  </div>

                  <div className="form-field password-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      className="input"
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      name="newPassword"
                      value={settingsForm.newPassword}
                      onChange={handleInputChange}
                      placeholder="Enter your new password"
                    />
                    <span
                      className="toggle-password"
                      onClick={() => setShowNewPassword(prev => !prev)}
                      role="button"
                      tabIndex={0}
                      aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                    >
                      {showNewPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M10.58 10.58A3 3 0 0012 15a3 3 0 002.42-4.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M6.71 6.71C4.27 8.3 2.77 10.5 2 12c1.73 3.46 5.54 7 10 7 2.02 0 3.9-.6 5.5-1.61M9.88 4.14C10.56 4.05 11.27 4 12 4c4.46 0 8.27 3.54 10 7-.46.92-1.09 1.86-1.84 2.76" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
                        </svg>
                      )}
                    </span>
                    {formErrors.newPassword && <p className="error-text">{formErrors.newPassword}</p>}
                  </div>

                  <div className="form-field password-group">
                    <label htmlFor="confirmNewPassword">Confirm New Password</label>
                    <input
                      className="input"
                      id="confirmNewPassword"
                      type={showConfirmNewPassword ? 'text' : 'password'}
                      name="confirmNewPassword"
                      value={settingsForm.confirmNewPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm your new password"
                    />
                    <span
                      className="toggle-password"
                      onClick={() => setShowConfirmNewPassword(prev => !prev)}
                      role="button"
                      tabIndex={0}
                      aria-label={showConfirmNewPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmNewPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M10.58 10.58A3 3 0 0012 15a3 3 0 002.42-4.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M6.71 6.71C4.27 8.3 2.77 10.5 2 12c1.73 3.46 5.54 7 10 7 2.02 0 3.9-.6 5.5-1.61M9.88 4.14C10.56 4.05 11.27 4 12 4c4.46 0 8.27 3.54 10 7-.46.92-1.09 1.86-1.84 2.76" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
                        </svg>
                      )}
                    </span>
                    {formErrors.confirmNewPassword && <p className="error-text">{formErrors.confirmNewPassword}</p>}
                  </div>

                    <button className="btn btn-white" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Updating...' : 'Update Password'}</button>
                  </form>
                )}
              </div>

              {/* Danger Zone - Expandable */}
              <div className="form-group danger-zone">
                <button type="button" className="btn-ghost" onClick={() => setDangerSectionOpen(v => !v)} aria-expanded={dangerSectionOpen} style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontWeight: 600, color: 'var(--error, #ef4444)' }}>Danger Zone</span>
                  <span>{dangerSectionOpen ? '▾' : '▸'}</span>
                </button>
                {dangerSectionOpen && (
                  <div className="form-inner">
                    <h2>Delete Account</h2>
                    <p>Deleting your account is permanent and cannot be undone. All your progress and blogs will be removed.</p>
                    <div className="form-field">
                      <label htmlFor="deletePassword">Current Password</label>
                      <input
                        className="input"
                        id="deletePassword"
                        type="password"
                        name="deletePassword"
                        value={settingsForm.deletePassword}
                        onChange={handleInputChange}
                        placeholder="Enter your current password to confirm deletion"
                      />
                    </div>
                    <button className="btn btn-white" onClick={handleDeleteAccount} disabled={isSubmitting}>{isSubmitting ? 'Deleting...' : 'Delete Account'}</button>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'blogs' && (
          <section className="my-blogs-section">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ margin: 0 }}>My Blogs</h2>
              <div className="segmented-buttons">
                <button
                  className={`segmented-button ${myBlogsStatusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setMyBlogsStatusFilter('all')}
                >
                  All
                </button>
                <button
                  className={`segmented-button ${myBlogsStatusFilter === 'approved' ? 'active' : ''}`}
                  onClick={() => setMyBlogsStatusFilter('approved')}
                >
                  Approved
                </button>
                <button
                  className={`segmented-button ${myBlogsStatusFilter === 'unapproved' ? 'active' : ''}`}
                  onClick={() => setMyBlogsStatusFilter('unapproved')}
                >
                  Pending
                </button>
              </div>
            </div>
            <div className="blogs-list">
              {blogs.length === 0 ? (
                <p>
                  {myBlogsStatusFilter === 'all'
                    ? "You haven't created any blogs yet."
                    : myBlogsStatusFilter === 'approved'
                      ? "You don't have any approved blogs."
                      : "You don't have any pending blogs."}
                </p>
              ) : (
                blogs.map((blog) => (
                  <div key={blog.id} className="blog-card">
                    <Link to={`/blogs/${blog.id}`} className="blog-title"><h3>{blog.title}</h3></Link>
                    <p className="blog-author">By {blog.author}</p>
                    {blog.status && (
                      <p className="blog-status" style={{ marginTop: '6px' }}>
                        Status: <strong>{String(blog.status).toUpperCase()}</strong>
                      </p>
                    )}
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