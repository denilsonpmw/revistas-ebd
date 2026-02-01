import { apiRequest } from '../api/client';

const api = {
  get: async (path) => {
    return apiRequest(path, {
      method: 'GET'
    });
  },

  post: async (path, body) => {
    return apiRequest(path, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  patch: async (path, body) => {
    return apiRequest(path, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  },

  delete: async (path) => {
    return apiRequest(path, {
      method: 'DELETE'
    });
  }
};

export default api;
