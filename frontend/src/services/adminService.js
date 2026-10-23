import api from './api';
import { algorithmService } from './algorithmService';

const ADMIN_URL = '/admin';

export const adminService = {
  async fetchDashboardStats() {
    try {
      const response = await api.get(`${ADMIN_URL}/dashboard/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch dashboard stats', { cause: error });
    }
  },

  async fetchAdminDetails() {
    try {
      const response = await api.get(`${ADMIN_URL}/dashboard/admin-info`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch admin details', { cause: error });
    }
  },

  async fetchUsers() {
    try {
      const response = await api.get(`${ADMIN_URL}/users/`);
      console.log('Fetched Users:', response.data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch users', { cause: error });
    }
  },

  async makeAdmin(userId) {
    try {
      const response = await api.put(
        `${ADMIN_URL}/users/${userId}/make-admin`,
        {}
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to make admin', { cause: error });
    }
  },

  async deleteUser(userId) {
    try {
      await api.delete(`${ADMIN_URL}/users/${userId}`);
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to delete user', { cause: error });
    }
  },

  async fetchBlogs() {
    try {
      const response = await api.get(`${ADMIN_URL}/blogs/`, { params: { limit: 100 } });
      console.log('Fetched Blogs:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching blogs:', error);
      throw new Error(error.response?.data?.detail || 'Failed to fetch blogs', { cause: error });
    }
  },

  async updateBlogStatus(blogId, { status, feedback = null } = {}) {
    try {
      const response = await api.post(
        `${ADMIN_URL}/blogs/${blogId}/moderate`,
        {
          status,
          admin_feedback: feedback
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating blog status:', error);
      throw new Error(error.response?.data?.detail || 'Failed to update blog status', { cause: error });
    }
  },

  async fetchAlgoTypes() {
    try {
      const response = await api.get(`${ADMIN_URL}/algo-types/`);
      console.log('Fetched AlgoTypes:', response.data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch algorithm types', { cause: error });
    }
  },

  async createAlgoType(data) {
    try {
      const response = await api.post(`${ADMIN_URL}/algo-types/`, data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to create algorithm type', { cause: error });
    }
  },

  async updateAlgoType(typeId, data) {
    try {
      const response = await api.put(`${ADMIN_URL}/algo-types/${typeId}`, data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to update algorithm type', { cause: error });
    }
  },

  async deleteAlgoType(typeId) {
    try {
      await api.delete(`${ADMIN_URL}/algo-types/${typeId}`);
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to delete algorithm type', { cause: error });
    }
  },

  async fetchAlgorithms() {
    try {
      const algorithms = await algorithmService.getAll(1, 100); // Fetch more for admin
      return algorithms.map(algo => ({
        ...algo,
        type_name: algo.type_name || 'Unknown' // Ensure type_name is included
      }));
    } catch {
      throw new Error('Failed to fetch algorithms');
    }
  },

  async createAlgorithm(data) {
    try {
      const response = await api.post(`${ADMIN_URL}/algorithms/`, data);
      console.log('Create Algorithm response:', response.data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to create algorithm', { cause: error });
    }
  },

  async updateAlgorithm(algoId, data) {
    try {
      const response = await api.put(`${ADMIN_URL}/algorithms/${algoId}`, data);
      console.log('Update Algorithm response:', response.data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to update algorithm', { cause: error });
    }
  },

  async deleteAlgorithm(algoId) {
    try {
      await api.delete(`${ADMIN_URL}/algorithms/${algoId}`);
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to delete algorithm', { cause: error });
    }
  },

  async fetchUserProgress() {
    try {
      const response = await api.get(`${ADMIN_URL}/progress/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch user progress', { cause: error });
    }
  },

  async deleteProgress(progressId) {
    try {
      await api.delete(`${ADMIN_URL}/progress/${progressId}`);
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to delete progress', { cause: error });
    }
  },

  async deleteUserProgress(userId) {
    try {
      await api.delete(`${ADMIN_URL}/progress/user/${userId}`);
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to delete user progress', { cause: error });
    }
  },

  async updateBlog(blogId, data) {
    try {
      const response = await api.put(`${ADMIN_URL}/blogs/${blogId}`, data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to update blog', { cause: error });
    }
  },

  async deleteBlog(blogId) {
    try {
      await api.delete(`${ADMIN_URL}/blogs/${blogId}`);
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to delete blog', { cause: error });
    }
  },
};
