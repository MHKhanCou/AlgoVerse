import api from './api';

const PROGRESS_URL = '/user_progress';

export const userProgressService = {
  async getAllProgress() {
    try {
      const response = await api.get(`${PROGRESS_URL}/user`);
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
      const response = await api.get(`${PROGRESS_URL}/entry/${algoId}`);
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
      const response = await api.post(PROGRESS_URL, {
        algo_id: Number(algoId),
        status
      });
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
      const response = await api.put(`${PROGRESS_URL}/${progressId}`, {
        status
      });
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
      const response = await api.post(`${PROGRESS_URL}/update-access/${algoId}`, {});
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
      const response = await api.get(`${PROGRESS_URL}/last-accessed`);
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
      const response = await api.get(`${PROGRESS_URL}/stats`);
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
      const response = await api.get(`${PROGRESS_URL}/detailed-stats`);
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
      await api.delete(`${PROGRESS_URL}/${progressId}`);
      return { success: true };
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
      const response = await api.get(`${PROGRESS_URL}/batch`, {
        params: { ids: algorithmIds.join(',') }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching batch progress:', error);
      return [];
    }
  },
};