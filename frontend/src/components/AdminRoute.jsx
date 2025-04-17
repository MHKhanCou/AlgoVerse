import React from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/authcontext';
import '../styles/AdminRoute.css';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) return <div className="loading">Checking Admin Access...</div>;

  if (!isAuthenticated) {
    toast.info("Please sign in to access the admin dashboard.", {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "dark",
    });
    return <Navigate to="/signin" replace />;
  }

  if (!isAdmin) {
    toast.error("You must be an admin to access this page.", {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "dark",
    });
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;