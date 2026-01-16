import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import '../styles/EmailVerification.css';

const EmailVerificationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
    }
  }, [token]);

  const verifyEmail = async (verificationToken) => {
    try {
      const response = await api.post('verify-email', {
        token: verificationToken
      });

      if (response.data.success) {
        setStatus('success');
        setMessage(response.data.message);
        toast.success('Email verified successfully!');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error) {
      setStatus('error');
      const errorMessage = error.response?.data?.detail || 'Email verification failed. The link may have expired.';
      setMessage(errorMessage);
      toast.error(errorMessage);
    }
  };

  const resendVerification = async () => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsResending(true);
    try {
      const response = await api.post('resend-verification', {
        email: email
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setMessage('New verification email sent! Please check your inbox.');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to resend verification email';
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <div className="verification-content">
            <div className="verification-icon verifying">
              <div className="spinner-large"></div>
            </div>
            <h2>Verifying Your Email...</h2>
            <p>Please wait while we verify your email address.</p>
          </div>
        );

      case 'success':
        return (
          <div className="verification-content">
            <div className="verification-icon success">
              ✅
            </div>
            <h2>Email Verified Successfully!</h2>
            <p>{message}</p>
            <p className="redirect-info">You'll be redirected to the login page in a few seconds...</p>
            <div className="action-buttons">
              <Link to="/login" className="btn-primary">
                Go to Login
              </Link>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="verification-content">
            <div className="verification-icon error">
              ❌
            </div>
            <h2>Verification Failed</h2>
            <p>{message}</p>
            
            <div className="resend-section">
              <h3>Need a new verification link?</h3>
              <div className="resend-form">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="email-input"
                />
                <button 
                  onClick={resendVerification}
                  disabled={isResending}
                  className="btn-secondary"
                >
                  {isResending ? (
                    <>
                      <span className="spinner"></span>
                      Sending...
                    </>
                  ) : (
                    'Resend Verification Email'
                  )}
                </button>
              </div>
            </div>

            <div className="action-buttons">
              <Link to="/signup" className="btn-secondary">
                Back to Sign Up
              </Link>
              <Link to="/login" className="btn-primary">
                Try Login
              </Link>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="email-verification-container">
      <div className="email-verification-card">
        <div className="brand-header">
          <h1>AlgoVerse</h1>
        </div>
        {renderContent()}
      </div>
    </div>
  );
};

export default EmailVerificationPage;
