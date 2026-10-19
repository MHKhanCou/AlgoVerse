import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PublicCodeforcesAnalyzer from '../components/PublicCodeforcesAnalyzer';
import '../styles/CodeforcesAnalytics.css';

const CodeforcesAnalytics = () => {
  // eslint-disable-next-line no-unused-vars
  const { user } = useAuth();
  const location = useLocation();

  // Single source of truth for deep-linked handles: the child depends only on
  // this prop, and the memo keeps the array identity stable so the mount effect
  // fetches each handle set exactly once.
  const initialHandles = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const handlesParam = params.get('handles');
    if (!handlesParam) return [];
    return handlesParam
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
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
