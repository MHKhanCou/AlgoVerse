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
  Edit3
} from 'lucide-react';
import { toast } from 'react-toastify';
import '../styles/CodeforcesAnalyzer.css';

const PublicCodeforcesAnalyzer = ({ initialHandle = null, initialHandles = [] }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const [handle, setHandle] = useState(initialHandle || '');
  const [isEditing, setIsEditing] = useState(!initialHandle);

  // Comparison state (public view)
  const [comparisonHandles, setComparisonHandles] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);
  const [comparisonLoading, setComparisonLoading] = useState(false);

  useEffect(() => {
    // Determine handles from URL or props and initialize view
    const urlParams = new URLSearchParams(window.location.search);
    const urlHandles = urlParams.get('handles');

    let handlesFromUrl = [];
    if (urlHandles) {
      handlesFromUrl = urlHandles.split(',').map((s) => s.trim()).filter(Boolean);
    }

    const handles = handlesFromUrl.length > 0 ? handlesFromUrl : (Array.isArray(initialHandles) ? initialHandles : []);

    if (handles.length > 0) {
      setHandle(handles[0]);
      fetchCodeforcesData(handles[0]);
      // If there are multiple handles, set up comparison
      if (handles.length > 1) {
        setComparisonHandles(handles);
        fetchComparisonData(handles);
      } else {
        setComparisonHandles([]);
        setComparisonData([]);
      }
    } else if (initialHandle) {
      setHandle(initialHandle);
      fetchCodeforcesData(initialHandle);
    }
  }, [initialHandle, initialHandles]);

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

      // Fetch user submissions
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

  const calculateStats = (submissions) => {
    const solved = new Set();
    const attempted = new Set();
    const languageCount = {};
    const verdictCount = {};
    const tagCount = {};
    const ratingCount = {};

    submissions.forEach(submission => {
      const problemKey = `${submission.problem.contestId}-${submission.problem.index}`;
      attempted.add(problemKey);

      if (submission.verdict === 'OK') {
        solved.add(problemKey);
      }

      // Language stats
      languageCount[submission.programmingLanguage] = 
        (languageCount[submission.programmingLanguage] || 0) + 1;

      // Verdict stats
      verdictCount[submission.verdict] = 
        (verdictCount[submission.verdict] || 0) + 1;

      // Tag stats
      if (submission.problem.tags) {
        submission.problem.tags.forEach(tag => {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
      }

      // Rating stats
      if (submission.problem.rating) {
        const rating = Math.floor(submission.problem.rating / 100) * 100;
        ratingCount[rating] = (ratingCount[rating] || 0) + 1;
      }
    });

    setStats({
      totalSolved: solved.size,
      totalAttempted: attempted.size,
      totalSubmissions: submissions.length,
      successRate: attempted.size > 0 ? ((solved.size / attempted.size) * 100).toFixed(1) : 0,
      languageCount,
      verdictCount,
      tagCount,
      ratingCount
    });
  };

  // Lightweight per-user stats calculator for comparison table
  const calculateStatsForUser = (subs) => {
    const solved = new Set();
    const attempted = new Set();
    const verdictCount = {};
    subs.forEach((submission) => {
      const key = `${submission.problem.contestId}-${submission.problem.index}`;
      attempted.add(key);
      if (submission.verdict === 'OK') solved.add(key);
      verdictCount[submission.verdict] = (verdictCount[submission.verdict] || 0) + 1;
    });
    return {
      totalSolved: solved.size,
      totalAttempted: attempted.size,
      totalSubmissions: subs.length,
      successRate: attempted.size > 0 ? ((solved.size / attempted.size) * 100).toFixed(1) : 0,
      verdictCount,
    };
  };

  const fetchComparisonData = async (handles) => {
    setComparisonLoading(true);
    const results = [];
    try {
      for (const h of handles) {
        try {
          const userResponse = await fetch(`https://codeforces.com/api/user.info?handles=${h}`);
          const userData = await userResponse.json();
          if (userData.status !== 'OK') continue;

          const submissionsResponse = await fetch(`https://codeforces.com/api/user.status?handle=${h}&from=1&count=10000`);
          const submissionsData = await submissionsResponse.json();

          let userStats = {};
          if (submissionsData.status === 'OK') {
            userStats = calculateStatsForUser(submissionsData.result);
          }

          results.push({
            handle: h,
            userInfo: userData.result[0],
            stats: userStats,
          });
        } catch (err) {
          console.error(`Error fetching data for ${h}:`, err);
        }
      }
      setComparisonData(results);
    } catch (err) {
      toast.error('Failed to fetch comparison data');
    } finally {
      setComparisonLoading(false);
    }
  };

  const saveHandle = () => {
    if (!handle.trim()) {
      toast.warn('Please enter a handle');
      return;
    }
    setIsEditing(false);
    fetchCodeforcesData(handle.trim());
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

  return (
    <div className="cf-analyzer">
      {/* Handle Input Section */}
      <div className="cf-input-section">
        <div className="cf-input-header">
          <User className="cf-icon" />
          <h2>Codeforces Handle</h2>
        </div>
        
        <div className="cf-input-form">
          {isEditing ? (
            <div className="cf-input-group">
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="Enter Codeforces handle (e.g., tourist, Benq)"
                className="cf-handle-input"
                onKeyPress={(e) => e.key === 'Enter' && saveHandle()}
              />
              <button onClick={saveHandle} className="cf-btn cf-btn-primary">
                <Save className="cf-icon" />
                Load Data
              </button>
            </div>
          ) : (
            <div className="cf-handle-display">
              <span className="cf-current-handle">{handle}</span>
              <button onClick={() => setIsEditing(true)} className="cf-btn cf-btn-outline">
                <Edit3 className="cf-icon" />
                Change
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="cf-loading">
          <div className="cf-spinner"></div>
          <p>Loading Codeforces data...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="cf-error">
          <AlertCircle className="cf-icon" />
          <div>
            <h3>Error</h3>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Comparison Section (when multiple handles provided) */}
      {comparisonHandles.length > 1 && (
        <div className="cf-handle-section" style={{ marginTop: 0 }}>
          <div className="cf-section-title">Comparison</div>
          {comparisonLoading ? (
            <div className="cf-loading">Loading comparison…</div>
          ) : (
            <div className="cf-comparison-table">
              <div className="cf-comparison-header">
                <div>User</div>
                <div>Rank</div>
                <div>Current Rating</div>
                <div>Max Rating</div>
                <div>Solved</div>
                <div>Attempted</div>
                <div>Success</div>
              </div>
              {comparisonData.map((u) => (
                <div key={u.handle} className="cf-comparison-row">
                  <div className="cf-comparison-user">
                    <div className="cf-comparison-avatar" aria-hidden>
                      {String(u.userInfo.handle || '?').slice(0, 1).toUpperCase()}
                    </div>
                    <div className="cf-comparison-details">
                      <div className="cf-user-handle">
                        <a
                          className="cf-problem-link"
                          href={`https://codeforces.com/profile/${u.userInfo.handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {u.userInfo.handle}
                        </a>
                      </div>
                      <div className="cf-user-name">{u.userInfo.firstName || u.userInfo.lastName ? `${u.userInfo.firstName || ''} ${u.userInfo.lastName || ''}`.trim() : ''}</div>
                    </div>
                  </div>
                  <div className="cf-comparison-rank">
                    <span
                      className="cf-rank-badge"
                      style={{ backgroundColor: getRankColor(u.userInfo.rank) }}
                    >
                      {u.userInfo.rank || '—'}
                    </span>
                  </div>
                  <div className="cf-comparison-rating">{u.userInfo.rating ?? '—'}</div>
                  <div className="cf-comparison-max-rating cf-max-rating">{u.userInfo.maxRating ?? '—'}</div>
                  <div className="cf-comparison-stat">{u.stats?.totalSolved ?? 0}</div>
                  <div className="cf-comparison-stat">{u.stats?.totalAttempted ?? 0}</div>
                  <div className="cf-comparison-stat cf-success-rate">{u.stats?.successRate ?? 0}%</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* User Info Section */}
      {/* Single User Analytics */}
      {userInfo && (
        <>
          {/* User Info Card */}
          <div className="cf-user-card">
            <div className="cf-user-header">
              <div className="cf-user-avatar">
                {userInfo.titlePhoto ? (
                  <img src={userInfo.titlePhoto} alt={userInfo.handle} />
                ) : (
                  <User className="cf-avatar-icon" />
                )}
              </div>
              <div className="cf-user-info">
                <h2 className="cf-user-handle">{userInfo.handle}</h2>
                <div className="cf-user-details">
                  <span 
                    className="cf-rank-badge"
                    style={{ backgroundColor: getRankColor(userInfo.rank) }}
                  >
                    {userInfo.rank}
                  </span>
                  <span className="cf-rating" style={{ color: getRankColor(userInfo.rank) }}>
                    {userInfo.rating || 'Unrated'}
                  </span>
                  {userInfo.maxRating && (
                    <span className="cf-max-rating">
                      Max: {userInfo.maxRating}
                    </span>
                  )}
                </div>
                {userInfo.country && (
                  <div className="cf-country">
                    <span>{userInfo.country}</span>
                  </div>
                )}
              </div>
              <div className="cf-external-links">
                <a 
                  href={`https://codeforces.com/profile/${userInfo.handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cf-btn cf-btn-outline"
                >
                  <ExternalLink className="cf-icon" />
                  View Profile
                </a>
              </div>
            </div>
          </div>

          {/* Statistics Overview */}
          <div className="cf-stats-grid">
            <div className="cf-stat-card">
              <div className="cf-stat-icon">
                <CheckCircle className="cf-icon" />
              </div>
              <div className="cf-stat-content">
                <div className="cf-stat-number">{stats.totalSolved}</div>
                <div className="cf-stat-label">Problems Solved</div>
              </div>
            </div>

            <div className="cf-stat-card">
              <div className="cf-stat-icon">
                <Target className="cf-icon" />
              </div>
              <div className="cf-stat-content">
                <div className="cf-stat-number">{stats.totalAttempted}</div>
                <div className="cf-stat-label">Problems Attempted</div>
              </div>
            </div>

            <div className="cf-stat-card">
              <div className="cf-stat-icon">
                <Trophy className="cf-icon" />
              </div>
              <div className="cf-stat-content">
                <div className="cf-stat-number">{stats.successRate}%</div>
                <div className="cf-stat-label">Success Rate</div>
              </div>
            </div>

            <div className="cf-stat-card">
              <div className="cf-stat-icon">
                <Activity className="cf-icon" />
              </div>
              <div className="cf-stat-content">
                <div className="cf-stat-number">{stats.totalSubmissions}</div>
                <div className="cf-stat-label">Total Submissions</div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="cf-charts-grid">
            {/* Verdict Distribution */}
            <div className="cf-chart-card">
              <h3 className="cf-chart-title">
                <PieChart className="cf-icon" />
                Verdict Distribution
              </h3>
              <div className="cf-verdict-chart">
                {Object.entries(stats.verdictCount || {})
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 6)
                  .map(([verdict, count]) => (
                    <div key={verdict} className="cf-verdict-item">
                      <span 
                        className="cf-verdict-badge"
                        style={{ backgroundColor: getVerdictColor(verdict) }}
                      >
                        {verdict}
                      </span>
                      <span className="cf-verdict-count">{count}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Language Distribution */}
            <div className="cf-chart-card">
              <h3 className="cf-chart-title">
                <BarChart3 className="cf-icon" />
                Languages Used
              </h3>
              <div className="cf-language-chart">
                {Object.entries(stats.languageCount || {})
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([language, count]) => (
                    <div key={language} className="cf-language-item">
                      <span className="cf-language-name">{language}</span>
                      <div className="cf-language-bar">
                        <div 
                          className="cf-language-fill"
                          style={{ 
                            width: `${(count / Math.max(...Object.values(stats.languageCount))) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="cf-language-count">{count}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Problem Tags */}
            <div className="cf-chart-card">
              <h3 className="cf-chart-title">
                <Star className="cf-icon" />
                Problem Tags
              </h3>
              <div className="cf-tags-chart">
                {Object.entries(stats.tagCount || {})
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 8)
                  .map(([tag, count]) => (
                    <div key={tag} className="cf-tag-item">
                      <span className="cf-tag-name">{tag}</span>
                      <span className="cf-tag-count">{count}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="cf-chart-card">
              <h3 className="cf-chart-title">
                <Award className="cf-icon" />
                Problem Ratings
              </h3>
              <div className="cf-rating-chart">
                {Object.entries(stats.ratingCount || {})
                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                  .map(([rating, count]) => (
                    <div key={rating} className="cf-rating-item">
                      <span className="cf-rating-value">{rating}</span>
                      <div className="cf-rating-bar">
                        <div 
                          className="cf-rating-fill"
                          style={{ 
                            width: `${(count / Math.max(...Object.values(stats.ratingCount))) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="cf-rating-count">{count}</span>
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

      {!userInfo && !loading && !error && (
        <div className="cf-empty-state">
          <User className="cf-empty-icon" />
          <h3>No Data Available</h3>
          <p>Enter a Codeforces handle above to view analytics</p>
        </div>
      )}
    </div>
  );
};

export default PublicCodeforcesAnalyzer;
