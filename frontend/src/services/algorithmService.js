import axios from 'axios';

const API_URL = 'http://localhost:8000';
const ALGORITHMS_URL = `${API_URL}/algorithms`;

export const algorithmService = {
  async getAll(page = 1, limit = 5) {
    try {
      const skip = (page - 1) * limit;
      const response = await axios.get(`${ALGORITHMS_URL}/`, {
        params: { skip, limit },
      });
      return response.data;
    } catch (error) {
      if (!error.response) {
        throw new Error('Network error: Unable to reach the server.');
      }
      throw new Error(error.response?.data?.detail || 'Failed to fetch algorithms');
    }
  },

  async getById(id) {
    try {
      const response = await axios.get(`${ALGORITHMS_URL}/${id}`);
      return response.data;
    } catch (error) {
      if (!error.response) {
        throw new Error('Network error: Unable to reach the server.');
      }
      if (error.response?.status === 404) {
        throw new Error('Algorithm not found');
      }
      throw new Error(error.response?.data?.detail || 'Failed to fetch algorithm');
    }
  },

  async getByType(typeId, page = 1, limit = 5) {
    try {
      const skip = (page - 1) * limit;
      const response = await axios.get(`${ALGORITHMS_URL}/type/${typeId}`, {
        params: { skip, limit },
      });
      return response.data;
    } catch (error) {
      if (!error.response) {
        throw new Error('Network error: Unable to reach the server.');
      }
      if (error.response?.status === 404) {
        throw new Error('Algorithm type not found');
      }
      throw new Error(error.response?.data?.detail || 'Failed to fetch algorithms by type');
    }
  },

  async create(data) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${ALGORITHMS_URL}/`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      if (!error.response) {
        throw new Error('Network error: Unable to reach the server.');
      }
      if (error.response?.status === 403) {
        throw new Error('Admin access required');
      }
      throw new Error(error.response?.data?.detail || 'Failed to create algorithm');
    }
  },

  async update(id, data) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${ALGORITHMS_URL}/${id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      if (!error.response) {
        throw new Error('Network error: Unable to reach the server.');
      }
      if (error.response?.status === 403) {
        throw new Error('Admin access required');
      }
      if (error.response?.status === 404) {
        throw new Error('Algorithm not found');
      }
      throw new Error(error.response?.data?.detail || 'Failed to update algorithm');
    }
  },

  async delete(id) {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${ALGORITHMS_URL}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      if (!error.response) {
        throw new Error('Network error: Unable to reach the server.');
      }
      if (error.response?.status === 403) {
        throw new Error('Admin access required');
      }
      if (error.response?.status === 404) {
        throw new Error('Algorithm not found');
      }
      throw new Error(error.response?.data?.detail || 'Failed to delete algorithm');
    }
  },
};