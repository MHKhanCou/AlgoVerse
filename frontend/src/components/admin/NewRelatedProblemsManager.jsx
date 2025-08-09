import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Filter,
  SortAsc,
  SortDesc,
  Target,
  Code,
  Globe
} from 'lucide-react';
import '../../styles/admin/NewRelatedProblemsManager.css';

const NewRelatedProblemsManager = () => {
  const [problems, setProblems] = useState([]);
  const [algorithms, setAlgorithms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProblem, setEditingProblem] = useState(null);

  // Mock data for demonstration
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setProblems([
        {
          id: 1,
          title: "Two Sum",
          platform: "LeetCode",
          difficulty: "easy",
          problem_url: "https://leetcode.com/problems/two-sum/",
          algorithm_id: 1,
          algorithm_name: "Binary Search",
          status: "approved",
          created_at: "2024-01-15T10:30:00Z",
          tags: "array,hash-table"
        },
        {
          id: 2,
          title: "Binary Search Implementation",
          platform: "Codeforces",
          difficulty: "medium",
          problem_url: "https://codeforces.com/problem/1234/A",
          algorithm_id: 1,
          algorithm_name: "Binary Search",
          status: "pending",
          created_at: "2024-01-14T15:45:00Z",
          tags: "binary-search,implementation"
        }
      ]);
      
      setAlgorithms([
        { id: 1, name: "Binary Search" },
        { id: 2, name: "Quick Sort" },
        { id: 3, name: "Merge Sort" }
      ]);
      
      setLoading(false);
    }, 1000);
  }, []);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
      case 'easy':
        return 'difficulty-easy';
      case 'medium':
        return 'difficulty-medium';
      case 'hard':
        return 'difficulty-hard';
      case 'expert':
        return 'difficulty-expert';
      default:
        return 'difficulty-medium';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="status-icon approved" />;
      case 'pending':
        return <Clock className="status-icon pending" />;
      case 'rejected':
        return <AlertCircle className="status-icon rejected" />;
      default:
        return <Clock className="status-icon pending" />;
    }
  };

  const getPlatformIcon = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'leetcode':
        return <Code className="platform-icon leetcode" />;
      case 'codeforces':
        return <Target className="platform-icon codeforces" />;
      default:
        return <Globe className="platform-icon default" />;
    }
  };

  const filteredProblems = problems.filter(problem => {
    const matchesSearch = problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         problem.algorithm_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || problem.status === statusFilter;
    const matchesPlatform = platformFilter === 'all' || problem.platform.toLowerCase() === platformFilter.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesPlatform;
  });

  const sortedProblems = [...filteredProblems].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'created_at') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  if (loading) {
    return (
      <div className="new-problems-manager">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading problems...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="new-problems-manager">
      {/* Header */}
      <div className="manager-header">
        <div className="header-title">
          <Target className="header-icon" />
          <div>
            <h1>Related Problems Manager</h1>
            <p>Manage algorithm practice problems and their associations</p>
          </div>
        </div>
        <button 
          className="btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="btn-icon" />
          Add Problem
        </button>
      </div>

      {/* Filters and Search */}
      <div className="manager-controls">
        <div className="search-container">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search problems or algorithms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters-container">
          <div className="filter-group">
            <Filter className="filter-icon" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="filter-group">
            <Globe className="filter-icon" />
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Platforms</option>
              <option value="leetcode">LeetCode</option>
              <option value="codeforces">Codeforces</option>
              <option value="atcoder">AtCoder</option>
              <option value="codechef">CodeChef</option>
            </select>
          </div>

          <div className="sort-group">
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="sort-btn"
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              {sortOrder === 'asc' ? <SortAsc /> : <SortDesc />}
            </button>
          </div>
        </div>
      </div>

      {/* Problems Grid */}
      <div className="problems-grid">
        {sortedProblems.length === 0 ? (
          <div className="empty-state">
            <Target className="empty-icon" />
            <h3>No problems found</h3>
            <p>
              {searchQuery || statusFilter !== 'all' || platformFilter !== 'all'
                ? 'Try adjusting your filters or search query'
                : 'Start by adding your first problem'}
            </p>
          </div>
        ) : (
          sortedProblems.map((problem) => (
            <div key={problem.id} className="problem-card">
              <div className="card-header">
                <div className="problem-title-section">
                  <h3 className="problem-title">{problem.title}</h3>
                  <div className="problem-meta">
                    <span className="algorithm-tag">
                      <Code className="meta-icon" />
                      {problem.algorithm_name}
                    </span>
                  </div>
                </div>
                <div className="card-status">
                  {getStatusIcon(problem.status)}
                </div>
              </div>

              <div className="card-body">
                <div className="problem-details">
                  <div className="detail-row">
                    <div className="platform-info">
                      {getPlatformIcon(problem.platform)}
                      <span className="platform-name">{problem.platform}</span>
                    </div>
                    <span className={`difficulty-badge ${getDifficultyColor(problem.difficulty)}`}>
                      {problem.difficulty}
                    </span>
                  </div>

                  {problem.tags && (
                    <div className="tags-container">
                      {problem.tags.split(',').slice(0, 3).map((tag, index) => (
                        <span key={index} className="tag">
                          {tag.trim()}
                        </span>
                      ))}
                      {problem.tags.split(',').length > 3 && (
                        <span className="tag-more">
                          +{problem.tags.split(',').length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="card-footer">
                  <div className="problem-actions">
                    <a
                      href={problem.problem_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary btn-sm"
                      title="Open Problem"
                    >
                      <ExternalLink className="btn-icon" />
                    </a>
                    <button
                      onClick={() => setEditingProblem(problem)}
                      className="btn-secondary btn-sm"
                      title="Edit Problem"
                    >
                      <Edit3 className="btn-icon" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this problem?')) {
                          // Handle delete
                        }
                      }}
                      className="btn-danger btn-sm"
                      title="Delete Problem"
                    >
                      <Trash2 className="btn-icon" />
                    </button>
                  </div>
                  <div className="problem-date">
                    {new Date(problem.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats Summary */}
      <div className="stats-summary">
        <div className="stat-item">
          <span className="stat-value">{problems.length}</span>
          <span className="stat-label">Total Problems</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">
            {problems.filter(p => p.status === 'approved').length}
          </span>
          <span className="stat-label">Approved</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">
            {problems.filter(p => p.status === 'pending').length}
          </span>
          <span className="stat-label">Pending</span>
        </div>
      </div>
    </div>
  );
};

export default NewRelatedProblemsManager;