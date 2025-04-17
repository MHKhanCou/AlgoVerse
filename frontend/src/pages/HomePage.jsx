import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/HomePage.css';

const HomePage = () => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="home-container">
      <section className="hero-section">
        <h1>Welcome to AlgoVerse</h1>
        <p className="hero-subtitle">
          Master algorithms and data structures through interactive learning
        </p>
        <div className="cta-buttons">
          {!isAuthenticated ? (
            <>
              <Link to="/signin" className="cta-button primary">
                Get Started
              </Link>
              <Link to="/signup" className="cta-button secondary">
                Create Account
              </Link>
            </>
          ) : (
            <>
              <Link to="/algorithms" className="cta-button primary">
                Explore Algorithms
              </Link>
              <Link to="/blogs" className="cta-button primary">
                Explore Blogs
              </Link>
              <Link to="/profile" className="cta-button secondary">
                View Profile
              </Link>
              {isAdmin && (
                <Link to="/admin" className="cta-button tertiary">
                  Admin Dashboard
                </Link>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
