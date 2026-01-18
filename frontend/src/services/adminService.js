import api from './api';
import { algorithmService } from './algorithmService';

const ADMIN_URL = '/admin';

export const adminService = {
  async fetchDashboardStats() {
    try {
      const response = await api.get(`${ADMIN_URL}/dashboard/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch dashboard stats');
    }
  },

  async fetchAdminDetails() {
    try {
      const response = await api.get(`${ADMIN_URL}/dashboard/admin-info`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch admin details');
    }
  },

  async fetchUsers() {
    try {
      const response = await api.get(`${ADMIN_URL}/users/`);
      console.log('Fetched Users:', response.data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch users');
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
      throw new Error(error.response?.data?.detail || 'Failed to make admin');
    }
  },

  async deleteUser(userId) {
    try {
      await api.delete(`${ADMIN_URL}/users/${userId}`);
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to delete user');
    }
  },

  async fetchBlogs() {
    try {
      const response = await api.get(`${ADMIN_URL}/blogs/`);
      console.log('Fetched Blogs:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching blogs:', error);
      throw new Error(error.response?.data?.detail || 'Failed to fetch blogs');
    }
  },

  async updateBlogStatus(blogId, data) {
    try {
      const response = await api.post(
        `${ADMIN_URL}/blogs/${blogId}/moderate`,
        {
          status: data.status,
          admin_feedback: data.status === 'approved' ? 'Approved by admin' : 'Rejected by admin'
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating blog status:', error);
      throw new Error(error.response?.data?.detail || 'Failed to update blog status');
    }
  },

  async fetchAlgoTypes() {
    try {
      const response = await api.get(`${ADMIN_URL}/algo-types/`);
      console.log('Fetched AlgoTypes:', response.data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch algorithm types');
    }
  },

  async createAlgoType(data) {
    try {
      const response = await api.post(`${ADMIN_URL}/algo-types/`, data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to create algorithm type');
    }
  },

  async updateAlgoType(typeId, data) {
    try {
      const response = await api.put(`${ADMIN_URL}/algo-types/${typeId}`, data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to update algorithm type');
    }
  },

  async deleteAlgoType(typeId) {
    try {
      await api.delete(`${ADMIN_URL}/algo-types/${typeId}`);
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to delete algorithm type');
    }
  },

  async fetchAlgorithms() {
    try {
      const algorithms = await algorithmService.getAll(1, 100); // Fetch more for admin
      return algorithms.map(algo => ({
        ...algo,
        type_name: algo.type_name || 'Unknown' // Ensure type_name is included
      }));
    } catch (error) {
      throw new Error('Failed to fetch algorithms');
    }
  },

  async createAlgorithm(data) {
    try {
      const response = await api.post(`${ADMIN_URL}/algorithms/`, data);
      console.log('Create Algorithm response:', response.data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to create algorithm');
    }
  },

  async updateAlgorithm(algoId, data) {
    try {
      const response = await api.put(`${ADMIN_URL}/algorithms/${algoId}`, data);
      console.log('Update Algorithm response:', response.data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to update algorithm');
    }
  },

  async deleteAlgorithm(algoId) {
    try {
      await api.delete(`${ADMIN_URL}/algorithms/${algoId}`);
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to delete algorithm');
    }
  },

  async fetchUserProgress() {
    try {
      const response = await api.get(`${ADMIN_URL}/progress/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch user progress');
    }
  },

  async deleteProgress(progressId) {
    try {
      await api.delete(`${ADMIN_URL}/progress/${progressId}`);
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to delete progress');
    }
  },

  async deleteUserProgress(userId) {
    try {
      await api.delete(`${ADMIN_URL}/progress/user/${userId}`);
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to delete user progress');
    }
  },

  async updateBlog(blogId, data) {
    try {
      const response = await api.put(`${ADMIN_URL}/blogs/${blogId}`, data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to update blog');
    }
  },

  async deleteBlog(blogId) {
    try {
      await api.delete(`${ADMIN_URL}/blogs/${blogId}`);
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to delete blog');
    }
  },
};