import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration de l'API
const API_URL = __DEV__ 
  ? 'http://10.0.2.2:8000'  // Android Emulator to Docker gateway
  : 'https://your-production-api.com';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token automatiquement
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expiré, déconnexion
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('username');
    }
    return Promise.reject(error);
  }
);

// AUTH API
export const authAPI = {
  login: async (username, password) => {
    const response = await api.post('/login', { username, password });
    return response.data;
  },
  
  register: async (username, password, preferences = []) => {
    const response = await api.post('/register', { username, password, preferences });
    return response.data;
  },
  
  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('username');
  },
};

// DESTINATIONS API
export const destinationsAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/destinations', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/destinations/${id}`);
    return response.data;
  },
  
  search: async (query, filters = {}) => {
    const response = await api.get('/destinations', {
      params: { q: query, ...filters },
    });
    return response.data;
  },
};

// FAVORITES API
export const favoritesAPI = {
  getAll: async () => {
    const favorites = await AsyncStorage.getItem('favorites');
    return favorites ? JSON.parse(favorites) : [];
  },
  
  add: async (destinationId) => {
    const favorites = await favoritesAPI.getAll();
    if (!favorites.includes(destinationId)) {
      favorites.push(destinationId);
      await AsyncStorage.setItem('favorites', JSON.stringify(favorites));
    }
    return favorites;
  },
  
  remove: async (destinationId) => {
    const favorites = await favoritesAPI.getAll();
    const filtered = favorites.filter(id => id !== destinationId);
    await AsyncStorage.setItem('favorites', JSON.stringify(filtered));
    return filtered;
  },
  
  isFavorite: async (destinationId) => {
    const favorites = await favoritesAPI.getAll();
    return favorites.includes(destinationId);
  },
};

// RECOMMENDATIONS API
export const recommendationsAPI = {
  get: async (limit = 10) => {
    const response = await api.get('/recommendations', { params: { limit } });
    return response.data;
  },
};

// ITINERARIES API
export const itinerariesAPI = {
  getAll: async () => {
    const response = await api.get('/itineraries');
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/itineraries', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/itineraries/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/itineraries/${id}`);
    return response.data;
  },
};

// PROPOSALS API (Propositions de destinations)
export const proposalsAPI = {
  // User endpoints
  getUserProposals: async () => {
    const response = await api.get('/proposals');
    return response.data;
  },
  
  submit: async (proposalData) => {
    const response = await api.post('/proposals', proposalData);
    return response.data;
  },
  
  // Admin endpoints
  getAllProposals: async (status = null) => {
    const params = status ? { status } : {};
    const response = await api.get('/admin/proposals', { params });
    return response.data;
  },
  
  approve: async (proposalId, comment = '') => {
    const response = await api.post(`/admin/proposals/${proposalId}/approve`, {
      comment,
    });
    return response.data;
  },
  
  reject: async (proposalId, comment) => {
    const response = await api.post(`/admin/proposals/${proposalId}/reject`, {
      comment,
    });
    return response.data;
  },
};

// REVIEWS API (Commentaires publics)
export const reviewsAPI = {
  getAll: async (destinationName = null) => {
    const params = destinationName ? { destination: destinationName } : {};
    const response = await api.get('/reviews', { params });
    return response.data;
  },
  
  create: async (destinationName, rating, comment) => {
    const response = await api.post('/reviews', {
      destination_name: destinationName,
      rating,
      comment,
    });
    return response.data;
  },
  
  delete: async (reviewId) => {
    const response = await api.delete(`/reviews/${reviewId}`);
    return response.data;
  },
};

// VISITED DESTINATIONS API
export const visitedAPI = {
  getAll: async () => {
    const response = await api.get('/visited');
    return response.data;
  },
  
  add: async (destinationName) => {
    const response = await api.post('/visited', {
      destination_name: destinationName,
    });
    return response.data;
  },
  
  remove: async (destinationName) => {
    const response = await api.delete(`/visited/${destinationName}`);
    return response.data;
  },
};

// FAVORITE NOTES API (Notes personnelles)
export const favoriteNotesAPI = {
  getAll: async () => {
    const response = await api.get('/favorite-notes');
    return response.data;
  },
  
  get: async (destinationName) => {
    const response = await api.get(`/favorite-notes/${destinationName}`);
    return response.data;
  },
  
  save: async (destinationName, noteData) => {
    const response = await api.post('/favorite-notes', {
      destination_name: destinationName,
      ...noteData,
    });
    return response.data;
  },
  
  delete: async (destinationName) => {
    const response = await api.delete(`/favorite-notes/${destinationName}`);
    return response.data;
  },
};

export default api;
