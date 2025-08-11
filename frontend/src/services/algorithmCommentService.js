const API_BASE = 'http://localhost:8000';

export const algorithmCommentService = {
  /**
   * Get all comments for a specific algorithm
   * @param {number} algorithmId - The algorithm ID
   * @returns {Promise<Array>} Array of comments with nested replies
   */
  async getComments(algorithmId) {
    try {
      const response = await fetch(`${API_BASE}/comments/algorithm/${algorithmId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching algorithm comments:', error);
      throw new Error('Failed to fetch comments');
    }
  },

  /**
   * Create a new comment or reply
   * @param {number} algorithmId - The algorithm ID
   * @param {string} content - The comment content
   * @param {number|null} parentId - Parent comment ID for replies, null for top-level comments
   * @returns {Promise<Object>} The created comment object
   */
  async createComment(algorithmId, content, parentId = null) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE}/comments/algorithm/${algorithmId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: content.trim(),
          parent_id: parentId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating algorithm comment:', error);
      throw error;
    }
  },

  /**
   * Update an existing comment
   * @param {number} commentId - The comment ID to update
   * @param {string} content - The new comment content
   * @returns {Promise<Object>} The updated comment object
   */
  async updateComment(commentId, content) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE}/comments/algorithm/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: content.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating algorithm comment:', error);
      throw error;
    }
  },

  /**
   * Delete a comment
   * @param {number} commentId - The comment ID to delete
   * @returns {Promise<void>}
   */
  async deleteComment(commentId) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE}/comments/algorithm/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting algorithm comment:', error);
      throw error;
    }
  }
};