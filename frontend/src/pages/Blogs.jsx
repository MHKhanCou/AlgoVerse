import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import UserLink from '../components/common/UserLink';
import { useAuth } from '../contexts/AuthContext';
import { useSearch } from '../contexts/SearchContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import { 
  Search, 
  BookOpen, 
  Plus, 
  Grid,
  List,
  Calendar,
  User,
  ChevronRight,
  Edit,
  Clock,
  ChevronLeft
} from 'lucide-react';
import '../styles/TopicListPage.css';

const Blogs = () => {
  const { isAuthenticated, user } = useAuth();
  const { searchQuery } = useSearch();
  const [blogs, setBlogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // Default to list
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchBlogs();
  }, []);

  // URL search params integration
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const search = params.get('search');
    const status = params.get('status');
    const sort = params.get('sort');
    const view = params.get('view') || 'list'; // Default to list
    const page = parseInt(params.get('page')) || 1;

    if (search) setSearchTerm(search);
    if (status) setSelectedStatus(status);
    if (sort) setSortBy(sort);
    setViewMode(view);
    setCurrentPage(page);
  }, [location.search]);

  // Use global search query
  useEffect(() => {
    if (searchQuery) {
      setSearchTerm(searchQuery);
    }
  }, [searchQuery]);

  const updateURL = (params) => {
    const searchParams = new URLSearchParams(location.search);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '' && value !== 1) {
        searchParams.set(key, value);
      } else {
        searchParams.delete(key);
      }
    });

    const newSearch = searchParams.toString();
    const newPath = newSearch ? `${location.pathname}?${newSearch}` : location.pathname;
    
    if (newPath !== `${location.pathname}${location.search}`) {
      navigate(newPath, { replace: true });
    }
  };

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      console.log('Fetching blogs...');
      const response = await api.get('/blogs');  // Removed trailing slash to match backend route
      console.log('Blogs response:', response.data);
      
      // Process blogs with search text
      const processedBlogs = response.data.map((blog) => ({
        ...blog,
        searchableText: `${blog.title} ${blog.author || ''}`.toLowerCase(),
      }));
      
      setBlogs(processedBlogs);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      toast.error('Failed to fetch blogs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
    updateURL({ search: value, status: selectedStatus, sort: sortBy, view: viewMode, page: 1 });
  };

  const handleStatusChange = (value) => {
    setSelectedStatus(value);
    setCurrentPage(1);
    updateURL({ search: searchTerm, status: value, sort: sortBy, view: viewMode, page: 1 });
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setCurrentPage(1);
    updateURL({ search: searchTerm, status: selectedStatus, sort: value, view: viewMode, page: 1 });
  };

  const handleViewChange = (value) => {
    setViewMode(value);
    updateURL({ search: searchTerm, status: selectedStatus, sort: sortBy, view: value, page: currentPage });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    updateURL({ search: searchTerm, status: selectedStatus, sort: sortBy, view: viewMode, page });
  };

  const handleCreateBlog = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error('Title and body are required');
      return;
    }
    if (title.length > 200) {
      toast.error('Title cannot exceed 200 characters');
      return;
    }
    try {
      await api.post('/blogs/', { title, body });
      toast.success('Blog created successfully');
      setTitle('');
      setBody('');
      setShowCreateForm(false);
      fetchBlogs(); // Refresh the blog list
    } catch (error) {
      console.error('Error creating blog:', error);
      toast.error(error.response?.data?.detail || 'Failed to create blog');
    }
  };

  // Enhanced search and filtering
  const filteredAndSortedBlogs = useMemo(() => {
    let filtered = blogs.filter(blog => {
      // Enhanced search functionality
      const searchTerms = searchTerm.toLowerCase().trim().split(/\s+/).filter(term => term.length > 0);
      
      let matchesSearch = true;
      if (searchTerms.length > 0) {
        matchesSearch = searchTerms.some(term => {
          return blog.title.toLowerCase().includes(term) ||
                 blog.author?.toLowerCase().includes(term) ||
                 blog.searchableText.includes(term);
        });
      }

      // Status filter
      const matchesStatus = selectedStatus === 'all' || blog.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'author':
          return (a.author || '').localeCompare(b.author || '');
        case 'newest':
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

    return filtered;
  }, [blogs, searchTerm, selectedStatus, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedBlogs.length / itemsPerPage);
  const paginatedBlogs = filteredAndSortedBlogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusClass = (status) => {
    switch (status) {
      case 'approved': return 'difficulty-easy';
      case 'pending': return 'difficulty-medium';
      case 'rejected': return 'difficulty-hard';
      default: return 'difficulty-medium';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return 'Published';
      case 'pending': return 'Pending';
      case 'rejected': return 'Rejected';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="topics-page">
        <div className="loading-state">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading blogs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="topics-page">
      <div className="topics-content">
        {/* Create Blog Section */}
        {isAuthenticated && (
          <div className="categories-section">
            <div className="section-title">
              <Edit className="filter-icon" />
              Share Your Knowledge
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="cf-btn cf-btn-primary"
                style={{ marginLeft: 'auto' }}
              >
                <Plus className="cf-icon-sm" />
                {showCreateForm ? 'Cancel' : 'Create Blog'}
              </button>
            </div>

            {showCreateForm && (
              <div className="search-filters" style={{ marginBottom: '1.5rem' }}>
                <form onSubmit={handleCreateBlog} style={{ width: '100%' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Title
                    </label>
                    <input
                      type="text"
                      placeholder="Enter blog title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="search-input"
                      maxLength={200}
                      required
                      style={{ width: '100%' }}
                    />
                    <small style={{ color: '#6b7280' }}>{title.length}/200 characters</small>
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Content
                    </label>
                    <textarea
                      placeholder="Write your blog content here..."
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      className="search-input"
                      required
                      rows={8}
                      style={{ width: '100%', resize: 'vertical' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button type="submit" className="cf-btn cf-btn-primary">
                      Submit Blog
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="cf-btn cf-btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Search and Filters */}
        <div className="search-filters">
          <div className="search-filters-content">
            {/* Search */}
            <div className="search-input-wrapper">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search blogs by title or author..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="search-input"
              />
            </div>

            {/* Filters */}
            <div className="filters-group">
              <div className="filter-group select-with-icon">
                <span className="select-leading-icon">
                  <Clock />
                </span>
                <select
                  value={selectedStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="filter-select has-icon"
                >
                  <option value="all">All Status</option>
                  <option value="approved">Published</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="filter-group select-with-icon">
                <span className="select-leading-icon">
                  <Calendar />
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="filter-select has-icon"
                >
                  <option value="newest">Sort by Newest</option>
                  <option value="oldest">Sort by Oldest</option>
                  <option value="title">Sort by Title</option>
                  <option value="author">Sort by Author</option>
                </select>
              </div>

              <div className="view-toggle">
                <button
                  onClick={() => handleViewChange('grid')}
                  className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                >
                  <Grid />
                </button>
                <button
                  onClick={() => handleViewChange('list')}
                  className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                >
                  <List />
                </button>
              </div>

              {isAuthenticated && (
                <Link to="/my-blogs" className="cf-btn cf-btn-secondary">
                  <User className="cf-icon-sm" />
                  My Blogs
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="results-info">
          Showing {Math.min(itemsPerPage, filteredAndSortedBlogs.length - (currentPage - 1) * itemsPerPage)} of {filteredAndSortedBlogs.length} blogs
          {selectedStatus !== 'all' && (
            <span>
              {' '}with <strong>{getStatusText(selectedStatus)}</strong> status
            </span>
          )}
          {searchTerm && (
            <span>
              {' '}matching "<strong>{searchTerm}</strong>"
            </span>
          )}
        </div>

        {/* Blogs Grid/List */}
        {viewMode === 'grid' ? (
          <div className="algorithms-grid">
            {paginatedBlogs.map((blog) => (
              <Link
                key={blog.id}
                to={`/blogs/${blog.id}`}
                className="algorithm-card"
              >
                <div className="algorithm-header">
                  <div className="algorithm-info">
                    <h3 className="algorithm-title">{blog.title}</h3>
                    <div className="algorithm-badges">
                      <span className={`difficulty-badge ${getStatusClass(blog.status)}`}>
                        {getStatusText(blog.status)}
                      </span>
                      <span className="category-badge">
                        <User className="cf-icon-sm" />
                        {blog.author_id ? (
                          <UserLink userId={blog.author_id} showDetails={false} />
                        ) : (
                          blog.author
                        )}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="category-arrow" />
                </div>

                <div className="algorithm-description">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar className="cf-icon-sm" />
                      {new Date(blog.created_at).toLocaleDateString()}
                    </div>
                    {blog.updated_at !== blog.created_at && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock className="cf-icon-sm" />
                        Updated {new Date(blog.updated_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="algorithms-list">
            {paginatedBlogs.map((blog) => (
              <Link
                key={blog.id}
                to={`/blogs/${blog.id}`}
                className="algorithm-list-item"
              >
                <div className="algorithm-list-content">
                  <div className="algorithm-list-header">
                    <h3 className="algorithm-list-title">{blog.title}</h3>
                    <div className="algorithm-list-stats">
                      <span className={`difficulty-badge ${getStatusClass(blog.status)}`}>
                        {getStatusText(blog.status)}
                      </span>
                      <span className="category-badge">
                        <User className="cf-icon-sm" />
                        {blog.author_id ? (
                          <UserLink userId={blog.author_id} showDetails={false} />
                        ) : (
                          blog.author
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="algorithm-list-description">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar className="cf-icon-sm" />
                        Created {new Date(blog.created_at).toLocaleDateString()}
                      </div>
                      {blog.updated_at !== blog.created_at && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock className="cf-icon-sm" />
                          Updated {new Date(blog.updated_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="algorithm-list-arrow" />
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              <ChevronLeft className="pagination-icon" />
              Previous
            </button>
            
            <div className="pagination-info">
              Page {currentPage} of {totalPages}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              Next
              <ChevronRight className="pagination-icon" />
            </button>
          </div>
        )}

        {filteredAndSortedBlogs.length === 0 && (
          <div className="empty-state">
            <BookOpen />
            <h3>No blogs found</h3>
            <p>
              {searchTerm 
                ? "Try adjusting your search terms or filters to find what you're looking for."
                : "No blogs have been published yet. Be the first to share your knowledge!"
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Blogs;