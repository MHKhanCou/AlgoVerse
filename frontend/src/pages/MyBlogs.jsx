import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import '../styles/MyBlogs.css';
import UserLink from '../components/common/UserLink';

const EMPTY_MESSAGES = {
  all: "You haven't created any blogs yet.",
  approved: "You don't have any approved blogs.",
  pending: "You don't have any blogs awaiting review.",
  rejected: "You don't have any rejected blogs.",
};

const MyBlogs = () => {
  // eslint-disable-next-line no-unused-vars
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
        // eslint-disable-next-line no-unused-vars
        const token = localStorage.getItem('token');
        const params = { skip: (page - 1) * limit, limit };
        if (statusFilter !== 'all') {
          params.status_filter = statusFilter;
        }
        const response = await api.get('/profile/my-blogs', { params });
        setBlogs(response.data);
        setHasMore(response.data.length === limit);
      } catch {
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
            className={`segmented-button ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => { setPage(1); setStatusFilter('pending'); }}
          >
            Pending
          </button>
          <button
            className={`segmented-button ${statusFilter === 'rejected' ? 'active' : ''}`}
            onClick={() => { setPage(1); setStatusFilter('rejected'); }}
          >
            Rejected
          </button>
        </div>
      </div>
      <div className="blogs-list">
        {blogs.length === 0 ? (
          <p>{EMPTY_MESSAGES[statusFilter]}</p>
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
              {blog.admin_feedback && (
                <p className="blog-feedback">Reviewer feedback: {blog.admin_feedback}</p>
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
