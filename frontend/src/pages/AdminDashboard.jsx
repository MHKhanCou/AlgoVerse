import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { adminService } from '../services/adminService';
import DashboardStats from '../components/admin/DashboardStats';
import ManageUsers from '../components/admin/ManageUsers';
import ManageAlgoTypes from '../components/admin/ManageAlgoTypes';
import ManageAlgorithms from '../components/admin/ManageAlgorithms';
import ManageUserProgress from '../components/admin/ManageUserProgress';
import ManageBlogs from '../components/admin/ManageBlogs';
import RelatedProblemsManager from '../components/admin/RelatedProblemsManager';
import Sidebar from '../components/admin/Sidebar';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [dashboardStats, setDashboardStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [algoTypes, setAlgoTypes] = useState([]);
  const [algorithms, setAlgorithms] = useState([]);
  const [userProgress, setUserProgress] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSectionChange = (section) => {
    setActiveSection(section);
    setSearchQuery('');
  };

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const data = await adminService.fetchDashboardStats();
      setDashboardStats(data);
    } catch (error) {
      toast.error(error.message, { theme: 'dark' });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.fetchUsers();
      const validUsers = Array.isArray(data)
        ? data.filter(user => user && typeof user === 'object')
        : [];
      setUsers(validUsers);
    } catch (error) {
      toast.error(error.message, { theme: 'dark' });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlgoTypes = async () => {
    try {
      setLoading(true);
      const data = await adminService.fetchAlgoTypes();
      const validAlgoTypes = Array.isArray(data)
        ? data.filter(type => type && typeof type === 'object')
        : [];
      setAlgoTypes(validAlgoTypes);
    } catch (error) {
      toast.error(error.message, { theme: 'dark' });
      setAlgoTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlgorithms = async () => {
    try {
      setLoading(true);
      const data = await adminService.fetchAlgorithms();
      const validAlgorithms = Array.isArray(data)
        ? data.filter(algo => algo && typeof algo === 'object')
        : [];
      setAlgorithms(validAlgorithms);
    } catch (error) {
      toast.error(error.message, { theme: 'dark' });
      setAlgorithms([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProgress = async () => {
    try {
      setLoading(true);
      const data = await adminService.fetchUserProgress();
      const validProgress = Array.isArray(data)
        ? data.filter(progress => progress && typeof progress === 'object')
        : [];
      setUserProgress(validProgress);
    } catch (error) {
      toast.error(error.message, { theme: 'dark' });
      setUserProgress([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const data = await adminService.fetchBlogs();
      console.log('Fetched blogs data:', data); // Debug log
      
      // Handle both array and object responses
      let blogList = [];
      if (Array.isArray(data)) {
        blogList = data.filter(blog => blog && typeof blog === 'object');
      } else if (data && typeof data === 'object') {
        // If the response is an object with a 'blogs' property
        if (data.blogs && Array.isArray(data.blogs)) {
          blogList = data.blogs.filter(blog => blog && typeof blog === 'object');
        } else if (data.items && Array.isArray(data.items)) {
          // If the response has an 'items' array
          blogList = data.items.filter(blog => blog && typeof blog === 'object');
        } else {
          // If it's a single blog object
          blogList = [data];
        }
      }
      
      console.log('Processed blogs:', blogList); // Debug log
      setBlogs(blogList);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      toast.error(error.response?.data?.detail || error.message || 'Failed to load blogs', { theme: 'dark' });
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadSectionData = async () => {
      try {
        setLoading(true);
        switch (activeSection) {
          case 'dashboard':
            await fetchDashboardStats();
            break;
          case 'users':
            await fetchUsers();
            break;
          case 'algo-types':
            await fetchAlgoTypes();
            break;
          case 'algorithms':
            await fetchAlgorithms();
            break;
          case 'progress':
            await fetchUserProgress();
            break;
          case 'blogs':
            await fetchBlogs();
            break;
          default:
            break;
        }
      } catch (error) {
        console.error(`Error loading ${activeSection} data:`, error);
        toast.error(`Failed to load ${activeSection} data: ${error.message}`, { theme: 'dark' });
      } finally {
        setLoading(false);
      }
    };

    loadSectionData();
  }, [activeSection]);

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>Admin Dashboard</h1>
        {activeSection !== 'dashboard' && (
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-bar"
          />
        )}
      </header>
      <div className="dashboard-container">
        <Sidebar activeSection={activeSection} setActiveSection={handleSectionChange} />
        <main className="dashboard-content">
          {loading && <div className="loading">Loading...</div>}
          {activeSection === 'dashboard' && <DashboardStats stats={dashboardStats} />}
          {activeSection === 'users' && (
            <ManageUsers
              users={users}
              searchQuery={searchQuery}
              fetchUsers={fetchUsers}
              adminService={adminService}
            />
          )}
          {activeSection === 'algo-types' && (
            <ManageAlgoTypes
              algoTypes={algoTypes}
              searchQuery={searchQuery}
              fetchAlgoTypes={fetchAlgoTypes}
              adminService={adminService}
            />
          )}
          {activeSection === 'algorithms' && (
            <ManageAlgorithms
              algorithms={algorithms}
              algoTypes={algoTypes}
              fetchAlgorithms={fetchAlgorithms}
              adminService={adminService}
            />
          )}
          {activeSection === 'blogs' && (
            <div className="section-container">
              {loading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading blogs...</p>
                </div>
              ) : (
                <ManageBlogs
                  blogs={blogs}
                  fetchBlogs={fetchBlogs}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  adminService={adminService}
                />
              )}
            </div>
          )}
          {activeSection === 'problems' && <RelatedProblemsManager />}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;