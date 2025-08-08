import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import '../styles/ResetPassword.css';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(true);
  
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setValidToken(false);
      toast.error('Invalid reset link. No token provided.');
    }
  }, [token]);

  const validatePassword = (pwd) => {
    return pwd.length >= 8;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePassword(password)) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/reset-password', {
        token: token,
        new_password: password
      });

      if (response.data.success) {
        toast.success(response.data.message);
        
        // Redirect to login after successful reset
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to reset password. Please try again.';
      toast.error(errorMessage);
      
      // If token is invalid/expired, show error state
      if (error.response?.status === 400) {
        setValidToken(false);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!validToken) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-card">
          <div className="error-content">
            <div className="error-icon">❌</div>
            <h2>Invalid Reset Link</h2>
            <p>
              This password reset link is invalid or has expired. 
              Password reset links expire after 30 minutes for security reasons.
            </p>
            
            <div className="action-buttons">
              <Link to="/forgot-password" className="btn-primary">
                Request New Reset Link
              </Link>
              <Link to="/login" className="btn-secondary">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        <div className="header">
          <div className="icon">🔑</div>
          <h2>Set New Password</h2>
          <p>Choose a strong password to secure your account.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group password-group">
            <label htmlFor="password">New Password</label>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              minLength={8}
            />
            <span
              className="toggle-password"
              onClick={() => setShowPassword(prev => !prev)}
              role="button"
              tabIndex={0}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '🙈' : '👁️'}
            </span>
            {password && !validatePassword(password) && (
              <div className="validation-hint">Password must be at least 8 characters long</div>
            )}
          </div>

          <div className="form-group password-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
            />
            <span
              className="toggle-password"
              onClick={() => setShowConfirmPassword(prev => !prev)}
              role="button"
              tabIndex={0}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? '🙈' : '👁️'}
            </span>
            {confirmPassword && password !== confirmPassword && (
              <div className="validation-hint">Passwords do not match</div>
            )}
          </div>

          <div className="password-requirements">
            <h4>Password Requirements:</h4>
            <ul>
              <li className={password.length >= 8 ? 'valid' : ''}>
                At least 8 characters long
              </li>
              <li className={/[A-Z]/.test(password) ? 'valid' : ''}>
                One uppercase letter (recommended)
              </li>
              <li className={/[a-z]/.test(password) ? 'valid' : ''}>
                One lowercase letter (recommended)
              </li>
              <li className={/\d/.test(password) ? 'valid' : ''}>
                One number (recommended)
              </li>
            </ul>
          </div>

          <button 
            type="submit" 
            className="reset-btn"
            disabled={loading || !password || !confirmPassword || password !== confirmPassword}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Updating Password...
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        <div className="footer-links">
          <p>
            Remember your password? <Link to="/login">Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
