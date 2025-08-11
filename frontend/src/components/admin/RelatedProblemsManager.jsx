import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
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
import '../../styles/admin/RelatedProblemsManager.css';

const RelatedProblemsManager = () => {
  const [problems, setProblems] = useState([]);
  const [algorithms, setAlgorithms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [editingProblem, setEditingProblem] = useState(null);
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'pending'
  const inlineFormContentRef = useRef(null);
  const [inlineMaxHeight, setInlineMaxHeight] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    platform: 'LeetCode',
    difficulty: 'easy',
    problem_url: '',
    problem_id: '',
    algorithm_id: '',
    tags: '',
    description: ''
  });

  // Fetch problems and algorithms from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Fetch problems based on view mode
        const endpoint = viewMode === 'pending' 
          ? 'http://localhost:8000/api/problems/pending'
          : 'http://localhost:8000/api/problems/all';
          
        const problemsResponse = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!problemsResponse.ok) {
          const errorData = await problemsResponse.json();
          throw new Error(errorData.detail || 'Failed to fetch problems');
        }
        
        const problemsData = await problemsResponse.json();
        setProblems(problemsData);
        
        // Fetch algorithms
        const algorithmsResponse = await fetch('http://localhost:8000/algorithms', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!algorithmsResponse.ok) {
          const errorData = await algorithmsResponse.json();
          throw new Error(errorData.detail || 'Failed to fetch algorithms');
        }
        
        const algorithmsData = await algorithmsResponse.json();
        setAlgorithms(algorithmsData);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error(error.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [viewMode]);

  // Smoothly expand/collapse inline form by measuring content height
  useEffect(() => {
    const el = inlineFormContentRef.current;
    if (!el) return;
    let ro;
    if (showInlineForm) {
      const updateHeight = () => setInlineMaxHeight(el.scrollHeight + 16); // small buffer
      // next frame for accurate layout
      requestAnimationFrame(updateHeight);
      // observe any size changes (e.g., responsive wraps, fonts, async data)
      ro = new ResizeObserver(() => updateHeight());
      ro.observe(el);
    } else {
      setInlineMaxHeight(0);
    }
    return () => {
      if (ro) ro.disconnect();
    };
  }, [showInlineForm]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Submit new problem
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');
      
      const response = await fetch('http://localhost:8000/api/problems', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          platform: formData.platform,
          difficulty: formData.difficulty,
          problem_url: formData.problem_url,
          problem_id: formData.problem_id || undefined,
          description: formData.description || undefined,
          // send CSV string; backend now also accepts list, but CSV keeps API readable
          tags: (formData.tags || '').trim(),
          algorithm_id: formData.algorithm_id ? Number(formData.algorithm_id) : undefined,
          source: 'Manual'
        })
      });
      
      if (!response.ok) {
        let detail = 'Failed to add problem';
        try {
          const errorData = await response.json();
          if (errorData?.detail) {
            if (Array.isArray(errorData.detail)) {
              detail = errorData.detail.map(d => `${d.loc?.join('.')}: ${d.msg}`).join('; ');
            } else if (typeof errorData.detail === 'string') {
              detail = errorData.detail;
            } else {
              detail = JSON.stringify(errorData.detail);
            }
          }
        } catch (_) {}
        throw new Error(detail);
      }
      
      const newProblem = await response.json();
      setProblems(prev => [newProblem, ...prev]);
      setShowInlineForm(false);
      setFormData({
        title: '',
        platform: 'LeetCode',
        difficulty: 'easy',
        problem_url: '',
        problem_id: '',
        algorithm_id: '',
        tags: '',
        description: ''
      });
      
      toast.success('Problem added successfully!');
      
    } catch (error) {
      console.error('Error adding problem:', error);
      toast.error(error.message || 'Failed to add problem');
    }
  };

  // Handle status update
  const handleStatusUpdate = async (problemId, newStatus) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:8000/api/problems/${problemId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update problem status');
      }
      
      // Update the problem status in the UI
      const updatedProblems = problems.map(problem => 
        problem.id === problemId ? { ...problem, status: newStatus } : problem
      );
      
      setProblems(updatedProblems);
      toast.success(`Problem ${newStatus} successfully`);
      
    } catch (error) {
      console.error('Error updating problem status:', error);
      toast.error(error.message || 'Failed to update problem status');
    } finally {
      setLoading(false);
    }
  };

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
    if (!status) return <Clock className="status-icon pending" />;
    
    switch (status.toLowerCase()) {
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

  // Handle auto-suggest problems for an algorithm
  const handleAutoSuggest = async (algorithmId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:8000/api/problems/auto-suggest/${algorithmId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to auto-suggest problems');
      }
      
      const suggestedProblems = await response.json();
      toast.success(`Auto-suggested ${suggestedProblems.length} problems`);
      
      // Refresh the problems list
      const fetchData = async () => {
        const endpoint = viewMode === 'pending' 
          ? 'http://localhost:8000/api/problems/pending'
          : 'http://localhost:8000/api/problems/all';
          
        const problemsResponse = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (problemsResponse.ok) {
          const problemsData = await problemsResponse.json();
          setProblems(problemsData);
        }
      };
      
      await fetchData();
      
    } catch (error) {
      console.error('Error auto-suggesting problems:', error);
      toast.error(error.message || 'Failed to auto-suggest problems');
    } finally {
      setLoading(false);
    }
  };

  // Constants for filters
  const platforms = [
    'LeetCode',
    'Codeforces',
    'AtCoder',
    'CodeChef',
    'HackerRank',
    'SPOJ',
    'UVa',
    'HackerEarth',
    'TopCoder',
    'GeeksforGeeks'
  ];
  const difficulties = ['easy', 'medium', 'hard', 'expert'];
  const statuses = ['pending', 'approved', 'rejected'];

  // Filter and sort problems
  const filteredProblems = problems
    .filter(problem => {
      const matchesSearch = searchQuery === '' || 
        problem.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        problem.tags?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
        problem.status?.toLowerCase() === statusFilter.toLowerCase();
      
      const matchesPlatform = platformFilter === 'all' || 
        problem.platform?.toLowerCase() === platformFilter.toLowerCase();
      
      return matchesSearch && matchesStatus && matchesPlatform;
    })
    .sort((a, b) => {
      if (sortOrder === 'asc') {
        return a[sortBy] > b[sortBy] ? 1 : -1;
      }
      return a[sortBy] < b[sortBy] ? 1 : -1;
    });

  if (loading) {
    return (
      <div className="problems-manager">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading problems...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="problems-manager">
      {/* Header */}
      <div className="manager-header">
        <h2>Related Problems Manager</h2>
        <div className="header-actions">
          <div className="view-mode-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'all' ? 'active' : ''}`}
              onClick={() => setViewMode('all')}
            >
              All Problems
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'pending' ? 'active' : ''}`}
              onClick={() => setViewMode('pending')}
            >
              Pending Only
            </button>
          </div>
          <button 
            className="add-btn"
            onClick={() => setShowInlineForm(prev => !prev)}
          >
            <Plus size={16} />
            Add Problem
          </button>
        </div>
      </div>

      {/* Inline Expandable Add Problem Form */}
      <div
        className={`inline-add-form ${showInlineForm ? 'open' : ''}`}
        style={{ maxHeight: `${inlineMaxHeight}px` }}
      >
        {showInlineForm && (
          <div className="inline-form-content" ref={inlineFormContentRef}>
            <div className="inline-form-header">
              <h3>Add New Problem</h3>
              <button 
                className="close-btn"
                onClick={() => setShowInlineForm(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="problem-form">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Platform *</label>
                  <select
                    name="platform"
                    value={formData.platform}
                    onChange={handleInputChange}
                    required
                  >
                    {platforms.map(platform => (
                      <option key={platform} value={platform}>
                        {platform}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Difficulty *</label>
                  <select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleInputChange}
                    required
                  >
                    {difficulties.map(difficulty => (
                      <option key={difficulty} value={difficulty}>
                        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Problem URL *</label>
                <input
                  type="url"
                  name="problem_url"
                  value={formData.problem_url}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Problem ID</label>
                <input
                  type="text"
                  name="problem_id"
                  value={formData.problem_id}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Algorithm *</label>
                <select
                  name="algorithm_id"
                  value={formData.algorithm_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Algorithm</option>
                  {algorithms.map(algo => (
                    <option key={algo.id} value={algo.id}>
                      {algo.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Tags (comma separated)</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="e.g., array, sorting, binary-search"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowInlineForm(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                >
                  Save Problem
                </button>
              </div>
            </form>
          </div>
        )}
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
          <div className="filter-group select-with-icon">
            <span className="select-leading-icon">
              {statusFilter === 'all' ? <Filter /> : getStatusIcon(statusFilter)}
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select has-icon"
            >
              <option value="all">All Status</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="filter-group select-with-icon">
            <span className="select-leading-icon">
              {platformFilter === 'all' ? <Globe /> : getPlatformIcon(platformFilter)}
            </span>
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="filter-select has-icon"
            >
              <option value="all">All Platforms</option>
              {platforms.map(platform => (
                <option key={platform} value={platform}>{platform}</option>
              ))}
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
        {filteredProblems.length === 0 ? (
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
          filteredProblems.map((problem) => (
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

      {/* Inline form replaces previous modal; modal removed */}

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

export default RelatedProblemsManager;