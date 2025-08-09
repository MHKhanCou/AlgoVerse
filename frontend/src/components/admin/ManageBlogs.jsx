import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Check, X, Edit, Trash2, Eye, Clock, Search } from 'lucide-react';
import '../../styles/admin/ManageBlogs.css';

const ManageBlogs = ({ blogs, searchQuery, setSearchQuery, fetchBlogs, adminService }) => {
  const [isUpdating, setIsUpdating] = useState({});

  const toggleBlogStatus = async (blogId, currentStatus) => {
    if (isUpdating[blogId]) return;

    setIsUpdating((prev) => ({ ...prev, [blogId]: true }));
    const newStatus = currentStatus === 'approved' ? 'pending' : 'approved';

    try {
      await adminService.updateBlogStatus(blogId, { status: newStatus });
      await fetchBlogs();
      toast.success(`Blog ${newStatus === 'approved' ? 'approved' : 'moved to pending'}`);
    } catch (error) {
      console.error('Error updating blog status:', error);
      toast.error(error.response?.data?.detail || 'Failed to update blog status');
    } finally {
      setIsUpdating((prev) => ({ ...prev, [blogId]: false }));
    }
  };

  const deleteBlog = async (blogId) => {
    if (!window.confirm('Are you sure you want to delete this blog? This action cannot be undone.')) {
      return;
    }

    try {
      await adminService.deleteBlog(blogId);
      await fetchBlogs();
      toast.success('Blog deleted successfully');
    } catch (error) {
      console.error('Error deleting blog:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete blog');
    }
  };

  const viewBlog = (blog) => {
    window.open(`/blogs/${blog.id}`, '_blank');
  };

  const filteredBlogs = blogs.filter((blog) => {
    const title = blog.title || ''; // Default to empty string if title is null/undefined
    const body = blog.body || ''; // Default to empty string if body is null/undefined
    const searchText = `${title} ${body}`.toLowerCase(); // Combine and lowercase safely
    return searchText.includes(searchQuery.toLowerCase());
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Check className="w-3 h-3 mr-1" /> Approved
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" /> Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  // Format author name from user object or use fallback
  const getAuthorName = (blog) => {
    // Check if author is directly available
    if (blog.author) {
      return blog.author;
    }
    // Handle case where user data is nested in a user object
    if (blog.user) {
      if (typeof blog.user === 'object') {
        // Check for name field first (from backend)
        if (blog.user.name) {
          return blog.user.name;
        }
        // Fallback to first_name + last_name
        if (blog.user.first_name && blog.user.last_name) {
          return `${blog.user.first_name} ${blog.user.last_name}`.trim();
        }
        // Fallback to username
        return blog.user.username || 'Unknown Author';
      }
      // Handle case where user is just a string (username)
      return blog.user;
    }
    // Fallback to author_name if user object is not available
    if (blog.author_name) {
      return blog.author_name;
    }
    // Last resort fallback
    console.log('No author name found for blog:', blog.id);
    return 'Unknown Author';
  };

  // Format author email
  const getAuthorEmail = (blog) => {
    if (blog.user && typeof blog.user === 'object' && blog.user.email) {
      return blog.user.email;
    }
    // Check for direct email field
    if (blog.author_email) {
      return blog.author_email;
    }
    // Check for email in user object if it's a string
    if (blog.user_email) {
      return blog.user_email;
    }
    return 'No email';
  };

  return (
    <div className="manage-blogs-container">
      <div className="manage-blogs-header">
        <h2>Blog Management</h2>
        <div className="search-container">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search blogs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="table-responsive">
        <table className="blogs-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Status</th>
              <th>Created</th>
              <th className="actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBlogs.length > 0 ? (
              filteredBlogs.map((blog) => (
                <tr key={blog.id} className="blog-row">
                  <td className="blog-title">
                    {blog.title || 'Untitled Blog'}
                  </td>
                  <td className="blog-author">
                    <div className="author-name">{getAuthorName(blog)}</div>
                    <div className="author-email">{getAuthorEmail(blog)}</div>
                  </td>
                  <td className="blog-status">
                    {getStatusBadge(blog.status || 'pending')}
                  </td>
                  <td className="blog-date">
                    {new Date(blog.created_at).toLocaleDateString()}
                  </td>
                  <td className="blog-actions actions">
                    <div className="table-actions">
                      <button
                        onClick={() => viewBlog(blog)}
                        className="cta-button secondary sm"
                        title="View Blog"
                      >
                        <Eye className="icon" />
                        View
                      </button>
                      <button
                        onClick={() => toggleBlogStatus(blog.id, blog.status)}
                        disabled={isUpdating[blog.id]}
                        className={`cta-button ${blog.status === 'approved' ? 'warning' : 'success'} sm`}
                        title={blog.status === 'approved' ? 'Mark as Pending' : 'Approve Blog'}
                      >
                        {blog.status === 'approved' ? <Clock className="icon" /> : <Check className="icon" />}
                        {blog.status === 'approved' ? 'Pending' : 'Approve'}
                      </button>
                      <button
                        onClick={() => deleteBlog(blog.id)}
                        className="cta-button danger sm"
                        title="Delete Blog"
                      >
                        <Trash2 className="icon" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-blogs">
                  {searchQuery 
                    ? `No blogs found matching "${searchQuery}"`
                    : 'No blogs found. Create your first blog to get started.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageBlogs;