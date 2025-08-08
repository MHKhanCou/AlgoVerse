import React from 'react';
import { Trophy, Target, Clock, CheckCircle, TrendingUp, Award } from 'lucide-react';

const ProgressSection = ({ 
  stats, 
  algorithm, 
  user,
  showDetailedStats = true 
}) => {
  if (!user || !stats) {
    return null;
  }

  const progressPercentage = stats.total > 0 ? (stats.solved / stats.total) * 100 : 0;
  const completionRate = Math.round(progressPercentage);

  const getProgressMessage = () => {
    if (completionRate === 100) {
      return "🎉 Perfect! You've mastered all problems!";
    } else if (completionRate >= 80) {
      return "🔥 Excellent progress! Almost there!";
    } else if (completionRate >= 60) {
      return "💪 Great work! Keep pushing forward!";
    } else if (completionRate >= 40) {
      return "📈 Good progress! You're on the right track!";
    } else if (completionRate >= 20) {
      return "🚀 Nice start! Keep building momentum!";
    } else if (stats.attempted > 0) {
      return "💡 Good effort! Every attempt counts!";
    } else {
      return "🎯 Ready to start your journey?";
    }
  };

  const getMasteryLevel = () => {
    if (completionRate === 100) return "Master";
    if (completionRate >= 80) return "Expert";
    if (completionRate >= 60) return "Advanced";
    if (completionRate >= 40) return "Intermediate";
    if (completionRate >= 20) return "Beginner";
    return "Novice";
  };

  return (
    <div className="progress-section">
      {/* Header */}
      <div className="progress-header">
        <div className="progress-title-section">
          <h3 className="progress-title">
            <Trophy className="w-5 h-5" />
            Your Progress
          </h3>
          <p className="progress-subtitle">
            {getProgressMessage()}
          </p>
        </div>
        
        <div className="mastery-badge">
          <Award className="w-4 h-4" />
          <span>{getMasteryLevel()}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="progress-stats">
        <div className="progress-stat">
          <div className="progress-stat-number text-green-500">
            {stats.solved}
          </div>
          <div className="progress-stat-label">
            <CheckCircle className="w-4 h-4 inline mr-1" />
            Solved
          </div>
        </div>
        
        <div className="progress-stat">
          <div className="progress-stat-number text-yellow-500">
            {stats.attempted}
          </div>
          <div className="progress-stat-label">
            <Clock className="w-4 h-4 inline mr-1" />
            Attempted
          </div>
        </div>
        
        <div className="progress-stat">
          <div className="progress-stat-number text-blue-500">
            {stats.total}
          </div>
          <div className="progress-stat-label">
            <Target className="w-4 h-4 inline mr-1" />
            Total
          </div>
        </div>
        
        <div className="progress-stat">
          <div className="progress-stat-number text-purple-500">
            {completionRate}%
          </div>
          <div className="progress-stat-label">
            <TrendingUp className="w-4 h-4 inline mr-1" />
            Complete
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-bar-container">
        <div className="progress-bar-header">
          <span className="progress-bar-label">
            Overall Progress
          </span>
          <span className="progress-bar-text">
            {stats.solved} of {stats.total} problems solved
          </span>
        </div>
        
        <div className="progress-bar">
          <div 
            className="progress-bar-fill"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Detailed Stats (Optional) */}
      {showDetailedStats && (
        <div className="detailed-stats">
          <div className="stat-row">
            <span className="stat-label">Success Rate:</span>
            <span className="stat-value">
              {stats.attempted > 0 
                ? Math.round((stats.solved / stats.attempted) * 100) 
                : 0}%
            </span>
          </div>
          
          <div className="stat-row">
            <span className="stat-label">Remaining:</span>
            <span className="stat-value">
              {stats.total - stats.solved} problems
            </span>
          </div>
          
          {algorithm?.name && (
            <div className="stat-row">
              <span className="stat-label">Algorithm:</span>
              <span className="stat-value">{algorithm.name}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgressSection;