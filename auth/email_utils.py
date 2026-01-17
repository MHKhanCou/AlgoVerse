import smtplib
import secrets
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import os
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Email configuration - you should set these as environment variables
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "your-email@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "your-app-password")
FROM_EMAIL = os.getenv("FROM_EMAIL", "AlgoVerse <your-email@gmail.com>")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
DISABLE_EMAIL = os.getenv("DISABLE_EMAIL", "False").lower() == "true"

def generate_token(length: int = 32) -> str:
    """Generate a secure random token (legacy for internal use)"""
    return secrets.token_urlsafe(length)

def generate_otp(length: int = 6) -> str:
    """Generate a secure random OTP code"""
    # Generate a random number with specified length
    min_value = 10**(length-1)  # For 6 digits: 100000
    max_value = 10**length - 1   # For 6 digits: 999999
    
    return str(secrets.randbelow(max_value - min_value + 1) + min_value)

def send_email(to_email: str, subject: str, html_body: str, text_body: Optional[str] = None) -> bool:
    """Send an email using SMTP"""
    # Check if email is disabled for development
    if DISABLE_EMAIL:
        logger.info(f"Email disabled - would have sent '{subject}' to {to_email}")
        return True  # Return True to simulate successful sending
    
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = FROM_EMAIL
        msg["To"] = to_email

        # Add text version if provided
        if text_body:
            text_part = MIMEText(text_body, "plain")
            msg.attach(text_part)

        # Add HTML version
        html_part = MIMEText(html_body, "html")
        msg.attach(html_part)

        # Create SMTP session with timeout
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30)
        server.starttls()  # Enable security
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        
        # Send email
        server.send_message(msg)
        server.quit()
        
        logger.info(f"Email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False

def send_verification_otp_email(email: str, name: str, otp: str) -> bool:
    """Send email verification with OTP code"""
    subject = "Verify Your AlgoVerse Account - OTP Code"
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8f9fa;
            }}
            .container {{
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
            }}
            .header {{
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }}
            .content {{
                padding: 40px 30px;
                text-align: center;
            }}
            .otp-container {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 12px;
                margin: 30px 0;
                text-align: center;
            }}
            .otp-code {{
                font-size: 2.5rem;
                font-weight: 800;
                letter-spacing: 0.5rem;
                margin: 10px 0;
                font-family: 'Courier New', monospace;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }}
            .otp-label {{
                font-size: 0.9rem;
                opacity: 0.9;
                margin-bottom: 15px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }}
            .expiry-warning {{
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                color: #856404;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
                font-size: 0.9rem;
            }}
            .footer {{
                text-align: center;
                padding: 30px;
                color: #6c757d;
                font-size: 14px;
                border-top: 1px solid #e9ecef;
                background: #f8f9fa;
            }}
            .logo {{
                font-size: 1.8rem;
                font-weight: 700;
                margin-bottom: 10px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🚀 AlgoVerse</div>
                <h1>Email Verification</h1>
            </div>
            <div class="content">
                <h2>Hello {name}!</h2>
                <p>Welcome to AlgoVerse! Please use the verification code below to confirm your email address and complete your registration.</p>
                
                <div class="otp-container">
                    <div class="otp-label">Your Verification Code</div>
                    <div class="otp-code">{otp}</div>
                </div>
                
                <div class="expiry-warning">
                    <strong>⏰ Important:</strong> This verification code will expire in <strong>10 minutes</strong> for your security.
                </div>
                
                <p>Enter this code on the verification page to activate your account and start your algorithm learning journey!</p>
                
                <p style="color: #6b7280; font-size: 0.9rem; margin-top: 30px;">If you didn't create an account with AlgoVerse, please ignore this email.</p>
            </div>
            <div class="footer">
                <p>© 2024 AlgoVerse. All rights reserved.</p>
                <p>Happy Learning! 🎓</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text_body = f"""
    AlgoVerse - Email Verification
    
    Hello {name}!
    
    Welcome to AlgoVerse! Please use the verification code below to confirm your email address:
    
    Verification Code: {otp}
    
    ⏰ Important: This code will expire in 10 minutes.
    
    Enter this code on the verification page to activate your account.
    
    If you didn't create an account with AlgoVerse, please ignore this email.
    
    © 2024 AlgoVerse. All rights reserved.
    """
    
    return send_email(email, subject, html_body, text_body)

def send_verification_email(email: str, name: str, token: str) -> bool:
    """Send email verification (legacy - keeping for compatibility)"""
    verification_link = f"{FRONTEND_URL}/verify-email?token={token}"
    
    subject = "Verify Your AlgoVerse Account"
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 8px 8px 0 0;
            }}
            .content {{
                background: #f8f9fa;
                padding: 30px;
                border-radius: 0 0 8px 8px;
                border: 1px solid #e9ecef;
            }}
            .button {{
                display: inline-block;
                background: #667eea;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
                font-weight: bold;
            }}
            .footer {{
                text-align: center;
                padding: 20px;
                color: #6c757d;
                font-size: 14px;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Welcome to AlgoVerse! 🚀</h1>
        </div>
        <div class="content">
            <h2>Hello {name}!</h2>
            <p>Thank you for registering with AlgoVerse. To complete your account setup and start your algorithm learning journey, please verify your email address.</p>
            
            <div style="text-align: center;">
                <a href="{verification_link}" class="button">Verify Email Address</a>
            </div>
            
            <p><strong>This verification link will expire in 30 minutes.</strong></p>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">{verification_link}</p>
            
            <p>If you didn't create an account with AlgoVerse, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>© 2024 AlgoVerse. All rights reserved.</p>
        </div>
    </body>
    </html>
    """
    
    text_body = f"""
    Welcome to AlgoVerse!
    
    Hello {name}!
    
    Thank you for registering with AlgoVerse. To complete your account setup, please verify your email address by clicking the link below:
    
    {verification_link}
    
    This verification link will expire in 30 minutes.
    
    If you didn't create an account with AlgoVerse, please ignore this email.
    
    © 2024 AlgoVerse. All rights reserved.
    """
    
    return send_email(email, subject, html_body, text_body)

def send_password_reset_otp_email(email: str, name: str, otp: str) -> bool:
    """Send password reset email with OTP code"""
    subject = "Reset Your AlgoVerse Password - OTP Code"
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8f9fa;
            }}
            .container {{
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
            }}
            .header {{
                background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }}
            .content {{
                padding: 40px 30px;
                text-align: center;
            }}
            .otp-container {{
                background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                color: white;
                padding: 30px;
                border-radius: 12px;
                margin: 30px 0;
                text-align: center;
            }}
            .otp-code {{
                font-size: 2.5rem;
                font-weight: 800;
                letter-spacing: 0.5rem;
                margin: 10px 0;
                font-family: 'Courier New', monospace;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }}
            .otp-label {{
                font-size: 0.9rem;
                opacity: 0.9;
                margin-bottom: 15px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }}
            .expiry-warning {{
                background: #fef2f2;
                border: 1px solid #fecaca;
                color: #b91c1c;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                font-size: 0.9rem;
            }}
            .footer {{
                text-align: center;
                padding: 30px;
                color: #6c757d;
                font-size: 14px;
                border-top: 1px solid #e9ecef;
                background: #f8f9fa;
            }}
            .logo {{
                font-size: 1.8rem;
                font-weight: 700;
                margin-bottom: 10px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🔐 AlgoVerse</div>
                <h1>Password Reset</h1>
            </div>
            <div class="content">
                <h2>Hello {name}!</h2>
                <p>We received a request to reset your AlgoVerse account password. Please use the verification code below to proceed with resetting your password.</p>
                
                <div class="otp-container">
                    <div class="otp-label">Your Reset Code</div>
                    <div class="otp-code">{otp}</div>
                </div>
                
                <div class="expiry-warning">
                    <strong>⚠️ Security Notice:</strong> This password reset code will expire in <strong>10 minutes</strong> for your security.
                </div>
                
                <p>Enter this code on the password reset page to continue with setting your new password.</p>
                
                <p style="color: #b91c1c; font-weight: 500; margin-top: 30px;">If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
            </div>
            <div class="footer">
                <p>© 2024 AlgoVerse. All rights reserved.</p>
                <p>Stay Secure! 🔒</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text_body = f"""
    AlgoVerse - Password Reset
    
    Hello {name}!
    
    We received a request to reset your AlgoVerse account password. Please use the code below:
    
    Reset Code: {otp}
    
    ⚠️ Security Notice: This code will expire in 10 minutes.
    
    Enter this code on the password reset page to continue.
    
    If you didn't request a password reset, please ignore this email.
    
    © 2024 AlgoVerse. All rights reserved.
    """
    
    return send_email(email, subject, html_body, text_body)

def send_password_reset_email(email: str, name: str, token: str) -> bool:
    """Send password reset email (legacy - keeping for compatibility)"""
    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
    
    subject = "Reset Your AlgoVerse Password"
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 8px 8px 0 0;
            }}
            .content {{
                background: #f8f9fa;
                padding: 30px;
                border-radius: 0 0 8px 8px;
                border: 1px solid #e9ecef;
            }}
            .button {{
                display: inline-block;
                background: #dc3545;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
                font-weight: bold;
            }}
            .footer {{
                text-align: center;
                padding: 20px;
                color: #6c757d;
                font-size: 14px;
            }}
            .warning {{
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                color: #856404;
                padding: 15px;
                border-radius: 5px;
                margin: 15px 0;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Password Reset Request 🔐</h1>
        </div>
        <div class="content">
            <h2>Hello {name}!</h2>
            <p>We received a request to reset your AlgoVerse account password. Click the button below to set a new password:</p>
            
            <div style="text-align: center;">
                <a href="{reset_link}" class="button">Reset Password</a>
            </div>
            
            <div class="warning">
                <strong>⚠️ Security Notice:</strong> This password reset link will expire in 30 minutes for your security.
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #dc3545;">{reset_link}</p>
            
            <p><strong>If you didn't request a password reset, please ignore this email.</strong> Your password will remain unchanged.</p>
        </div>
        <div class="footer">
            <p>© 2024 AlgoVerse. All rights reserved.</p>
        </div>
    </body>
    </html>
    """
    
    text_body = f"""
    Password Reset Request
    
    Hello {name}!
    
    We received a request to reset your AlgoVerse account password. Click the link below to set a new password:
    
    {reset_link}
    
    ⚠️ Security Notice: This password reset link will expire in 30 minutes for your security.
    
    If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
    
    © 2024 AlgoVerse. All rights reserved.
    """
    
    return send_email(email, subject, html_body, text_body)

def get_token_expiry_time(minutes: int = 30) -> datetime:
    """Get token expiry time"""
    return datetime.utcnow() + timedelta(minutes=minutes)

def is_token_expired(expires_at: datetime) -> bool:
    """Check if token has expired"""
    return datetime.utcnow() > expires_at
