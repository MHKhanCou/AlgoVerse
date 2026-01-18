import React, { useState, useEffect } from 'react';
import { 
  User, 
  Trophy, 
  TrendingUp, 
  Calendar, 
  Target, 
  Award,
  BarChart3,
  PieChart,
  Activity,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Save,
  Edit3,
  Users,
  Plus,
  X,
  ArrowUpDown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import '../styles/CodeforcesAnalyzer.css';

const CodeforcesAnalyzer = () => {
  const { user, updateUser } = useAuth();
  const [userInfo, setUserInfo] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const [handle, setHandle] = useState(user?.codeforces_handle || '');
  const [isEditing, setIsEditing] = useState(!user?.codeforces_handle);
  
  // Comparison functionality
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonHandles, setComparisonHandles] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);
  const [newComparisonHandle, setNewComparisonHandle] = useState('');
  const [comparisonLoading, setComparisonLoading] = useState(false);

  useEffect(() => {
    if (user?.codeforces_handle) {
      setHandle(user.codeforces_handle);
      fetchCodeforcesData(user.codeforces_handle);
    }
  }, [user]);

  const fetchCodeforcesData = async (cfHandle) => {
    if (!cfHandle) return;
    
    setLoading(true);
    setError(null);

    try {
      // Fetch user info
      const userResponse = await fetch(`https://codeforces.com/api/user.info?handles=${cfHandle}`);
      const userData = await userResponse.json();
      
      if (userData.status !== 'OK') {
        throw new Error('User not found');
      }

      setUserInfo(userData.result[0]);

      // Fetch user submissions (get more submissions for better accuracy)
      const submissionsResponse = await fetch(`https://codeforces.com/api/user.status?handle=${cfHandle}&from=1&count=10000`);
      const submissionsData = await submissionsResponse.json();
      
      if (submissionsData.status === 'OK') {
        setSubmissions(submissionsData.result);
        calculateStats(submissionsData.result);
      }

      // Fetch contest ratings
      const ratingsResponse = await fetch(`https://codeforces.com/api/user.rating?handle=${cfHandle}`);
      const ratingsData = await ratingsResponse.json();
      
      if (ratingsData.status === 'OK') {
        setContests(ratingsData.result);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchComparisonData = async (handles) => {
    setComparisonLoading(true);
    const results = [];

    try {
      for (const handle of handles) {
        try {
          // Fetch user info
          const userResponse = await fetch(`https://codeforces.com/api/user.info?handles=${handle}`);
          const userData = await userResponse.json();
          
          if (userData.status !== 'OK') continue;

          // Fetch submissions
          const submissionsResponse = await fetch(`https://codeforces.com/api/user.status?handle=${handle}&from=1&count=10000`);
          const submissionsData = await submissionsResponse.json();
          
          let userStats = {};
          if (submissionsData.status === 'OK') {
            userStats = calculateStatsForUser(submissionsData.result);
          }

          results.push({
            handle,
            userInfo: userData.result[0],
            stats: userStats
          });
        } catch (err) {
          console.error(`Error fetching data for ${handle}:`, err);
        }
      }

      setComparisonData(results);
    } catch (err) {
      toast.error('Failed to fetch comparison data');
    } finally {
      setComparisonLoading(false);
    }
  };

  const calculateStats = (submissions) => {
    const solved = new Set();
    const attempted = new Set();
    const languageCount = {};
    const verdictCount = {};
    const tagCount = {};
    const ratingCount = {};
    const dailySubmissions = {};

    // Group submissions by problem to get unique problems
    const problemMap = new Map();
    
    submissions.forEach(submission => {
      const problemKey = `${submission.problem.contestId}-${submission.problem.index}`;
      
      // Track all attempted problems
      attempted.add(problemKey);
      
      // Keep track of best submission for each problem
      if (!problemMap.has(problemKey) || submission.verdict === 'OK') {
        problemMap.set(problemKey, submission);
      }
      
      // If this submission is accepted, mark problem as solved
      if (submission.verdict === 'OK') {
        solved.add(problemKey);
      }

      // Language stats (count all submissions)
      languageCount[submission.programmingLanguage] = 
        (languageCount[submission.programmingLanguage] || 0) + 1;

      // Verdict stats (count all submissions)
      verdictCount[submission.verdict] = 
        (verdictCount[submission.verdict] || 0) + 1;

      // Daily submissions
      const date = new Date(submission.creationTimeSeconds * 1000).toDateString();
      dailySubmissions[date] = (dailySubmissions[date] || 0) + 1;
    });

    // Tag and rating stats (count unique problems only)
    problemMap.forEach(submission => {
      if (submission.problem.tags) {
        submission.problem.tags.forEach(tag => {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
      }

      if (submission.problem.rating) {
        const rating = Math.floor(submission.problem.rating / 100) * 100;
        ratingCount[rating] = (ratingCount[rating] || 0) + 1;
      }
    });

    setStats({
      totalSolved: solved.size,
      totalAttempted: attempted.size,
      totalSubmissions: submissions.length,
      languageCount,
      verdictCount,
      tagCount,
      ratingCount,
      dailySubmissions
    });
  };

  const calculateStatsForUser = (submissions) => {
    const solved = new Set();
    const attempted = new Set();
    const verdictCount = {};

    const problemMap = new Map();
    
    submissions.forEach(submission => {
      const problemKey = `${submission.problem.contestId}-${submission.problem.index}`;
      attempted.add(problemKey);
      
      if (!problemMap.has(problemKey) || submission.verdict === 'OK') {
        problemMap.set(problemKey, submission);
      }
      
      if (submission.verdict === 'OK') {
        solved.add(problemKey);
      }

      verdictCount[submission.verdict] = 
        (verdictCount[submission.verdict] || 0) + 1;
    });

    return {
      totalSolved: solved.size,
      totalAttempted: attempted.size,
      totalSubmissions: submissions.length,
      verdictCount
    };
  };

  const saveHandle = async () => {
    if (!handle.trim()) {
      toast.error('Please enter a valid Codeforces handle');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/profile/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          codeforces_handle: handle.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update handle');
      }

      const updatedUser = await updateUser({ ...user, codeforces_handle: handle.trim() });
      await fetchCodeforcesData(handle.trim());
      setUserInfo(updatedUser);  
      setIsEditing(false);
      toast.success('Codeforces handle saved successfully!');
    } catch (err) {
      toast.error('Failed to save handle');
      console.error('Error saving handle:', err);
    }
  };

  const addComparisonHandle = async () => {
    if (!newComparisonHandle.trim()) {
      toast.error('Please enter a valid handle');
      return;
    }

    if (comparisonHandles.includes(newComparisonHandle.trim())) {
      toast.error('Handle already added for comparison');
      return;
    }

    if (comparisonHandles.length >= 4) {
      toast.error('Maximum 5 users can be compared at once');
      return;
    }

    const updatedHandles = [...comparisonHandles, newComparisonHandle.trim()];
    setComparisonHandles(updatedHandles);
    setNewComparisonHandle('');

    // Include current user in comparison
    const allHandles = handle ? [handle, ...updatedHandles] : updatedHandles;
    await fetchComparisonData(allHandles);
  };

  const removeComparisonHandle = (handleToRemove) => {
    const updatedHandles = comparisonHandles.filter(h => h !== handleToRemove);
    setComparisonHandles(updatedHandles);
    
    // Update comparison data
    const allHandles = handle ? [handle, ...updatedHandles] : updatedHandles;
    if (allHandles.length > 0) {
      fetchComparisonData(allHandles);
    } else {
      setComparisonData([]);
    }
  };

  const toggleComparisonMode = () => {
    setComparisonMode(!comparisonMode);
    if (!comparisonMode && handle) {
      // When entering comparison mode, include current user
      fetchComparisonData([handle]);
    }
  };

  const getRankColor = (rank) => {
    const colors = {
      'newbie': '#808080',
      'pupil': '#008000',
      'specialist': '#03A89E',
      'expert': '#0000FF',
      'candidate master': '#AA00AA',
      'master': '#FF8C00',
      'international master': '#FF8C00',
      'grandmaster': '#FF0000',
      'international grandmaster': '#FF0000',
      'legendary grandmaster': '#FF0000'
    };
    return colors[rank?.toLowerCase()] || '#808080';
  };

  const getVerdictColor = (verdict) => {
    const colors = {
      'OK': '#10b981',
      'WRONG_ANSWER': '#ef4444',
      'TIME_LIMIT_EXCEEDED': '#f59e0b',
      'MEMORY_LIMIT_EXCEEDED': '#f59e0b',
      'RUNTIME_ERROR': '#ef4444',
      'COMPILATION_ERROR': '#6b7280'
    };
    return colors[verdict] || '#6b7280';
  };

  if (loading) {
    return (
      <div className="cf-analyzer">
        <div className="cf-loading">
          <div className="cf-loading-spinner"></div>
          <p>Loading Codeforces data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cf-analyzer">
      {/* Handle Input Section */}
      <div className="cf-handle-section">
        <div className="cf-section-header">
          <h3 className="cf-section-title">
            <User className="cf-icon" />
            Codeforces Handle
          </h3>
          
          <button
            onClick={toggleComparisonMode}
            className={`cf-btn ${comparisonMode ? 'cf-btn-primary' : 'cf-btn-secondary'}`}
          >
            <Users className="cf-icon-sm" />
            {comparisonMode ? 'Exit Comparison' : 'Compare Users'}
          </button>
        </div>
        
        {isEditing ? (
          <div className="cf-handle-input">
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="Enter your Codeforces handle"
              className="cf-input"
            />
            <div className="cf-handle-actions">
              <button onClick={saveHandle} className="cf-btn cf-btn-primary">
                <Save className="cf-icon-sm" />
                Save
              </button>
              {user?.codeforces_handle && (
                <button 
                  onClick={() => {
                    setHandle(user.codeforces_handle);
                    setIsEditing(false);
                  }} 
                  className="cf-btn cf-btn-secondary"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="cf-handle-display">
            <span className="cf-handle-text">{handle}</span>
            <button 
              onClick={() => setIsEditing(true)} 
              className="cf-btn cf-btn-ghost"
            >
              <Edit3 className="cf-icon-sm" />
              Edit
            </button>
          </div>
        )}

        {/* Comparison Mode */}
        {comparisonMode && (
          <div className="cf-comparison-section">
            <h4 className="cf-comparison-title">Add Users to Compare</h4>
            <div className="cf-comparison-input">
              <input
                type="text"
                value={newComparisonHandle}
                onChange={(e) => setNewComparisonHandle(e.target.value)}
                placeholder="Enter Codeforces handle to compare"
                className="cf-input"
                onKeyPress={(e) => e.key === 'Enter' && addComparisonHandle()}
              />
              <button 
                onClick={addComparisonHandle}
                className="cf-btn cf-btn-primary"
                disabled={comparisonLoading}
              >
                <Plus className="cf-icon-sm" />
                Add
              </button>
            </div>
            
            {comparisonHandles.length > 0 && (
              <div className="cf-comparison-handles">
                {comparisonHandles.map((compHandle) => (
                  <div key={compHandle} className="cf-comparison-handle-tag">
                    <span>{compHandle}</span>
                    <button
                      onClick={() => removeComparisonHandle(compHandle)}
                      className="cf-remove-handle"
                    >
                      <X className="cf-icon-sm" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="cf-error">
          <AlertCircle className="cf-icon" />
          <div>
            <h3>Error Loading Data</h3>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Comparison View */}
      {comparisonMode && comparisonData.length > 0 && (
        <div className="cf-comparison-view">
          <h3 className="cf-chart-title">
            <ArrowUpDown className="cf-icon" />
            User Comparison
          </h3>
          
          {comparisonLoading && (
            <div className="cf-loading">
              <div className="cf-loading-spinner"></div>
              <p>Loading comparison data...</p>
            </div>
          )}

          <div className="cf-comparison-table">
            <div className="cf-comparison-header">
              <div>User</div>
              <div>Rating</div>
              <div>Rank</div>
              <div>Solved</div>
              <div>Attempted</div>
              <div>Submissions</div>
              <div>Success Rate</div>
            </div>
            
            {comparisonData.map((userData, index) => {
              const successRate = userData.stats.totalAttempted > 0 
                ? ((userData.stats.totalSolved / userData.stats.totalAttempted) * 100).toFixed(1)
                : '0.0';
              
              return (
                <div key={userData.handle} className="cf-comparison-row">
                  <div className="cf-comparison-user">
                    <div className="cf-comparison-avatar">
                      {userData.userInfo.avatar && (
                        <img src={userData.userInfo.avatar} alt={userData.handle} />
                      )}
                    </div>
                    <div>
                      <div className="cf-comparison-handle">{userData.handle}</div>
                      {userData.handle === handle && (
                        <span className="cf-current-user-badge">You</span>
                      )}
                    </div>
                  </div>
                  <div className="cf-comparison-rating">
                    {userData.userInfo.rating || 'Unrated'}
                  </div>
                  <div 
                    className="cf-comparison-rank"
                    style={{ color: getRankColor(userData.userInfo.rank) }}
                  >
                    {userData.userInfo.rank || 'Unrated'}
                  </div>
                  <div className="cf-comparison-solved">
                    {userData.stats.totalSolved}
                  </div>
                  <div className="cf-comparison-attempted">
                    {userData.stats.totalAttempted}
                  </div>
                  <div className="cf-comparison-submissions">
                    {userData.stats.totalSubmissions}
                  </div>
                  <div className="cf-comparison-success-rate">
                    {successRate}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Regular Single User View */}
      {!comparisonMode && userInfo && (
        <>
          {/* User Profile Header */}
          <div className="cf-profile-header">
            <div className="cf-profile-info">
              {userInfo.avatar && (
                <img 
                  src={userInfo.avatar} 
                  alt={userInfo.handle}
                  className="cf-avatar"
                />
              )}
              <div className="cf-profile-details">
                <h2 className="cf-profile-name">{userInfo.handle}</h2>
                {userInfo.firstName && userInfo.lastName && (
                  <p className="cf-profile-real-name">{userInfo.firstName} {userInfo.lastName}</p>
                )}
                <div className="cf-profile-stats">
                  <div className="cf-profile-stat">
                    <Trophy className="cf-icon-sm" />
                    <span 
                      className="cf-rank"
                      style={{ color: getRankColor(userInfo.rank) }}
                    >
                      {userInfo.rank || 'Unrated'}
                    </span>
                  </div>
                  {userInfo.rating && (
                    <div className="cf-profile-stat">
                      <Star className="cf-icon-sm" />
                      <span className="cf-rating">{userInfo.rating}</span>
                    </div>
                  )}
                  {userInfo.maxRating && (
                    <div className="cf-profile-stat">
                      <TrendingUp className="cf-icon-sm" />
                      <span className="cf-max-rating">Max: {userInfo.maxRating}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <a 
              href={`https://codeforces.com/profile/${userInfo.handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="cf-btn cf-btn-primary"
            >
              <ExternalLink className="cf-icon-sm" />
              View Profile
            </a>
          </div>

          {/* Statistics Cards */}
          <div className="cf-stats-grid">
            <div className="cf-stat-card cf-stat-solved">
              <div className="cf-stat-icon">
                <CheckCircle />
              </div>
              <div className="cf-stat-content">
                <div className="cf-stat-number">{stats.totalSolved}</div>
                <div className="cf-stat-label">Problems Solved</div>
              </div>
            </div>

            <div className="cf-stat-card cf-stat-attempted">
              <div className="cf-stat-icon">
                <Target />
              </div>
              <div className="cf-stat-content">
                <div className="cf-stat-number">{stats.totalAttempted}</div>
                <div className="cf-stat-label">Problems Attempted</div>
              </div>
            </div>

            <div className="cf-stat-card cf-stat-submissions">
              <div className="cf-stat-icon">
                <Activity />
              </div>
              <div className="cf-stat-content">
                <div className="cf-stat-number">{stats.totalSubmissions}</div>
                <div className="cf-stat-label">Total Submissions</div>
              </div>
            </div>

            <div className="cf-stat-card cf-stat-contests">
              <div className="cf-stat-icon">
                <Award />
              </div>
              <div className="cf-stat-content">
                <div className="cf-stat-number">{contests.length}</div>
                <div className="cf-stat-label">Contests</div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="cf-charts-grid">
            {/* Verdict Distribution */}
            <div className="cf-chart-card">
              <h3 className="cf-chart-title">
                <PieChart className="cf-icon" />
                Submission Verdicts
              </h3>
              <div className="cf-verdict-chart">
                {Object.entries(stats.verdictCount || {})
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 6)
                  .map(([verdict, count]) => (
                    <div key={verdict} className="cf-verdict-item">
                      <div className="cf-verdict-info">
                        <div 
                          className="cf-verdict-color"
                          style={{ backgroundColor: getVerdictColor(verdict) }}
                        ></div>
                        <span className="cf-verdict-name">
                          {verdict.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="cf-verdict-count">{count}</div>
                      <div className="cf-verdict-bar">
                        <div 
                          className="cf-verdict-bar-fill"
                          style={{ 
                            width: `${(count / Math.max(...Object.values(stats.verdictCount || {}))) * 100}%`,
                            backgroundColor: getVerdictColor(verdict)
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Problem Tags */}
            <div className="cf-chart-card">
              <h3 className="cf-chart-title">
                <BarChart3 className="cf-icon" />
                Popular Tags
              </h3>
              <div className="cf-tags-chart">
                {Object.entries(stats.tagCount || {})
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 8)
                  .map(([tag, count]) => (
                    <div key={tag} className="cf-tag-item">
                      <div className="cf-tag-name">
                        {tag.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div className="cf-tag-bar">
                        <div 
                          className="cf-tag-bar-fill"
                          style={{ 
                            width: `${(count / Math.max(...Object.values(stats.tagCount || {}))) * 100}%`
                          }}
                        ></div>
                      </div>
                      <div className="cf-tag-count">{count}</div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Rating Progress */}
          {contests.length > 0 && (
            <div className="cf-chart-card cf-rating-chart">
              <h3 className="cf-chart-title">
                <TrendingUp className="cf-icon" />
                Rating Progress
              </h3>
              <div className="cf-rating-graph">
                <div className="cf-rating-bars">
                  {contests.slice(-20).map((contest, index) => (
                    <div 
                      key={index}
                      className="cf-rating-bar"
                      style={{ 
                        height: `${((contest.newRating - 800) / (3500 - 800)) * 100}%`,
                        backgroundColor: contest.newRating > contest.oldRating ? '#10b981' : '#ef4444'
                      }}
                      title={`Contest ${contest.contestId}: ${contest.oldRating} → ${contest.newRating}`}
                    >
                      <div className="cf-rating-tooltip">
                        <div className="cf-tooltip-contest">{contest.contestName}</div>
                        <div className="cf-tooltip-rating">{contest.oldRating} → {contest.newRating}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="cf-rating-info">
                  <span>Last 20 contests</span>
                  <span>Current: {userInfo.rating}</span>
                </div>
              </div>
            </div>
          )}

          {/* Recent Submissions */}
          <div className="cf-chart-card">
            <h3 className="cf-chart-title">
              <Clock className="cf-icon" />
              Recent Submissions
            </h3>
            <div className="cf-submissions-table">
              <div className="cf-table-header">
                <div>Problem</div>
                <div>Verdict</div>
                <div>Language</div>
                <div>Time</div>
              </div>
              <div className="cf-table-body">
                {submissions.slice(0, 10).map((submission, index) => (
                  <div key={index} className="cf-table-row">
                    <div className="cf-problem-cell">
                      <a 
                        href={`https://codeforces.com/contest/${submission.problem.contestId}/problem/${submission.problem.index}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cf-problem-link"
                      >
                        {submission.problem.contestId}{submission.problem.index} - {submission.problem.name}
                      </a>
                      {submission.problem.rating && (
                        <span className="cf-problem-rating">
                          {submission.problem.rating}
                        </span>
                      )}
                    </div>
                    <div className="cf-verdict-cell">
                      <span 
                        className="cf-verdict-badge"
                        style={{ backgroundColor: getVerdictColor(submission.verdict) }}
                      >
                        {submission.verdict}
                      </span>
                    </div>
                    <div className="cf-language-cell">
                      {submission.programmingLanguage}
                    </div>
                    <div className="cf-time-cell">
                      {new Date(submission.creationTimeSeconds * 1000).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {!userInfo && !loading && !error && !comparisonMode && (
        <div className="cf-empty-state">
          <User className="cf-empty-icon" />
          <h3>No Data Available</h3>
          <p>Enter your Codeforces handle above to view your analytics</p>
        </div>
      )}
    </div>
  );
};

export default CodeforcesAnalyzer;