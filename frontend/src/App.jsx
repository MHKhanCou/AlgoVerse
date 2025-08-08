import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SearchProvider } from './contexts/SearchContext';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import SignInPage from './pages/SignInPage';
import ProfilePage from './pages/ProfilePage';
import SignUpPage from './pages/SignUpPage';
import Algorithms from './pages/Algorithms';
import NotFound from './pages/NotFound';
import './styles/App.css';
import './styles/GlobalTheme.css';
import Footer from './components/Footer';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import MyProgressPage
import MyProgressPage from './pages/MyProgressPage';
import SingleAlgorithm from './pages/SingleAlgorithm';
import AlgorithmTypePage from './pages/AlgorithmTypePage';
import AdminRoute from './components/AdminRoute';
import AdminDashboard from './pages/AdminDashboard';

// Import Blogs and SingleBlog components
import Blogs from './pages/Blogs';
import SingleBlog from './pages/SingleBlog';
import MyBlogs from './pages/MyBlogs';

// Import new authentication pages
import AdminLoginPage from './pages/AdminLoginPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import OTPVerificationPage from './pages/OTPVerificationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import OTPPasswordResetPage from './pages/OTPPasswordResetPage';

// Import TopicListPage and CodeforcesAnalytics
import TopicListPage from './pages/TopicListPage';
import CodeforcesAnalytics from './pages/CodeforcesAnalytics';

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    // Initialize from localStorage or default to false
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // Apply theme on mount and when darkMode changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  return (
    <div className={`app ${darkMode ? 'dark' : 'light'}`}>
      <Header 
        darkMode={darkMode} 
        toggleDarkMode={toggleDarkMode} 
        isLoggedIn={isAuthenticated} 
      />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/topics" element={<TopicListPage />} />
          <Route path="/codeforces" element={<CodeforcesAnalytics />} />
          <Route path="/algorithms" element={<Algorithms />} />
          <Route 
            path="/profile" 
            element={isAuthenticated ? <ProfilePage /> : <Navigate to="/login" replace />}
          />
          {/* Updated route paths */}
          <Route path="/login" element={<SignInPage />} />
          <Route path="/signin" element={<Navigate to="/login" replace />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/verify-email" element={<EmailVerificationPage />} />
          <Route path="/verify-otp" element={<OTPVerificationPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/reset-password-otp" element={<OTPPasswordResetPage />} />
          
          <Route path="/algorithms/:id" element={<SingleAlgorithm />} />
          <Route path="/algorithms/type/:typeId" element={<AlgorithmTypePage />} />
          <Route path="/my-progress" element={<MyProgressPage />} />
          <Route path="/admin/*" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          <Route path="/blogs" element={<Blogs />} />
          <Route path="/blogs/:id" element={<SingleBlog />} />
          <Route path="/my-blogs" element={<MyBlogs />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router> {/* Wrap Router above AuthProvider */}
      <AuthProvider>
        <SearchProvider>
          <AppRoutes />
          <ToastContainer 
            position="top-right" 
            autoClose={3000} 
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
          />
        </SearchProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;