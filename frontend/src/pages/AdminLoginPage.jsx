import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
// Use the same stylesheet as the user SignIn to match card/form styles
import '../styles/SignIn.css';

const AdminLoginPage = () => {
  const { adminLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('admin_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRemember(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await adminLogin(email, password);
      console.log('Admin login successful:', res);

      if (remember) {
        localStorage.setItem('admin_email', email);
      } else {
        localStorage.removeItem('admin_email');
      }

      toast.success('Admin login successful!');
      navigate('/admin/dashboard'); // Redirect to admin dashboard
    } catch (err) {
      console.error('Admin login error:', err);
      const message = err?.response?.data?.detail || err.message || 'Failed to sign in as admin';
      toast.error(message);
      setPassword(''); // clear password for security
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-container">
      <div className="signin-card">
        <h2 className="signin-title">Admin Sign In</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              autoComplete="username"
            />
            {email && !/\S+@\S+\.\S+/.test(email) && (
              <div className="validation-hint">Enter a valid email address</div>
            )}
          </div>

          <div className="form-group password-group">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              autoComplete="current-password"
            />
            <span
              className="toggle-password"
              onClick={() => setShowPassword(prev => !prev)}
              role="button"
              tabIndex={0}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
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
          </div>

          <div className="form-options">
            <label className="remember-checkbox">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                disabled={loading}
              />
              <span>Remember me</span>
            </label>
            <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
          </div>

          <button 
            type="submit" 
            className="signin-btn"
            disabled={loading || !email || !password}
          >
            {loading ? <span className="spinner"></span> : 'Sign In as Admin'}
          </button>
        </form>

        <div className="login-divider">
          <div className="divider-line"></div>
          <span>or</span>
          <div className="divider-line"></div>
        </div>

        <div className="admin-link">
          <Link to="/login">User Login</Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
