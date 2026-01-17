import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService'; // Fixed import path
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  const register = async (name, email, password) => {
    try {
      const response = await api.post('/register', { name, email, password });
      const data = response.data;

      // Don't auto-login after registration - user needs to verify email first
      // localStorage.setItem('token', data.access_token);
      // setIsAuthenticated(true);
      // setUser(data.user);

      return data;
    } catch (error) {
      if (error.message.includes('Network error')) {
        toast.error(error.message, {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: 'dark',
        });
      }
      console.error('Registration error:', error);
      throw error;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      const checkAuthAndAdmin = async () => {
        try {
          const userProfile = await authService.getCurrentUser();
          console.log("User profile:", userProfile);
          setUser(userProfile);
          try {
            const adminResponse = await authService.getCurrentAdmin();
            console.log("Admin check:", adminResponse);
            setIsAdmin(true);
          } catch (error) {
            console.log("Not an admin:", error.message);
            setIsAdmin(false);
          }
        } catch (error) {
          console.log("Auth check error:", error.message);
          if (
            error.message.includes("Token expired") ||
            error.message.includes("invalid") ||
            error.message.includes("No token found")
          ) {
            logout();
            navigate('/signin');
          } else if (error.message.includes('Network error')) {
            toast.error(error.message, {
              position: "top-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              theme: "dark",
            });
          }
        } finally {
          setLoading(false);
        }
      };
      checkAuthAndAdmin();
    } else {
      setLoading(false);
    }
  }, [navigate]);

  const login = async (email, password) => {
    try {
      const res = await authService.login(email, password);
      localStorage.setItem('token', res.access_token);
      setIsAuthenticated(true);
      setUser(res.user || null);
      // Check if user is admin
      try {
        await authService.getCurrentAdmin();
        setIsAdmin(true);
      } catch {
        setIsAdmin(false);
      }
      return res;
    } catch (error) {
      if (error.message.includes('Network error')) {
        toast.error(error.message, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "dark",
        });
      }
      console.error('Login error:', error);
      throw error;
    }
  };

  const adminLogin = async (email, password) => {
    try {
      const res = await authService.adminLogin(email, password);
      localStorage.setItem('token', res.access_token);
      setIsAuthenticated(true);
      setUser(res.user || null);
      setIsAdmin(true); // Admin login automatically sets admin status
      return res;
    } catch (error) {
      // Check if error is about unverified email
      if (error.message && error.message.includes('verify your email')) {
        // Store email for verification page
        sessionStorage.setItem('unverifiedEmail', email);
        // Redirect to verification page instead of showing error
        navigate('/verify-email');
        throw new Error('Please verify your email address');
      }
      
      if (error.message.includes('Network error')) {
        toast.error(error.message, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "dark",
        });
      }
      console.error('Admin login error:', error);
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    localStorage.removeItem('token'); // Explicitly clear token
    setIsAuthenticated(false);
    setUser(null);
    setIsAdmin(false);
    navigate('/signin');
    console.log('Logged out, state cleared');
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Add cache-busting query param
        const userProfile = await authService.getCurrentUser({
          headers: { 'Cache-Control': 'no-cache' },
        });
        console.log('User profile fetched:', userProfile);
        setUser(userProfile);
        setIsAuthenticated(true);

        try {
          await authService.getCurrentAdmin({
            headers: { 'Cache-Control': 'no-cache' },
          });
          console.log('Admin check: success');
          setIsAdmin(true);
        } catch (error) {
          console.log('Not an admin:', error.message);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Auth check error:', error.message);
        if (
          error.message.includes('Token expired') ||
          error.message.includes('invalid') ||
          error.message.includes('No token found')
        ) {
          logout();
        } else if (error.message.includes('Network error')) {
          toast.error(error.message, {
            position: 'top-right',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: 'dark',
          });
        }
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []); // Removed navigate from deps to avoid re-running

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        isAuthenticated,
        isAdmin,
        login,
        adminLogin,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);