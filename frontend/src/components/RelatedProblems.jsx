import React, { useState, useEffect } from 'react';
import { ExternalLink, CheckCircle, Clock, AlertCircle, Star, Calendar, Target, Grid, List } from 'lucide-react';
import { algorithmService } from '../services/algorithmService';
import { userProgressService } from '../services/userProgressService';
import { toast } from 'react-toastify';
import '../styles/RelatedProblems.css';

// Platform logo component
const PlatformLogo = ({ platform }) => {
  const getPlatformLogo = (platformName) => {
    const name = platformName?.toLowerCase();
    switch (name) {
      case 'codeforces':
        return (
          <svg className="platform-logo" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4.5 7.5C5.328 7.5 6 8.172 6 9v10.5c0 .828-.672 1.5-1.5 1.5S3 20.328 3 19.5V9c0-.828.672-1.5 1.5-1.5zm15 0c.828 0 1.5.672 1.5 1.5v10.5c0 .828-.672 1.5-1.5 1.5S18 20.328 18 19.5V9c0-.828.672-1.5 1.5-1.5zM12 3c.828 0 1.5.672 1.5 1.5v15c0 .828-.672 1.5-1.5 1.5s-1.5-.672-1.5-1.5v-15C10.5 3.672 11.172 3 12 3z"/>
          </svg>
        );
      case 'leetcode':
        return (
          <svg className="platform-logo" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382H10.617z"/>
          </svg>
        );
      case 'atcoder':
        return (
          <svg className="platform-logo" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.2 3.6L12 8.4l4.8-4.8L21.6 8.4 12 18 2.4 8.4 7.2 3.6zM12 0L0 12l12 12L24 12 12 0z"/>
          </svg>
        );
      case 'codechef':
        return (
          <svg className="platform-logo" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.257.004c-.37 0-.74.124-1.03.372L.732 9.14a1.45 1.45 0 0 0-.001 2.063l9.494 8.764a1.45 1.45 0 0 0 2.062-.001l9.494-8.764a1.45 1.45 0 0 0 0-2.062L12.287.376a1.45 1.45 0 0 0-1.03-.372zm4.455 6.096c.898 0 1.627.729 1.627 1.627s-.729 1.627-1.627 1.627-1.627-.729-1.627-1.627.729-1.627 1.627-1.627zm-7.364 0c.898 0 1.627.729 1.627 1.627s-.729 1.627-1.627 1.627-1.627-.729-1.627-1.627.729-1.627 1.627-1.627zM12 10.908c2.013 0 3.636 1.623 3.636 3.636S14.013 18.18 12 18.18s-3.636-1.623-3.636-3.636S9.987 10.908 12 10.908z"/>
          </svg>
        );
      default:
        return (
          <svg className="platform-logo" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        );
    }
  };

  return getPlatformLogo(platform);
};

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
            <span className={`problem-platform ${problem.platform?.toLowerCase()}`}>
              <PlatformLogo platform={problem.platform} />
              {problem.platform}
            </span>
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

        <div className="problem-status-actions">
          <button
            onClick={() => handleStatusChange('attempted')}
            className={`status-btn ${currentStatus === 'attempted' ? 'active' : ''}`}
            disabled={!user || currentStatus === 'solved'}
            title={!user ? 'Login to track progress' : 'Mark as Attempted'}
          >
            <Clock className="w-3 h-3" />
            Attempted
          </button>
          <button
            onClick={() => handleStatusChange('solved')}
            className={`status-btn ${currentStatus === 'solved' ? 'active' : ''}`}
            disabled={!user}
            title={!user ? 'Login to track progress' : 'Mark as Solved'}
          >
            <CheckCircle className="w-3 h-3" />
            Solved
          </button>
        </div>
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

const ProblemListItem = ({
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
    <div className="problem-list-item">
      <div className="problem-list-content">
        <div className="problem-list-main">
          <div className="problem-list-header">
            <h3 className="problem-list-title">
              <Target className="w-4 h-4" />
              {problem.title}
            </h3>
            <div className="problem-list-meta">
              <span className={`problem-platform ${problem.platform?.toLowerCase()}`}>
                <PlatformLogo platform={problem.platform} />
                {problem.platform}
              </span>
              <span className={`problem-difficulty ${getDifficultyColor(problem.difficulty)}`}>
                {problem.difficulty}
              </span>
            </div>
          </div>
          
          {problem.description && (
            <p className="problem-list-description">
              {problem.description.length > 100
                ? `${problem.description.substring(0, 100)}...`
                : problem.description}
            </p>
          )}

          {problem.tags && (
            <div className="problem-list-tags">
              {problem.tags.split(',').slice(0, 2).map((tag, index) => (
                <span key={index} className="problem-tag-small">
                  {tag.trim()}
                </span>
              ))}
              {problem.tags.split(',').length > 2 && (
                <span className="problem-tag-more-small">
                  +{problem.tags.split(',').length - 2}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="problem-list-actions">
          {user && (
            <div className="problem-list-status">
              {getStatusIcon(currentStatus)}
            </div>
          )}
          
          <a
            href={problem.url}
            target="_blank"
            rel="noopener noreferrer"
            className="problem-list-link"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          <div className="problem-list-status-actions">
            <button
              onClick={() => handleStatusChange('attempted')}
              className={`status-btn-small ${currentStatus === 'attempted' ? 'active' : ''}`}
              disabled={!user || currentStatus === 'solved'}
              title={!user ? 'Login to track progress' : 'Mark as Attempted'}
            >
              <Clock className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleStatusChange('solved')}
              className={`status-btn-small ${currentStatus === 'solved' ? 'active' : ''}`}
              disabled={!user}
              title={!user ? 'Login to track progress' : 'Mark as Solved'}
            >
              <CheckCircle className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const RelatedProblems = ({ algorithm, user }) => {
  const [relatedProblems, setRelatedProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progressMap, setProgressMap] = useState({});
  const [viewMode, setViewMode] = useState('list'); // 'grid' or 'list'

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
      <div className="related-problems-header">
        <h2 className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ height: '1.5em', width: '1.5em' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>Related Problems</span>
        </h2>
        
        {relatedProblems.length > 0 && (
          <div className="view-toggle">
            <button
              onClick={() => setViewMode('list')}
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      
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
        <div className={`related-problems-content ${viewMode === 'list' ? 'list-view' : 'grid-view'}`}>
          {viewMode === 'grid' ? (
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
          ) : (
            <div className="related-problems-list">
              {relatedProblems.map(problem => (
                <ProblemListItem
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
      )}
    </div>
  );
};

export default RelatedProblems;