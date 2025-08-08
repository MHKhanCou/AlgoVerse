import axios from 'axios';

const API_URL = 'http://localhost:8000';
const PROGRESS_URL = `${API_URL}/user_progress`;

export const userProgressService = {
  async getAllProgress() {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${PROGRESS_URL}/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      if (!error.response) {
        throw new Error('Network error: Unable to reach the server. Please check if the backend is running.');
      }
      throw new Error(error.response?.data?.detail || 'Failed to fetch progress');
    }
  },

  async getEntry(algoId) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${PROGRESS_URL}/entry/${algoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      if (!error.response) {
        throw new Error('Network error: Unable to reach the server. Please check if the backend is running.');
      }
      if (error.response?.status === 404) {
        return null;
      }
      throw new Error(error.response?.data?.detail || 'Failed to fetch progress entry');
    }
  },

  async createProgress(algoId, status) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        PROGRESS_URL,
        { algo_id: Number(algoId), status }, // Ensure algo_id is a number
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      if (!error.response) {
        throw new Error('Network error: Unable to reach the server. Please check if the backend is running.');
      }
      if (error.response?.status === 404) {
        throw new Error('Algorithm not found');
      }
      if (error.response?.status === 400) {
        throw new Error('Progress already exists for this algorithm');
      }
      if (error.response?.status === 422) {
        // Include detailed error message from backend
        const detail = error.response?.data?.detail;
        throw new Error(
          typeof detail === 'string' ? detail : detail?.[0]?.msg || 'Invalid data for creating progress'
        );
      }
      if (error.response?.status === 401) {
        throw new Error('Please log in to track progress');
      }
      throw new Error(error.response?.data?.detail || 'Failed to create progress');
    }
  },

  async updateProgress(progressId, status) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${PROGRESS_URL}/${progressId}`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      if (!error.response) {
        throw new Error('Network error: Unable to reach the server. Please check if the backend is running.');
      }
      if (error.response?.status === 403) {
        throw new Error('Not authorized to update this progress');
      }
      if (error.response?.status === 404) {
        throw new Error('Progress not found');
      }
      throw new Error(error.response?.data?.detail || 'Failed to update progress');
    }
  },

  async updateLastAccessed(algoId) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${PROGRESS_URL}/update-access/${algoId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      if (!error.response) {
        throw new Error('Network error: Unable to reach the server. Please check if the backend is running.');
      }
      if (error.response?.status === 404) {
        throw new Error('Progress entry not found');
      }
      throw new Error(error.response?.data?.detail || 'Failed to update last accessed');
    }
  },

  async getLastAccessed() {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${PROGRESS_URL}/last-accessed`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      if (!error.response) {
        throw new Error('Network error: Unable to reach the server. Please check if the backend is running.');
      }
      if (error.response?.status === 404) {
        return null;
      }
      throw new Error(error.response?.data?.detail || 'Failed to fetch last accessed');
    }
  },

  async getStats() {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${PROGRESS_URL}/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      if (!error.response) {
        throw new Error('Network error: Unable to reach the server. Please check if the backend is running.');
      }
      throw new Error(error.response?.data?.detail || 'Failed to fetch stats');
    }
  },

  async getDetailedStats() {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${PROGRESS_URL}/detailed-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      if (!error.response) {
        throw new Error('Network error: Unable to reach the server. Please check if the backend is running.');
      }
      throw new Error(error.response?.data?.detail || 'Failed to fetch detailed stats');
    }
  },

  async deleteProgress(progressId) {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${PROGRESS_URL}/${progressId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      if (!error.response) {
        throw new Error('Network error: Unable to reach the server. Please check if the backend is running.');
      }
      if (error.response?.status === 404) {
        throw new Error('Progress not found');
      }
      if (error.response?.status === 403) {
        throw new Error('Not authorized to delete this progress');
      }
      throw new Error(error.response?.data?.detail || 'Failed to delete progress');
    }
  },

  async getBatchProgress(algorithmIds) {
    if (!algorithmIds || algorithmIds.length === 0) return [];
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${PROGRESS_URL}/batch`,
        { algorithm_ids: algorithmIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data || [];
    } catch (error) {
      console.error('Error fetching batch progress:', error);
      // Return empty array instead of throwing to prevent breaking the UI
      return [];
    }
  },
};