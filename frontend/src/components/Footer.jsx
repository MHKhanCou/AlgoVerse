import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p className="footer-brand">© 2025 AlgoVerse. All rights reserved.</p>
        <div className="footer-links">
          <Link to="/" className="footer-link">Home</Link>
          <Link to="/algorithms" className="footer-link">Algorithms</Link>
          <a href="https://www.linkedin.com/in/mehedi-hasan-khan-00a536245/" className="footer-link" target="_blank" rel="noopener noreferrer">
            Contact
          </a>
          <a href="https://github.com/MhkhanCoU" className="footer-link" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;