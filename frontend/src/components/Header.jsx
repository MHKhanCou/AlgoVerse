import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSearch } from '../contexts/SearchContext';
import logo from './logo.png';
import '../styles/Header.css';

const Header = ({ darkMode, toggleDarkMode }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const { searchQuery, setSearchQuery } = useSearch();
  const location = useLocation();
  const isAdmin = isAuthenticated && user?.is_admin;

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    navigate('/signin');
  };

  const handleMenuClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleSearchChange = (e) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);

    if (!newQuery) return;

    const path = location.pathname;

    if (path.startsWith('/blogs')) {
      navigate('/blogs');
    } else if (path.startsWith('/algorithms')) {
      navigate('/algorithms');
    } else {
      // Default to algorithms if you're on homepage or elsewhere
      navigate('/algorithms');
    }
  };

  useEffect(() => {
    setSearchQuery('');
  }, [location.pathname, setSearchQuery]);

  const showSearchInput = location.pathname !== '/signin';

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo" onClick={closeMenu}>
          <img src={logo} alt="AlgoVerse Logo" className="logo-img" />
        </Link>

        <button
          className={`mobile-menu-btn ${isMenuOpen ? 'active' : ''}`}
          onClick={handleMenuClick}
          aria-label="Toggle navigation"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          {showSearchInput && (
            <div className="nav-search-wrapper">
              <button className="nav-search-icon" aria-label="Search">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21.53 20.47l-4.82-4.82a7 7 0 1 0-1.06 1.06l4.82 4.82a.75.75 0 0 0 1.06-1.06zM4 10a6 6 0 1 1 12 0A6 6 0 0 1 4 10z" />
                </svg>
              </button>
              <input
                className="nav-search"
                type="text"
                placeholder="Explore algorithms..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          )}

          <Link to="/topics" className="nav-link" onClick={closeMenu}>
            Topics
          </Link>
          <Link to="/algorithms" className="nav-link" onClick={closeMenu}>
            Algorithms
          </Link>
          <Link to="/blogs" className="nav-link" onClick={closeMenu}>
            Blogs
          </Link>

          {isAuthenticated && isAdmin && (
            <Link to="/admin" className="nav-link" onClick={closeMenu}>
              Admin Dashboard
            </Link>
          )}

          {isAuthenticated ? (
            <>
              <Link to="/profile" className="nav-icon" title="User Hub" onClick={closeMenu}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.5a5.5 5.5 0 0 1 5.5 5.5c0 2.2-1.3 4-3.3 4.9a5.5 5.5 0 0 1-4.4 0C7.8 11.9 6.5 10.1 6.5 8a5.5 5.5 0 0 1 5.5-5.5zm0 13c-3.6 0-10.5 1.8-10.5 5.5v2h21v-2c0-3.7-6.9-5.5-10.5-5.5z" />
                </svg>
              </Link>
              <button onClick={handleLogout} className="nav-icon" title="Exit">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
              </button>
            </>
          ) : (
            <Link to="/signin" className="nav-link" onClick={closeMenu}>
              Access
            </Link>
          )}

          <button
            className="theme-toggle"
            onClick={toggleDarkMode}
            aria-label="Toggle theme"
          >
            {darkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 16a4 4 0 0 0 0-8 4 4 0 0 0-4 4 4 4 0 0 0 4 4zm0 2a6 6 0 0 1-6-6 6 6 0 0 1 6-6 6 6 0 0 1 6 6 6 6 0 0 1-6 6zm0-14a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0V5a1 1 0 0 1 1-1zm0 14a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0v-2a1 1 0 0 1 1-1zm-7-7H3a1 1 0 0 1 0-2h2a1 1 0 0 1 0 2zm16 0h-2a1 1 0 0 1 0-2h2a1 1 0 0 1 0 2z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 18a6 6 0 0 1-6-6c0-1.5.6-3 1.5-4.1A6 6 0 0 1 12 6c1.5 0 3 .6 4.1 1.5A6 6 0 0 1 18 12a6 6 0 0 1-6 6zm0-14a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0V5a1 1 0 0 1 1-1zm0 14a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0v-2a1 1 0 0 1 1-1zm-7-7H3a1 1 0 0 1 0-2h2a1 1 0 0 1 0 2zm16 0h-2a1 1 0 0 1 0-2h2a1 1 0 0 1 0 2z" />
              </svg>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;