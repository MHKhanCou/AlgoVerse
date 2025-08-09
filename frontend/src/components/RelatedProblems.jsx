import React, { useState, useEffect } from 'react';
import { ExternalLink, CheckCircle, Clock, AlertCircle, Star, Calendar, Target } from 'lucide-react';
import { algorithmService } from '../services/algorithmService';
import { userProgressService } from '../services/userProgressService';
import { toast } from 'react-toastify';
import '../styles/RelatedProblems.css';

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
        
        // Fetch related problems for this algorithm
        const response = await algorithmService.getRelatedProblems(algorithm.id);
        const related = response || [];
        
        console.log('Fetched related problems for algorithm:', algorithm.id);
        
        // Use the related problems directly (no need to filter current algorithm)
        const filtered = Array.isArray(related) ? related : [];
        const limitedProblems = filtered.slice(0, 6); // Limit to 6 related problems for display
        
        setRelatedProblems(limitedProblems);
        
        // Batch fetch progress for all problems if user is logged in
        if (user && limitedProblems.length > 0) {
          try {
            const algorithmIds = limitedProblems.map(p => p.id);
            const progressMap = await userProgressService.getBatchProgress(algorithmIds);
            
            // Convert the progress map to the expected format
            const formattedProgressMap = {};
            Object.entries(progressMap).forEach(([algoId, progress]) => {
              if (progress) {
                formattedProgressMap[algoId] = {
                  status: progress.status,
                  attempts: progress.attempts || 0,
                  solved_at: progress.finished_at,
                  solution_url: progress.solution_url
                };
              }
            });
            
            setProgressMap(formattedProgressMap);
          } catch (progressError) {
            console.error('Error fetching batch progress:', progressError);
          }
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

  const handleUpdateProgress = async (algoId, newStatus) => {
    if (!user) return;
    
    try {
      const existingProgress = progressMap[algoId];
      const isNew = !existingProgress;
      
      // Update local state optimistically
      setProgressMap(prev => ({
        ...prev,
        [algoId]: {
          ...(prev[algoId] || {}),
          status: newStatus,
          solved_at: newStatus === 'solved' ? new Date().toISOString() : (prev[algoId]?.solved_at || null),
          attempts: (prev[algoId]?.attempts || 0) + (newStatus === 'solved' ? 1 : 0)
        }
      }));
      
      // Update in the backend
      if (isNew) {
        // Create new progress entry
        await userProgressService.createProgress(algoId, newStatus);
      } else {
        // Update existing progress
        const progressId = existingProgress.id;
        if (progressId) {
          await userProgressService.updateProgress(progressId, newStatus);
        } else {
          // If for some reason we don't have an ID, create a new entry
          const newProgress = await userProgressService.createProgress(algoId, newStatus);
          setProgressMap(prev => ({
            ...prev,
            [algoId]: {
              ...prev[algoId],
              id: newProgress.id
            }
          }));
        }
      }
      
      toast.success(`Marked as ${newStatus} successfully`);
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error(error.message || 'Failed to update progress');
      
      // Revert optimistic update on error
      setProgressMap(prev => ({
        ...prev,
        [algoId]: {
          ...(prev[algoId] || {}),
          status: existingProgress?.status || 'not_started',
          solved_at: existingProgress?.solved_at || null
        }
      }));
    }
  };

  if (loading) return (
    <div className="related-problems-container">
      <h2>Related Problems</h2>
      <div className="loading-related">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="related-problems-container">
      <h2>Related Problems</h2>
      <div className="error-message">
        <AlertCircle className="w-6 h-6 mx-auto mb-2" />
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-3 text-sm px-4 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="related-problems-container">
      <h2 className="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ height: '1.5em', width: '1.5em' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <span>Related Problems</span>
      </h2>
      
      {relatedProblems.length === 0 ? (
        <div className="no-related-problems">
          <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
            <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No related problems found</h3>
            <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
              We couldn't find any related problems for this algorithm. Check back later or explore other algorithms.
            </p>
          </div>
        </div>
      ) : (
        <div className="related-problems-grid">
          {relatedProblems.map(problem => (
            <ProblemCard 
              key={problem.id} 
              problem={problem} 
              progress={progressMap[problem.id]} 
              user={user} 
              onUpdateProgress={handleUpdateProgress} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RelatedProblems;