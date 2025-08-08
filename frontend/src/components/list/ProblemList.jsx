import React from 'react';
import ProblemCard from './ProblemCard';
import { BookOpen, Search, Filter } from 'lucide-react';

const ProblemList = ({ 
  problems, 
  userProgress, 
  user, 
  onUpdateProgress,
  loading = false,
  error = null,
  emptyMessage = "No problems found matching your criteria."
}) => {
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading problems...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-text">
          Error loading problems: {error}
        </p>
      </div>
    );
  }

  if (!problems || problems.length === 0) {
    return (
      <div className="empty-state">
        <BookOpen className="empty-state-icon" />
        <h3 className="empty-state-title">No Problems Available</h3>
        <p className="empty-state-description">
          {emptyMessage}
        </p>
        <p className="empty-state-hint">
          Try adjusting your filters or check back later for new problems.
        </p>
      </div>
    );
  }

  return (
    <div className="problems-grid">
      {problems.map((problem) => (
        <ProblemCard
          key={problem.id}
          problem={problem}
          progress={userProgress[problem.id]}
          user={user}
          onUpdateProgress={onUpdateProgress}
        />
      ))}
    </div>
  );
};

export default ProblemList;