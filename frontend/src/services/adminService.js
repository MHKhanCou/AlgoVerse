import axios from 'axios';
import { algorithmService } from './algorithmService';

const API_URL = 'http://localhost:8000/admin';

export const adminService = {
  async fetchDashboardStats() {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/dashboard/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch dashboard stats');
    }
  },

  async fetchAdminDetails() {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/dashboard/admin-info`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch admin details');
    }
  },

  async fetchUsers() {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Fetched Users:', response.data); // Debug log
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch users');
    }
  },

  async makeAdmin(userId) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/users/${userId}/make-admin`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to make admin');
    }
  },

  async deleteUser(userId) {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to delete user');
    }
  },

  async fetchBlogs() {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/blogs/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Fetched Blogs:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching blogs:', error);
      throw new Error(error.response?.data?.detail || 'Failed to fetch blogs');
    }
  },

  async updateBlogStatus(blogId, data) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/blogs/${blogId}/moderate`,
        {
          status: data.status,
          admin_feedback: data.status === 'approved' ? 'Approved by admin' : 'Rejected by admin'
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
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
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/algo-types/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Fetched AlgoTypes:', response.data); // Debug log
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch algorithm types');
    }
  },

  async createAlgoType(data) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/algo-types/`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to create algorithm type');
    }
  },

  async updateAlgoType(typeId, data) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/algo-types/${typeId}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to update algorithm type');
    }
  },

  async deleteAlgoType(typeId) {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/algo-types/${typeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/algorithms/`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Create Algorithm response:', response.data); // Debug log
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to create algorithm');
    }
  },

  async updateAlgorithm(algoId, data) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/algorithms/${algoId}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Update Algorithm response:', response.data); // Debug log
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to update algorithm');
    }
  },

  async deleteAlgorithm(algoId) {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/algorithms/${algoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to delete algorithm');
    }
  },

  async fetchUserProgress() {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/progress/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch user progress');
    }
  },

  async deleteProgress(progressId) {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/progress/${progressId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to delete progress');
    }
  },

  async deleteUserProgress(userId) {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/progress/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to delete user progress');
    }
  },

  async fetchBlogs() {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/blogs/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch blogs');
    }
  },

  async updateBlog(blogId, data) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/blogs/${blogId}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to update blog');
    }
  },

  async deleteBlog(blogId) {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/blogs/${blogId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to delete blog');
    }
  },
};