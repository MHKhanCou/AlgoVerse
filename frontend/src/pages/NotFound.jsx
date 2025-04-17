import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/NotFound.css';

const NotFound = () => {
  return (
    <div className="not-found-container">
      <h1 className="not-found-title">404</h1>
      <p className="not-found-message">Oops! The page you're looking for doesn't exist.</p>
      <p className="not-found-submessage">The algorithm for finding this page failed.</p>
      <Link to="/" className="not-found-link">
        Return to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;