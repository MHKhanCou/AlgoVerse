import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import CommentSection from '../components/CommentSection';
import UserLink from '../components/common/UserLink';
import '../styles/SingleBlog.css';

const SingleBlog = () => {
  const { id } = useParams();
  const { isAuthenticated, user, isAdmin } = useAuth();
  const [blog, setBlog] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/blogs/${id}`);
        setBlog(response.data);
        setTitle(response.data.title);
        setBody(response.data.body);
      } catch (error) {
        toast.error('Failed to fetch blog', { theme: 'dark' });
        navigate('/blogs');
      }
    };
    fetchBlog();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this blog?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/blogs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Blog deleted successfully', { theme: 'dark' });
      navigate('/blogs');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete blog', { theme: 'dark' });
    }
  };

  const handleUpdate = async (e) => {
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
      const response = await axios.put(
        `http://localhost:8000/blogs/${id}`,
        { title, body },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBlog(response.data);
      setIsEditing(false);
      toast.success('Blog updated successfully', { theme: 'dark' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update blog', { theme: 'dark' });
    }
  };

  if (!blog) {
    return <div className="loading">Loading...</div>;
  }

  const isOwner = isAuthenticated && user && blog.author === user.name;
  const canManage = isOwner || isAdmin;

  return (
    <div className="single-blog-container">
      {isEditing ? (
        <form className="edit-blog-form" onSubmit={handleUpdate}>
          <div className="form-group">
            <label htmlFor="edit-title">Title</label>
            <input
              id="edit-title"
              type="text"
              placeholder="Blog Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              maxLength={200}
              required
            />
            <small>{title.length}/200 characters</small>
          </div>
          <div className="form-group">
            <label htmlFor="edit-body">Content</label>
            <textarea
              id="edit-body"
              placeholder="Blog Content"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="form-textarea"
              required
            />
          </div>
          <div className="form-buttons">
            <button type="submit" className="cta-button primary">
              Save Changes
            </button>
            <button
              type="button"
              className="cta-button secondary"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <h1>{blog.title}</h1>
          <p className="blog-meta">
            By {blog.author_id ? (
              <UserLink userId={blog.author_id} to={`/users/${blog.author_id}`} showDetails={false} />
            ) : (
              blog.author
            )} | Created: {new Date(blog.created_at).toLocaleDateString()} | Updated:{' '}
            {new Date(blog.updated_at).toLocaleDateString()}
          </p>
          <div className="blog-body">{blog.body}</div>
          {canManage && (
            <div className="blog-actions">
              <button className="cta-button primary" onClick={() => setIsEditing(true)}>
                Edit Blog
              </button>
              <button className="cta-button tertiary" onClick={handleDelete}>
                Delete Blog
              </button>
            </div>
          )}
          
          {/* Comment Section */}
          <CommentSection blogId={parseInt(id)} user={user} />
        </>
      )}
    </div>
  );
};

export default SingleBlog;