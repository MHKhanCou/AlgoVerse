import api from './api';

const ALGORITHMS_URL = '/algorithms';

export const algorithmService = {
  async getAll(page = 1, limit = 5) {
    try {
      const skip = (page - 1) * limit;
      const response = await api.get(`${ALGORITHMS_URL}/`, {
        params: { skip, limit },
      });
      return response.data;
    } catch (error) {
      if (!error.response) {
        throw new Error('Network error: Unable to reach the server.', { cause: error });
      }
      throw new Error(error.response?.data?.detail || 'Failed to fetch algorithms', { cause: error });
    }
  },

  async getById(id) {
    try {
      const response = await api.get(`${ALGORITHMS_URL}/${id}`);
      return response.data;
    } catch (error) {
      if (!error.response) {
        throw new Error('Network error: Unable to reach the server.', { cause: error });
      }
      if (error.response?.status === 404) {
        throw new Error('Algorithm not found', { cause: error });
      }
      throw new Error(error.response?.data?.detail || 'Failed to fetch algorithm', { cause: error });
    }
  },

  async getByType(typeId, page = 1, limit = 5) {
    try {
      const skip = (page - 1) * limit;
      const response = await api.get(`/algorithms/type/${typeId}`, {
        params: { skip, limit },
      });
      return response.data;
    } catch (error) {
      if (!error.response) {
        throw new Error('Network error: Unable to reach the server.', { cause: error });
      }
      if (error.response?.status === 404) {
        throw new Error('Algorithm type not found', { cause: error });
      }
      throw new Error(error.response?.data?.detail || 'Failed to fetch algorithms by type', { cause: error });
    }
  },

  async create(data) {
    try {
      const response = await api.post('/algorithms/', data);
      return response.data;
    } catch (error) {
      if (!error.response) {
        throw new Error('Network error: Unable to reach the server.', { cause: error });
      }
      if (error.response?.status === 403) {
        throw new Error('Admin access required', { cause: error });
      }
      throw new Error(error.response?.data?.detail || 'Failed to create algorithm', { cause: error });
    }
  },

  async update(id, data) {
    try {
      const response = await api.put(`/algorithms/${id}`, data);
      return response.data;
    } catch (error) {
      if (!error.response) {
        throw new Error('Network error: Unable to reach the server.', { cause: error });
      }
      if (error.response?.status === 403) {
        throw new Error('Admin access required', { cause: error });
      }
      if (error.response?.status === 404) {
        throw new Error('Algorithm not found', { cause: error });
      }
      throw new Error(error.response?.data?.detail || 'Failed to update algorithm', { cause: error });
    }
  },

  async delete(id) {
    try {
      await api.delete(`/algorithms/${id}`);
    } catch (error) {
      if (!error.response) {
        throw new Error('Network error: Unable to reach the server.', { cause: error });
      }
      if (error.response?.status === 403) {
        throw new Error('Admin access required', { cause: error });
      }
      if (error.response?.status === 404) {
        throw new Error('Algorithm not found', { cause: error });
      }
      throw new Error(error.response?.data?.detail || 'Failed to delete algorithm', { cause: error });
    }
  },

  async getRelatedProblems(algorithmId) {
    try {
      const response = await api.get(`/algorithms/${algorithmId}/related-problems`);
      return response.data;
    } catch (error) {
      if (!error.response) {
        throw new Error('Network error: Unable to reach the server.', { cause: error });
      }
      if (error.response?.status === 404) {
        throw new Error('Algorithm not found', { cause: error });
      }
      throw new Error(error.response?.data?.detail || 'Failed to fetch related problems', { cause: error });
    }
  },

  async suggestProblems(algorithmId, { count, level, refresh } = {}) {
    try {
      const response = await api.get(`/api/problems/suggest/${algorithmId}`, {
        params: {
          ...(count ? { count } : {}),
          ...(level ? { level } : {}),
          ...(refresh ? { refresh: true } : {}),
        },
        // Suggestions may pay for a cold Codeforces pool fetch / model call
        // on the server, so they get a longer budget than ordinary reads.
        timeout: 30000,
      });
      return response.data;
    } catch (error) {
      if (!error.response) {
        throw new Error('Network error: Unable to reach the server.', { cause: error });
      }
      throw new Error(error.response?.data?.detail || 'Failed to fetch suggestions', { cause: error });
    }
  },
};