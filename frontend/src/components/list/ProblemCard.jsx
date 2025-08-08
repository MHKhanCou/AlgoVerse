aimport React from 'react';
import { ExternalLink, CheckCircle, Clock, AlertCircle, Star, Calendar, Target } from 'lucide-react';

const ProblemCard = ({ 
  problem, 
  progress, 
  user, 
  onUpdateProgress, 
  className = "" 
}) => {
  const getPlatformColor = (platform) => {
    const colors = {
      'LeetCode': 'platform-leetcode',
      'Codeforces': 'platform-codeforces',
      'AtCoder': 'platform-atcoder',
      'CodeChef': 'platform-codechef',
      'HackerRank': 'platform-hackerrank',
      'SPOJ': 'platform-spoj',
      'UVa': 'platform-uva',
      'HackerEarth': 'platform-hackerearth',
      'TopCoder': 'platform-topcoder',
      'GeeksforGeeks': 'platform-geeksforgeeks'
    };
    return colors[platform] || 'platform-default';
  };

  const getDifficultyClass = (difficulty) => {
    const classes = {
      'beginner': 'difficulty-beginner',
      'easy': 'difficulty-easy',
      'medium': 'difficulty-medium',
      'hard': 'difficulty-hard',
      'expert': 'difficulty-expert'
    };
    return classes[difficulty] || 'difficulty-medium';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'solved':
        return <CheckCircle className="status-icon text-green-500" />;
      case 'attempted':
        return <Clock className="status-icon text-yellow-500" />;
      default:
        return <AlertCircle className="status-icon text-gray-400" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className={`problem-card ${className}`}>
      {/* Problem Header */}
      <div className="problem-header">
        <div className="problem-info">
          <h3 className="problem-title">{problem.title}</h3>
          
          <div className="problem-badges">
            <span className={`platform-badge ${getPlatformColor(problem.platform)}`}>
              {problem.platform}
            </span>
            
            <span className={`difficulty-badge ${getDifficultyClass(problem.difficulty)}`}>
              {problem.difficulty}
            </span>
            
            {problem.problem_id && (
              <span className="problem-id-badge">
                #{problem.problem_id}
              </span>
            )}
          </div>
        </div>
        
        {user && progress && getStatusIcon(progress.status)}
      </div>

      {/* Problem Description */}
      {problem.description && (
        <p className="problem-description">
          {problem.description}
        </p>
      )}

      {/* Progress Information */}
      {user && progress && (
        <div className="progress-info">
          <div className="progress-info-content">
            <div className="progress-info-left">
              <span className={`progress-status progress-status-${progress.status}`}>
                Status: {progress.status.replace('_', ' ')}
              </span>
              
              {progress.attempts > 0 && (
                <span className="progress-attempts">
                  <Target className="w-4 h-4 inline mr-1" />
                  {progress.attempts} attempt{progress.attempts !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            {progress.solved_at && (
              <span className="progress-solved-date">
                <Calendar className="w-3 h-3 inline mr-1" />
                Solved {formatDate(progress.solved_at)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="action-buttons">
        <a
          href={problem.problem_url}
          target="_blank"
          rel="noopener noreferrer"
          className="action-btn btn-primary"
        >
          <ExternalLink className="w-4 h-4" />
          Solve Problem
        </a>
        
        {user && (
          <>
            {progress?.status !== 'attempted' && (
              <button
                onClick={() => onUpdateProgress(problem.id, 'attempted')}
                className="action-btn btn-secondary"
              >
                <Clock className="w-4 h-4" />
                Mark Attempted
              </button>
            )}
            
            {progress?.status !== 'solved' && (
              <button
                onClick={() => onUpdateProgress(problem.id, 'solved')}
                className="action-btn btn-success"
              >
                <CheckCircle className="w-4 h-4" />
                Mark Solved
              </button>
            )}
          </>
        )}
      </div>

      {/* Tags */}
      {problem.tags && (
        <div className="problem-tags">
          <div className="tags-container">
            {problem.tags.split(',').map((tag, index) => (
              <span key={index} className="tag">
                {tag.trim()}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProblemCard;