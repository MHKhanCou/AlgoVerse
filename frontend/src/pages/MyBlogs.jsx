import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import '../styles/MyBlogs.css';
import UserLink from '../components/common/UserLink';

const MyBlogs = () => {
  const { isAuthenticated, user } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [statusFilter, setStatusFilter] = useState('approved'); // 'all' | 'approved' | 'unapproved'
  const limit = 5;

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchMyBlogs = async () => {
      try {
        const token = localStorage.getItem('token');
        const params = { skip: (page - 1) * limit, limit };
        if (statusFilter !== 'all') {
          params.status_filter = statusFilter;
        }
        const response = await api.get('/profile/my-blogs', { params });
        setBlogs(response.data);
        setHasMore(response.data.length === limit);
      } catch (error) {
        toast.error('Failed to fetch your blogs', { theme: 'dark' });
      }
    };
    fetchMyBlogs();
  }, [isAuthenticated, page, statusFilter]);

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (hasMore) setPage(page + 1);
  };

  if (!isAuthenticated) {
    return <div className="error">Please log in to view your blogs.</div>;
  }

  return (
    <div className="my-blogs-container">
      <h1>My Blogs</h1>
      <div className="my-blogs-toolbar">
        <Link to="/blogs" className="cta-button secondary">
          Back to All Blogs
        </Link>
        <div className="segmented-buttons">
          <button
            className={`segmented-button ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => { setPage(1); setStatusFilter('all'); }}
          >
            All
          </button>
          <button
            className={`segmented-button ${statusFilter === 'approved' ? 'active' : ''}`}
            onClick={() => { setPage(1); setStatusFilter('approved'); }}
          >
            Approved
          </button>
          <button
            className={`segmented-button ${statusFilter === 'unapproved' ? 'active' : ''}`}
            onClick={() => { setPage(1); setStatusFilter('unapproved'); }}
          >
            Pending
          </button>
        </div>
      </div>
      <div className="blogs-list">
        {blogs.length === 0 ? (
          <p>
            {statusFilter === 'all'
              ? "You haven't created any blogs yet."
              : statusFilter === 'approved'
                ? "You don't have any approved blogs."
                : "You don't have any pending blogs."}
          </p>
        ) : (
          blogs.map((blog) => (
            <div key={blog.id} className="blog-card">
              <Link to={`/blogs/${blog.id}`} className="blog-title">
                <h3>{blog.title}</h3>
              </Link>
              <p className="blog-author">By {blog.author_id ? (
                <UserLink userId={blog.author_id} to={`/users/${blog.author_id}`} showDetails={false} />
              ) : (
                blog.author
              )}
              </p>
              <p className="blog-meta">
                Created: {new Date(blog.created_at).toLocaleDateString()} | Updated:{' '}
                {new Date(blog.updated_at).toLocaleDateString()}
              </p>
              {blog.status && (
                <p className="blog-status" style={{ marginTop: '6px' }}>
                  Status: <strong>{String(blog.status).toUpperCase()}</strong>
                </p>
              )}
            </div>
          ))
        )}
      </div>
      <div className="pagination">
        <button
          onClick={handlePrevPage}
          disabled={page === 1}
          className="pagination-btn"
        >
          Previous
        </button>
        <div className="pagination-info">Page {page}</div>
        <button
          onClick={handleNextPage}
          disabled={!hasMore}
          className="pagination-btn"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default MyBlogs;