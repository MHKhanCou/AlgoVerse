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
  AlertCircle
} from 'lucide-react';

const CodeforcesDashboard = ({ handle }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});

  useEffect(() => {
    if (handle) {
      fetchCodeforcesData();
    }
  }, [handle]);

  const fetchCodeforcesData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch user info
      const userResponse = await fetch(`https://codeforces.com/api/user.info?handles=${handle}`);
      const userData = await userResponse.json();
      
      if (userData.status !== 'OK') {
        throw new Error('User not found');
      }

      setUserInfo(userData.result[0]);

      // Fetch user submissions
      const submissionsResponse = await fetch(`https://codeforces.com/api/user.status?handle=${handle}&from=1&count=1000`);
      const submissionsData = await submissionsResponse.json();
      
      if (submissionsData.status === 'OK') {
        setSubmissions(submissionsData.result);
        calculateStats(submissionsData.result);
      }

      // Fetch contest ratings
      const ratingsResponse = await fetch(`https://codeforces.com/api/user.rating?handle=${handle}`);
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
      languageCount,
      verdictCount,
      tagCount,
      ratingCount
    });
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
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading Codeforces data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="text-center py-8">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-600">Please enter a valid Codeforces handle</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Profile Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center gap-4">
          {userInfo.avatar && (
            <img 
              src={userInfo.avatar} 
              alt={userInfo.handle}
              className="w-16 h-16 rounded-full border-2 border-white"
            />
          )}
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{userInfo.handle}</h2>
            {userInfo.firstName && userInfo.lastName && (
              <p className="text-blue-100">{userInfo.firstName} {userInfo.lastName}</p>
            )}
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <Trophy className="w-4 h-4" />
                <span 
                  className="font-semibold"
                  style={{ color: getRankColor(userInfo.rank) }}
                >
                  {userInfo.rank || 'Unrated'}
                </span>
              </div>
              {userInfo.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  <span className="font-semibold">{userInfo.rating}</span>
                </div>
              )}
              {userInfo.maxRating && (
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">Max: {userInfo.maxRating}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Problems Solved</p>
              <p className="text-2xl font-bold text-green-600">{stats.totalSolved}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Problems Attempted</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalAttempted}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Submissions</p>
              <p className="text-2xl font-bold text-purple-600">{stats.totalSubmissions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Award className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Contests</p>
              <p className="text-2xl font-bold text-orange-600">{contests.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verdict Distribution */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Submission Verdicts
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.verdictCount || {})
              .sort(([,a], [,b]) => b - a)
              .slice(0, 6)
              .map(([verdict, count]) => (
                <div key={verdict} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getVerdictColor(verdict) }}
                    ></div>
                    <span className="text-sm font-medium">
                      {verdict.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">{count}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Problem Tags */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Popular Tags
          </h3>
          <div className="space-y-2">
            {Object.entries(stats.tagCount || {})
              .sort(([,a], [,b]) => b - a)
              .slice(0, 8)
              .map(([tag, count]) => (
                <div key={tag} className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">
                    {tag.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ 
                          width: `${(count / Math.max(...Object.values(stats.tagCount || {}))) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Rating Progress */}
      {contests.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Rating Progress
          </h3>
          <div className="h-64 flex items-end justify-between gap-1">
            {contests.slice(-20).map((contest, index) => (
              <div 
                key={index}
                className="bg-blue-500 rounded-t min-w-[8px] flex-1 relative group cursor-pointer"
                style={{ 
                  height: `${((contest.newRating - 800) / (3500 - 800)) * 100}%`,
                  backgroundColor: contest.newRating > contest.oldRating ? '#10b981' : '#ef4444'
                }}
                title={`Contest ${contest.contestId}: ${contest.oldRating} → ${contest.newRating}`}
              >
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {contest.contestName}<br/>
                  {contest.oldRating} → {contest.newRating}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>Last 20 contests</span>
            <span>Current: {userInfo.rating}</span>
          </div>
        </div>
      )}

      {/* Recent Submissions */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Recent Submissions
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Problem</th>
                <th className="text-left py-2">Verdict</th>
                <th className="text-left py-2">Language</th>
                <th className="text-left py-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {submissions.slice(0, 10).map((submission, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="py-2">
                    <a 
                      href={`https://codeforces.com/contest/${submission.problem.contestId}/problem/${submission.problem.index}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {submission.problem.contestId}{submission.problem.index} - {submission.problem.name}
                    </a>
                    {submission.problem.rating && (
                      <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                        {submission.problem.rating}
                      </span>
                    )}
                  </td>
                  <td className="py-2">
                    <span 
                      className="px-2 py-1 rounded text-xs font-medium text-white"
                      style={{ backgroundColor: getVerdictColor(submission.verdict) }}
                    >
                      {submission.verdict}
                    </span>
                  </td>
                  <td className="py-2 text-gray-600">
                    {submission.programmingLanguage}
                  </td>
                  <td className="py-2 text-gray-600">
                    {new Date(submission.creationTimeSeconds * 1000).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CodeforcesDashboard;