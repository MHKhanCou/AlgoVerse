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

def generate_token(length: int = 32) -> str:
    """Generate a secure random token"""
    return secrets.token_urlsafe(length)

def send_email(to_email: str, subject: str, html_body: str, text_body: Optional[str] = None) -> bool:
    """Send an email using SMTP"""
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

        # Create SMTP session
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
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

def send_verification_email(email: str, name: str, token: str) -> bool:
    """Send email verification"""
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

def send_password_reset_email(email: str, name: str, token: str) -> bool:
    """Send password reset email"""
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
