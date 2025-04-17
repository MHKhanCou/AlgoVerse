import React, { useState } from 'react';
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

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
    document.documentElement.setAttribute('data-theme', darkMode ? 'light' : 'dark');
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
          <Route path="/algorithms" element={<Algorithms />} />
          <Route 
            path="/profile" 
            element={isAuthenticated ? <ProfilePage /> : <Navigate to="/signin" replace />}
          />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
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
