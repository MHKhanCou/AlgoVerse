import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PublicCodeforcesAnalyzer from '../components/PublicCodeforcesAnalyzer';
import '../styles/CodeforcesAnalytics.css';

const CodeforcesAnalytics = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [initialHandles, setInitialHandles] = useState([]);

  useEffect(() => {
    // Handle deep linking with query params, supporting multiple handles
    const params = new URLSearchParams(location.search);
    const handlesParam = params.get('handles');
    if (handlesParam) {
      const list = handlesParam
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      setInitialHandles(list);
    } else {
      setInitialHandles([]);
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
        {/* Backward compatibility: if only one handle, PublicCodeforcesAnalyzer will show single view */}
        <PublicCodeforcesAnalyzer initialHandles={initialHandles} />
      </div>
    </div>
  );
};

export default CodeforcesAnalytics;