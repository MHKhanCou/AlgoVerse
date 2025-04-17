import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../styles/MyProgressPage.css';

const MyProgressPage = () => {
  const { user } = useAuth();
  const [progressData, setProgressData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        setLoading(true);
        const data = await userService.getMyProgress();
        const processedData = data.map((entry) => ({
          ...entry,
          status: entry.status || 'not started',
        }));
        console.log('Processed Progress Data:', processedData);
        setProgressData(processedData);
        setFilteredData(processedData);
      } catch (err) {
        console.error(err);
        setError('Failed to load progress data');
        toast.error('Failed to load progress data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProgressData();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'all') {
      setFilteredData(progressData);
    } else {
      setFilteredData(progressData.filter((entry) => entry.status === activeTab));
    }
  }, [activeTab, progressData]);

  if (!user) {
    return <div className="error-message">Please log in to view your progress.</div>;
  }

  if (loading) return <div className="progress-loading">Loading progress...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="progress-container">
      <h1>My Progress</h1>
      <p>Track your journey through algorithms.</p>

      <div className="progress-header-actions">
        <Link to="/profile" className="cta-button secondary">
          Back to Profile
        </Link>
      </div>

      <div className="progress-tabs">
        <button
          className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All ({progressData.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'enrolled' ? 'active' : ''}`}
          onClick={() => setActiveTab('enrolled')}
        >
          Enrolled ({progressData.filter((entry) => entry.status === 'enrolled').length})
        </button>
        <button
          className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed ({progressData.filter((entry) => entry.status === 'completed').length})
        </button>
      </div>

      <div className="progress-content">
        {filteredData.length > 0 ? (
          <div className="progress-grid">
            {filteredData.map((entry) => (
              <Link
                key={entry.algo_id}
                to={`/algorithms/${entry.algo_id}`}
                className="progress-card"
                onClick={() => console.log(`Navigating to /algorithms/${entry.algo_id}`)}
              >
                <div className="card-header">
                  <h3>{entry.algorithm?.name || 'Unknown Algorithm'}</h3>
                  <span className={`status-badge ${entry.status}`}>
                    {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                  </span>
                </div>
                <div className="card-meta">
                  <span className={`difficulty ${entry.algorithm?.difficulty?.toLowerCase() || 'unknown'}`}>
                    {entry.algorithm?.difficulty || 'N/A'}
                  </span>
                  <span className="last-updated">
                    Last Updated:{' '}
                    {entry.last_accessed
                      ? new Date(entry.last_accessed).toLocaleDateString()
                      : 'Not yet accessed'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="no-progress">
            No progress to show for this category. Start exploring algorithms!
          </p>
        )}
      </div>
    </div>
  );
};

export default MyProgressPage;