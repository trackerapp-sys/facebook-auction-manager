import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      // Don't redirect to login for demo - just log the error
      console.warn('Authentication error:', error.response?.data?.message);
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  loginWithFacebook: (accessToken) => api.post('/auth/facebook', { accessToken }),
  loginWithEmail: (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password) => api.post('/auth/register', { name, email, password }),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  logout: () => api.post('/auth/logout'),
};

// Auctions API
export const auctionsAPI = {
  getAuctions: (params = {}) => api.get('/auctions', { params }),
  getAuction: (id) => api.get(`/auctions/${id}`),
  createAuction: (data) => api.post('/auctions', data),
  updateAuction: (id, data) => api.put(`/auctions/${id}`, data),
  deleteAuction: (id) => api.delete(`/auctions/${id}`),
};

// Bids API
export const bidsAPI = {
  placeBid: (data) => api.post('/bids', data),
  placeManualBid: (data) => api.post('/bids/manual', data),
  getAuctionBids: (auctionId, params = {}) => api.get(`/bids/auction/${auctionId}`, { params }),
  getUserBids: (userId, params = {}) => api.get(`/bids/user/${userId}`, { params }),
  getWinningBids: () => api.get('/bids/winning'),
  getPendingFacebookBids: () => api.get('/bids/pending-facebook'),
  deleteBid: (id) => api.delete(`/bids/${id}`),
};

// Facebook API
export const facebookAPI = {
  connectAuction: (data) => api.post('/facebook/connect-auction', data),
  disconnectAuction: (auctionId) => api.delete(`/facebook/disconnect-auction/${auctionId}`),
  getPostComments: (postId, params = {}) => api.get(`/facebook/post/${postId}/comments`, { params }),
  testConnection: () => api.post('/facebook/test-connection'),
};

export default api;
