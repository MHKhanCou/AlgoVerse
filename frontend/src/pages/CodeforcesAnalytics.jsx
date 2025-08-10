import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PublicCodeforcesAnalyzer from '../components/PublicCodeforcesAnalyzer';
import '../styles/CodeforcesAnalytics.css';

const CodeforcesAnalytics = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [initialHandle, setInitialHandle] = useState(null);

  useEffect(() => {
    // Handle deep linking with query params
    const params = new URLSearchParams(location.search);
    const handles = params.get('handles');
    if (handles) {
      const handleList = handles.split(',').map(s => s.trim()).filter(Boolean);
      if (handleList.length > 0) {
        setInitialHandle(handleList[0]);
      }
    }
  }, [location.search]);

  return (
    <div className="cf-analytics-page">
      <div className="cf-page-header">
        <h1 className="cf-page-title">Codeforces Analytics</h1>
        <p className="cf-page-subtitle">
          Analyze your Codeforces performance with detailed statistics, problem-solving patterns, 
          and progress tracking similar to CFViz.
        </p>
      </div>
      
      <div className="cf-analyzer-container">
        <PublicCodeforcesAnalyzer initialHandle={initialHandle} />
      </div>
    </div>
  );
};

export default CodeforcesAnalytics;