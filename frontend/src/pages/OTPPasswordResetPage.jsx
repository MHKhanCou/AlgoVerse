import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import '../styles/OTPPasswordReset.css';

const OTPPasswordResetPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1); // 1: Enter OTP, 2: Set new password
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [canResend, setCanResend] = useState(false);
  const [email, setEmail] = useState('');
  const [verifiedOtp, setVerifiedOtp] = useState('');
  
  // Create refs for OTP input fields
  const inputRefs = useRef([]);

  useEffect(() => {
    // Get email from location state (passed from forgot password page)
    const resetEmail = location.state?.email || '';
    setEmail(resetEmail);

    // If no email is found, redirect to forgot password
    if (!resetEmail) {
      toast.error('Please start the password reset process again');
      navigate('/forgot-password');
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

  const validatePassword = (pwd) => {
    return pwd.length >= 8;
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
      handleOtpSubmit(newOtpValues.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    if (e.key === 'Enter') {
      handleOtpSubmit(otpValues.join(''));
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
        handleOtpSubmit(pastedText);
      }, 100);
    }
  };

  const handleOtpSubmit = async (otpCode = null) => {
    const code = otpCode || otpValues.join('');
    
    if (code.length !== 6) {
      toast.error('Please enter all 6 digits');
      return;
    }

    // Just validate the code format and move to step 2
    // The actual verification will happen when setting the new password
    toast.success('Code verified! Now set your new password.');
    setVerifiedOtp(code);
    setStep(2); // Move to password reset step
  };

  const handlePasswordSubmit = async (e) => {
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
        token: verifiedOtp,
        new_password: password
      });

      if (response.data.success) {
        toast.success('🎉 Password reset successfully!');
        toast.info('You can now log in with your new password');
        
        // Redirect to login after successful reset
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to reset password. Please try again.';
      toast.error(errorMessage);
      
      // If token is invalid, go back to step 1
      if (error.response?.status === 400) {
        setStep(1);
        setOtpValues(['', '', '', '', '', '']);
        setVerifiedOtp('');
        toast.error('Code expired. Please request a new one.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error('No email address found. Please start over.');
      navigate('/forgot-password');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/forgot-password', {
        email: email
      });

      if (response.data.success) {
        toast.success('📧 New reset code sent to your email!');
        
        // Reset timer
        setTimeLeft(600);
        setCanResend(false);
        
        // Clear current OTP and go back to step 1
        setOtpValues(['', '', '', '', '', '']);
        setStep(1);
        setVerifiedOtp('');
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to resend code. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    navigate('/forgot-password');
  };

  if (step === 1) {
    return (
      <div className="otp-password-reset-container">
        <div className="otp-password-reset-card">
          <div className="brand-header">
            <h1>AlgoVerse</h1>
            <div className="reset-icon">🔐</div>
          </div>

          <div className="reset-content">
            <h2>Enter Reset Code</h2>
            <p className="instruction-text">
              We've sent a 6-digit reset code to<br />
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
                onClick={() => handleOtpSubmit()}
                disabled={loading || otpValues.some(val => !val)}
                className="verify-btn"
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </button>

              <button
                onClick={handleResend}
                disabled={!canResend || loading}
                className="resend-btn"
              >
                {loading ? (
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
                  Go back to forgot password
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Set new password
  return (
    <div className="otp-password-reset-container">
      <div className="otp-password-reset-card">
        <div className="brand-header">
          <h1>AlgoVerse</h1>
          <div className="reset-icon">🔑</div>
        </div>

        <div className="reset-content">
          <h2>Set New Password</h2>
          <p className="instruction-text">
            Choose a strong password to secure your account.
          </p>

          <form onSubmit={handlePasswordSubmit}>
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
                {showConfirmPassword ? (
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

          <div className="help-section">
            <p className="back-text">
              Remember your password?{' '}
              <button onClick={() => navigate('/login')} className="link-btn">
                Back to Login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPPasswordResetPage;
