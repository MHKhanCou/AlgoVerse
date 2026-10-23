import api from './api';

const PROGRESS_URL = '/user_progress';

export const userProgressService = {
  async getAllProgress() {
    try {
      const response = await api.get(`${PROGRESS_URL}/user`);
      return response.data;
    } catch (error) {
      if (!error.response) {
        throw new Error('Network error: Unable to reach the server. Please check if the backend is running.', { cause: error });
      }
      throw new Error(error.response?.data?.detail || 'Failed to fetch progress', { cause: error });
    }
  },

  async getEntry(algoId) {
    try {
      const response = await api.get(`${PROGRESS_URL}/entry/${algoId}`);
      return response.data;
    } catch (error) {
      console.error('UserProgressService.getEntry error:', {
        algoId,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      if (!error.response) {
        throw new Error('Network error: Unable to reach the server. Please check if the backend is running.', { cause: error });
      }
      if (error.response?.status === 404) {
        return null;
      }
      if (error.response?.status === 401) {
        throw new Error('Please log in to track progress', { cause: error });
      }
      throw new Error(error.response?.data?.detail || 'Failed to fetch progress entry', { cause: error });
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
        throw new Error('Network error: Unable to reach the server. Please check if the backend is running.', { cause: error });
      }
      if (error.response?.status === 404) {
        throw new Error('Algorithm not found', { cause: error });
      }
      if (error.response?.status === 400) {
        throw new Error('Progress already exists for this algorithm', { cause: error });
      }
      if (error.response?.status === 422) {
        const detail = error.response?.data?.detail;
        throw new Error(
          typeof detail === 'string' ? detail : detail?.[0]?.msg || 'Invalid data for creating progress'
        , { cause: error });
      }
      if (error.response?.status === 401) {
        throw new Error('Please log in to track progress', { cause: error });
      }
      throw new Error(error.response?.data?.detail || 'Failed to create progress', { cause: error });
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
        throw new Error('Network error: Unable to reach the server. Please check if the backend is running.', { cause: error });
      }
      if (error.response?.status === 403) {
        throw new Error('Not authorized to update this progress', { cause: error });
      }
      if (error.response?.status === 404) {
        throw new Error('Progress not found', { cause: error });
      }
      throw new Error(error.response?.data?.detail || 'Failed to update progress', { cause: error });
    }
  },

  async updateLastAccessed(algoId) {
    try {
      const response = await api.post(`${PROGRESS_URL}/update-access/${algoId}`, {});
      return response.data;
    } catch (error) {
      if (!error.response) {
        throw new Error('Network error: Unable to reach the server. Please check if the backend is running.', { cause: error });
      }
      if (error.response?.status === 404) {
        throw new Error('Progress entry not found', { cause: error });
      }
      throw new Error(error.response?.data?.detail || 'Failed to update last accessed', { cause: error });
    }
  },

  async getLastAccessed() {
    try {
      const response = await api.get(`${PROGRESS_URL}/last-accessed`);
      return response.data;
    } catch (error) {
      if (!error.response) {
        throw new Error('Network error: Unable to reach the server. Please check if the backend is running.', { cause: error });
      }
      if (error.response?.status === 404) {
        return null;
      }
      throw new Error(error.response?.data?.detail || 'Failed to fetch last accessed', { cause: error });
    }
  },

  async getStats() {
    try {
      const response = await api.get(`${PROGRESS_URL}/stats`);
      return response.data;
    } catch (error) {
      if (!error.response) {
        throw new Error('Network error: Unable to reach the server. Please check if the backend is running.', { cause: error });
      }
      throw new Error(error.response?.data?.detail || 'Failed to fetch stats', { cause: error });
    }
  },

  async getDetailedStats() {
    try {
      const response = await api.get(`${PROGRESS_URL}/detailed-stats`);
      return response.data;
    } catch (error) {
      if (!error.response) {
        throw new Error('Network error: Unable to reach the server. Please check if the backend is running.', { cause: error });
      }
      throw new Error(error.response?.data?.detail || 'Failed to fetch detailed stats', { cause: error });
    }
  },

  async deleteProgress(progressId) {
    try {
      await api.delete(`${PROGRESS_URL}/${progressId}`);
      return { success: true };
    } catch (error) {
      if (!error.response) {
        throw new Error('Network error: Unable to reach the server. Please check if the backend is running.', { cause: error });
      }
      if (error.response?.status === 404) {
        throw new Error('Progress not found', { cause: error });
      }
      if (error.response?.status === 403) {
        throw new Error('Not authorized to delete this progress', { cause: error });
      }
      throw new Error(error.response?.data?.detail || 'Failed to delete progress', { cause: error });
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