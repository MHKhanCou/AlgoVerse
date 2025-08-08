import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import '../styles/ForgotPassword.css';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/forgot-password', {
        email: email
      });

      if (response.data.success) {
        toast.success('📧 Reset code sent to your email!');
        toast.info('Please check your email for a 6-digit reset code', {
          autoClose: 5000
        });
        // Navigate to OTP password reset page with email
        navigate('/reset-password-otp', { state: { email: email } });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to send reset email. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="forgot-password-container">
        <div className="forgot-password-card">
          <div className="success-content">
            <div className="success-icon">✉️</div>
            <h2>Check Your Email</h2>
            <p>
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p>
              Click the link in the email to reset your password. If you don't see it, check your spam folder.
            </p>
            
            <div className="action-buttons">
              <Link to="/login" className="btn-primary">
                Back to Login
              </Link>
            </div>

            <div className="resend-info">
              <p>Didn't receive the email?</p>
              <button 
                onClick={() => setSubmitted(false)}
                className="resend-link"
              >
                Try again with a different email
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <div className="header">
          <div className="icon">🔐</div>
          <h2>Forgot Password?</h2>
          <p>No worries! Enter your email address and we'll send you a reset link.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              autoComplete="email"
            />
            {email && !/\S+@\S+\.\S+/.test(email) && (
              <div className="validation-hint">Enter a valid email address</div>
            )}
          </div>

          <button 
            type="submit" 
            className="reset-btn"
            disabled={loading || !email}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Sending Reset Link...
              </>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        <div className="footer-links">
          <p>
            Remember your password? <Link to="/login">Back to Login</Link>
          </p>
          <p>
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </p>
        </div>

        <div className="admin-link">
          <Link to="/admin/login">Admin Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
