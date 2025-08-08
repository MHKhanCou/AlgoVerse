import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import '../styles/OTPVerification.css';

const OTPVerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [email, setEmail] = useState('');
  
  // Create refs for OTP input fields
  const inputRefs = useRef([]);

  useEffect(() => {
    // Get email from session storage or location state
    const registeredEmail = sessionStorage.getItem('registeredEmail') || location.state?.email || '';
    setEmail(registeredEmail);

    // If no email is found, redirect to signup
    if (!registeredEmail) {
      toast.error('Please register first to verify your email');
      navigate('/signup');
      return;
    }

    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, location.state]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (index, value) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newOtpValues = [...otpValues];
    newOtpValues[index] = value;
    setOtpValues(newOtpValues);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (index === 5 && value && newOtpValues.every(val => val)) {
      handleSubmit(newOtpValues.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    // Handle paste
    if (e.key === 'Enter') {
      handleSubmit(otpValues.join(''));
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (pastedText.length === 6) {
      const newOtpValues = pastedText.split('');
      setOtpValues(newOtpValues);
      inputRefs.current[5]?.focus();
      
      // Auto-submit after paste
      setTimeout(() => {
        handleSubmit(pastedText);
      }, 100);
    }
  };

  const handleSubmit = async (otpCode = null) => {
    const code = otpCode || otpValues.join('');
    
    if (code.length !== 6) {
      toast.error('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/verify-email', {
        token: code
      });

      if (response.data.success) {
        toast.success('🎉 Email verified successfully!');
        
        // Clear session data
        sessionStorage.removeItem('registeredEmail');
        sessionStorage.removeItem('showVerificationInfo');
        
        // Redirect to login with success message
        toast.info('You can now log in to your account');
        navigate('/login');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Verification failed. Please try again.';
      toast.error(errorMessage);
      
      // Clear OTP fields on error
      setOtpValues(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error('No email address found. Please register again.');
      navigate('/signup');
      return;
    }

    setResendLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/resend-verification', {
        email: email
      });

      if (response.data.success) {
        toast.success('📧 New verification code sent to your email!');
        
        // Reset timer
        setTimeLeft(600);
        setCanResend(false);
        
        // Clear current OTP
        setOtpValues(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to resend code. Please try again.';
      toast.error(errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  const goBack = () => {
    navigate('/signup');
  };

  return (
    <div className="otp-verification-container">
      <div className="otp-verification-card">
        <div className="brand-header">
          <h1>AlgoVerse</h1>
          <div className="verification-icon">📧</div>
        </div>

        <div className="verification-content">
          <h2>Verify Your Email</h2>
          <p className="instruction-text">
            We've sent a 6-digit verification code to<br />
            <strong>{email}</strong>
          </p>

          <div className="otp-input-container">
            {otpValues.map((value, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength="1"
                value={value}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="otp-input"
                disabled={loading}
                autoFocus={index === 0}
              />
            ))}
          </div>

          <div className="timer-section">
            {timeLeft > 0 ? (
              <p className="timer-text">
                Code expires in: <span className="timer">{formatTime(timeLeft)}</span>
              </p>
            ) : (
              <p className="expired-text">Code has expired</p>
            )}
          </div>

          <div className="action-buttons">
            <button
              onClick={() => handleSubmit()}
              disabled={loading || otpValues.some(val => !val)}
              className="verify-btn"
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Verifying...
                </>
              ) : (
                'Verify Email'
              )}
            </button>

            <button
              onClick={handleResend}
              disabled={!canResend || resendLoading}
              className="resend-btn"
            >
              {resendLoading ? (
                <>
                  <span className="spinner"></span>
                  Sending...
                </>
              ) : (
                canResend ? 'Resend Code' : `Resend in ${formatTime(timeLeft)}`
              )}
            </button>
          </div>

          <div className="help-section">
            <p className="help-text">
              Didn't receive the code? Check your spam folder or{' '}
              <button onClick={handleResend} className="link-btn" disabled={!canResend}>
                resend code
              </button>
            </p>
            
            <p className="back-text">
              Need to use a different email?{' '}
              <button onClick={goBack} className="link-btn">
                Go back to signup
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerificationPage;
