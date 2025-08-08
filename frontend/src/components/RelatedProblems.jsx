import React, { useState, useEffect } from 'react';
import { ExternalLink, CheckCircle, Clock, AlertCircle, Star, Calendar, Target } from 'lucide-react';
import { algorithmService } from '../services/algorithmService';
import { userProgressService } from '../services/userProgressService';
import { toast } from 'react-toastify';

const ProblemCard = ({
  problem,
  progress,
  user,
  onUpdateProgress
}) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'solved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'attempted':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return 'text-green-400 bg-green-50 border-green-200';
      case 'easy':
        return 'text-green-500 bg-green-50 border-green-200';
      case 'medium':
        return 'text-yellow-500 bg-yellow-50 border-yellow-200';
      case 'hard':
        return 'text-red-500 bg-red-50 border-red-200';
      case 'expert':
        return 'text-purple-500 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const handleStatusChange = (newStatus) => {
    if (onUpdateProgress && user) {
      onUpdateProgress(problem.id, newStatus);
    }
  };

  const currentStatus = progress?.status || 'not_started';

  return (
    <div className="problem-card">
      {/* Header */}
      <div className="problem-card-header">
        <div className="problem-title-section">
          <h3 className="problem-title">
            <Target className="w-4 h-4" />
            {problem.title}
          </h3>
          <div className="problem-meta">
            <span className="problem-platform">{problem.platform}</span>
            <span className={`problem-difficulty ${getDifficultyColor(problem.difficulty)}`}>
              {problem.difficulty}
            </span>
          </div>
        </div>
        
        {user && (
          <div className="problem-status">
            {getStatusIcon(currentStatus)}
          </div>
        )}
      </div>

      {/* Description */}
      {problem.description && (
        <p className="problem-description">
          {problem.description.length > 150 
            ? `${problem.description.substring(0, 150)}...` 
            : problem.description}
        </p>
      )}

      {/* Tags */}
      {problem.tags && (
        <div className="problem-tags">
          {problem.tags.split(',').slice(0, 3).map((tag, index) => (
            <span key={index} className="problem-tag">
              {tag.trim()}
            </span>
          ))}
          {problem.tags.split(',').length > 3 && (
            <span className="problem-tag-more">
              +{problem.tags.split(',').length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Progress Info */}
      {user && progress && (
        <div className="problem-progress-info">
          <div className="progress-stats">
            <span className="progress-stat">
              <Calendar className="w-3 h-3" />
              Attempts: {progress.attempts || 0}
            </span>
            {progress.solved_at && (
              <span className="progress-stat">
                <Star className="w-3 h-3" />
                Solved: {new Date(progress.solved_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="problem-card-actions">
        <a
          href={problem.url}
          target="_blank"
          rel="noopener noreferrer"
          className="problem-link-btn"
        >
          <ExternalLink className="w-4 h-4" />
          Solve Problem
        </a>

        {user && (
          <div className="problem-status-actions">
            <button
              onClick={() => handleStatusChange('attempted')}
              className={`status-btn ${currentStatus === 'attempted' ? 'active' : ''}`}
              disabled={currentStatus === 'solved'}
            >
              <Clock className="w-3 h-3" />
              Attempted
            </button>
            <button
              onClick={() => handleStatusChange('solved')}
              className={`status-btn ${currentStatus === 'solved' ? 'active' : ''}`}
            >
              <CheckCircle className="w-3 h-3" />
              Solved
            </button>
          </div>
        )}
      </div>

      {/* Solution URL */}
      {user && progress?.solution_url && (
        <div className="problem-solution">
          <a
            href={progress.solution_url}
            target="_blank"
            rel="noopener noreferrer"
            className="solution-link"
          >
            <ExternalLink className="w-3 h-3" />
            View Solution
          </a>
        </div>
      )}
    </div>
  );
};

const RelatedProblems = ({ algorithm, user }) => {
  const [relatedProblems, setRelatedProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progressMap, setProgressMap] = useState({});

  useEffect(() => {
    const fetchRelatedProblems = async () => {
      if (!algorithm?.id) return;
      
      try {
        setLoading(true);
        setError('');
        
        // In a real app, you would fetch related problems based on the current algorithm
        // For now, we'll use a placeholder or fetch some related problems
        const response = await algorithmService.getByType(algorithm.type_id, 1, 3);
        const related = response.items || [];
        
        // Filter out the current algorithm
        const filtered = related.filter(p => p.id !== algorithm.id);
        setRelatedProblems(filtered);
        
        // Fetch progress for each related problem if user is logged in
        if (user) {
          const progressPromises = filtered.map(problem => 
            userProgressService.getEntry(problem.id).catch(() => null)
          );
          const progresses = await Promise.all(progressPromises);
          
          const progressObj = {};
          progresses.forEach((progress, index) => {
            if (progress) {
              progressObj[filtered[index].id] = progress;
            }
          });
          setProgressMap(progressObj);
        }
      } catch (err) {
        console.error('Error fetching related problems:', err);
        setError('Failed to load related problems');
        toast.error('Failed to load related problems');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRelatedProblems();
  }, [algorithm?.id, algorithm?.type_id, user]);

  const handleUpdateProgress = async (problemId, status) => {
    if (!user) return;
    
    try {
      const updatedProgress = await userProgressService.updateOrCreateProgress(problemId, status);
      setProgressMap(prev => ({
        ...prev,
        [problemId]: updatedProgress
      }));
      toast.success(`Marked as ${status}`);
    } catch (err) {
      console.error('Error updating progress:', err);
      toast.error('Failed to update progress');
    }
  };

  if (loading) return <div className="loading-related">Loading related problems...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (relatedProblems.length === 0) return null;

  return (
    <div className="related-problems-container">
      <h2>Related Problems</h2>
      <div className="related-problems-grid">
        {relatedProblems.map(problem => (
          <ProblemCard
            key={problem.id}
            problem={{
              ...problem,
              title: problem.name || 'Untitled Problem',
              description: problem.description || '',
              difficulty: problem.difficulty || 'medium',
              platform: 'AlgoVerse',
              url: `/algorithms/${problem.id}`,
              tags: problem.tags || ''
            }}
            progress={progressMap[problem.id]}
            user={user}
            onUpdateProgress={handleUpdateProgress}
          />
        ))}
      </div>
    </div>
  );
};

export default RelatedProblems;