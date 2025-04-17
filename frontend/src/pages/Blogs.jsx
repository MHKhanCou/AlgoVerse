import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../styles/Blogs.css';

const Blogs = () => {
  const { isAuthenticated, user, isAdmin } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 5;
  const navigate = useNavigate();

  const fetchBlogs = async (pageNum = 1) => {
    try {
      const skip = (pageNum - 1) * limit;
      const response = await axios.get('http://localhost:8000/blogs/', {
        params: { skip, limit },
      });
      setBlogs(response.data);
      setHasMore(response.data.length === limit);
    } catch (error) {
      toast.error('Failed to fetch blogs', { theme: 'dark' });
    }
  };

  useEffect(() => {
    if (searchQuery) {
      const fetchSearchResults = async () => {
        try {
          const response = await axios.get(
            `http://localhost:8000/blogs/search/${encodeURIComponent(searchQuery)}`
          );
          setBlogs(response.data);
          setHasMore(false); // Disable pagination during search
        } catch (error) {
          toast.error('Search failed', { theme: 'dark' });
        }
      };
      fetchSearchResults();
    } else {
      fetchBlogs(page);
    }
  }, [searchQuery, page]);

  const handleCreateBlog = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error('Title and body are required', { theme: 'dark' });
      return;
    }
    if (title.length > 200) {
      toast.error('Title cannot exceed 200 characters', { theme: 'dark' });
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:8000/blogs/',
        { title, body },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Blog created successfully', { theme: 'dark' });
      setTitle('');
      setBody('');
      setShowCreateForm(false);
      setPage(1);
      fetchBlogs(1);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create blog', { theme: 'dark' });
    }
  };

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (hasMore) setPage(page + 1);
  };

  return (
    <div className="blogs-container">
      <h1>Blogs</h1>
      <div className="blogs-header">
        <input
          type="text"
          placeholder="Search blogs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        {isAuthenticated && (
          <div className="user-actions">
            <button
              className="cta-button primary"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              {showCreateForm ? 'Cancel' : 'Create Blog'}
            </button>
            <Link to="/my-blogs" className="cta-button secondary">
              Manage My Blogs
            </Link>
          </div>
        )}
      </div>

      {showCreateForm && isAuthenticated && (
        <form className="create-blog-form" onSubmit={handleCreateBlog}>
          <div className="form-group">
            <label htmlFor="blog-title">Title</label>
            <input
              id="blog-title"
              type="text"
              placeholder="Enter blog title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              maxLength={200}
              required
            />
            <small>{title.length}/200 characters</small>
          </div>
          <div className="form-group">
            <label htmlFor="blog-body">Content</label>
            <textarea
              id="blog-body"
              placeholder="Write your blog content here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="form-textarea"
              required
            />
          </div>
          <div className="form-buttons">
            <button type="submit" className="cta-button primary">
              Submit Blog
            </button>
            <button
              type="button"
              className="cta-button secondary"
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="blogs-list">
        {blogs.length === 0 ? (
          <p>No blogs found</p>
        ) : (
          blogs.map((blog) => (
            <div key={blog.id} className="blog-card">
              <Link to={`/blogs/${blog.id}`} className="blog-title">
                <h3>{blog.title}</h3>
              </Link>
              <p className="blog-author">By {blog.author}</p>
              <p className="blog-meta">
                Created: {new Date(blog.created_at).toLocaleDateString()} | Updated:{' '}
                {new Date(blog.updated_at).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>

      {!searchQuery && (
        <div className="pagination">
          <button
            onClick={handlePrevPage}
            disabled={page === 1}
            className="cta-button secondary"
          >
            Previous
          </button>
          <span>Page {page}</span>
          <button
            onClick={handleNextPage}
            disabled={!hasMore}
            className="cta-button secondary"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Blogs;