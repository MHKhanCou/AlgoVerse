import React from 'react';
import { toast } from 'react-toastify';

const ManageBlogs = ({ blogs, searchQuery, fetchBlogs, adminService }) => {
  const updateBlog = async (blogId) => {
    const blog = blogs.find((b) => b.id === blogId);
    const newTitle = prompt('Enter new title:', blog.title);
    const newBody = prompt('Enter new body:', blog.body);
    if (newTitle && newBody) {
      try {
        await adminService.updateBlog(blogId, { title: newTitle, body: newBody });
        await fetchBlogs();
        toast.success('Blog updated');
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Failed to update blog');
      }
    }
  };

  const deleteBlog = async (blogId) => {
    if (window.confirm('Are you sure you want to delete this blog?')) {
      try {
        await adminService.deleteBlog(blogId);
        await fetchBlogs();
        toast.success('Blog deleted');
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Failed to delete blog');
      }
    }
  };

  // Log blogs to debug
  console.log('Blogs in ManageBlogs:', blogs);

  const filteredBlogs = blogs.filter((blog) => {
    const title = blog.title || ''; // Default to empty string if title is null/undefined
    const body = blog.body || ''; // Default to empty string if body is null/undefined
    const searchText = `${title} ${body}`.toLowerCase(); // Combine and lowercase safely
    return searchText.includes(searchQuery.toLowerCase());
  });

  return (
    <section className="manage-section">
      <h2>Manage Blogs</h2>
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Author</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredBlogs.length > 0 ? (
            filteredBlogs.map((blog) => (
              <tr key={blog.id}>
                <td>{blog.id}</td>
                <td>{blog.title || 'N/A'}</td>
                <td>{blog.author || 'Unknown'}</td>
                <td>{blog.created_at ? new Date(blog.created_at).toLocaleDateString() : 'N/A'}</td>
                <td>
                  <button onClick={() => updateBlog(blog.id)} className="action-btn edit">
                    Edit
                  </button>
                  <button onClick={() => deleteBlog(blog.id)} className="action-btn delete">
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5">No blogs found.</td>
            </tr>
          )}
        </tbody>
      </table>
      {filteredBlogs.length === 0 && searchQuery && (
        <p className="no-results">No blogs found matching "{searchQuery}".</p>
      )}
    </section>
  );
};

export default ManageBlogs;