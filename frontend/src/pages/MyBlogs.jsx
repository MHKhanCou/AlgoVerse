import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import UserLink from '../components/common/UserLink';

import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../styles/MyBlogs.css';

const MyBlogs = () => {
  const { isAuthenticated, user } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 5;

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchMyBlogs = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:8000/profile/my-blogs', {
          headers: { Authorization: `Bearer ${token}` },
          params: { skip: (page - 1) * limit, limit },
        });
        setBlogs(response.data);
        setHasMore(response.data.length === limit);
      } catch (error) {
        toast.error('Failed to fetch your blogs', { theme: 'dark' });
      }
    };
    fetchMyBlogs();
  }, [isAuthenticated, page]);

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
      <Link to="/blogs" className="cta-button secondary">
        Back to All Blogs
      </Link>
      <div className="blogs-list">
        {blogs.length === 0 ? (
          <p>You haven't created any blogs yet.</p>
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
            </div>
          ))
        )}
      </div>
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
    </div>
  );
};

export default MyBlogs;