import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import '../styles/EmailVerification.css';

const EmailVerificationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error, resend
  const [message, setMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState('');
  const [showOptions, setShowOptions] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    // Get email from sessionStorage (set by login when user is unverified)
    const unverifiedEmail = sessionStorage.getItem('unverifiedEmail');
    if (unverifiedEmail) {
      setEmail(unverifiedEmail);
      sessionStorage.removeItem('unverifiedEmail'); // Clear after using
    }
    
    if (token) {
      verifyEmail(token);
    } else {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
    }
  }, [token]);

  const verifyEmail = async (verificationToken) => {
    try {
      const response = await api.post('/verify-email', {
        token: verificationToken
      });

      if (response.data.success) {
        setStatus('success');
        setMessage(response.data.message);
        toast.success('Email verified successfully!');
        
        // Clear any stored unverified email
        sessionStorage.removeItem('unverifiedEmail');
        
        // Redirect to home page after successful verification
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.detail || 'Verification failed. The link may have expired.');
      setShowOptions(true);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      toast.error('No email address found. Please try logging in again.');
      return;
    }

    setIsResending(true);
    try {
      const response = await api.post('/resend-verification', { email });
      
      if (response.data.success) {
        setStatus('resend');
        setMessage('New verification email sent! Please check your inbox.');
        toast.success('Verification email resent successfully!');
        
        // Store email for OTP verification page
        sessionStorage.setItem('registeredEmail', email);
        
        // Redirect to OTP verification after a delay
        setTimeout(() => {
          navigate('/verify-otp');
        }, 2000);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyWithCode = () => {
    if (!email) {
      toast.error('No email address found. Please try logging in again.');
      return;
    }
    
    sessionStorage.setItem('registeredEmail', email);
    navigate('/verify-otp');
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
            
            {showOptions && (
              <div className="verification-options">
                <h3>Need a new verification?</h3>
                <div className="options-grid">
                  <button 
                    onClick={handleResendEmail}
                    disabled={isResending}
                    className="option-btn resend-btn"
                  >
                    {isResending ? (
                      <>
                        <span className="spinner-small"></span>
                        Sending...
                      </>
                    ) : (
                      'Resend Verification Email'
                    )}
                  </button>
                  
                  <button 
                    onClick={handleVerifyWithCode}
                    className="option-btn code-btn"
                  >
                    Verify with Code
                  </button>
                </div>
                
                <div className="help-text">
                  <p><strong>Options:</strong></p>
                  <ul>
                    <li>Get a new verification link sent to your email</li>
                    <li>Use a 6-digit verification code instead</li>
                    <li>Check your spam folder for missing emails</li>
                  </ul>
                </div>
              </div>
            )}

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
