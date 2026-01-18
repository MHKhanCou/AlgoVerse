import api from './api';

export const algorithmCommentService = {
  /**
   * Get all comments for a specific algorithm
   * @param {number} algorithmId - The algorithm ID
   * @returns {Promise<Array>} Array of comments with nested replies
   */
  async getComments(algorithmId) {
    try {
      const response = await api.get(`/comments/algorithm/${algorithmId}`);
      return response.data;
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
      const response = await api.post(`/comments/algorithm/${algorithmId}`, {
        content: content.trim(),
        parent_id: parentId
      });
      return response.data;
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
      const response = await api.put(`/comments/algorithm/${commentId}`, {
        content: content.trim()
      });
      return response.data;
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
      await api.delete(`/comments/algorithm/${commentId}`);
    } catch (error) {
      console.error('Error deleting algorithm comment:', error);
      throw error;
    }
  }
};