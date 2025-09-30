import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
      };
    case 'LOGIN_ERROR':
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

const initialState = {
  user: {
    id: 'auction-manager',
    name: 'Auction Manager',
    role: 'auctioneer',
    email: 'manager@auction.local'
  },
  token: 'no-auth-required',
  loading: false,
  error: null,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize without authentication - direct access for auction managers
  useEffect(() => {
    // No authentication required - user is already set in initialState
    dispatch({ type: 'SET_LOADING', payload: false });
  }, []);

  // Facebook login
  const loginWithFacebook = async (accessToken) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const response = await api.post('/auth/facebook', { accessToken });

      const { token, user } = response.data.data;

      // Store token
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token },
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({
        type: 'LOGIN_ERROR',
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Email/Password login
  const loginWithEmail = async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const response = await api.post('/auth/login', { email, password });

      const { token, user } = response.data.data;

      // Store token
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token },
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({
        type: 'LOGIN_ERROR',
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Register with email/password
  const register = async (name, email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const response = await api.post('/auth/register', { name, email, password });

      const { token, user } = response.data.data;

      // Store token
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token },
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      dispatch({
        type: 'LOGIN_ERROR',
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Logout
  const logout = async () => {
    try {
      // Call logout endpoint
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and state
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/auth/profile', profileData);
      
      dispatch({
        type: 'UPDATE_USER',
        payload: response.data.data.user,
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Profile update failed';
      return { success: false, error: errorMessage };
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    loginWithFacebook,
    loginWithEmail,
    register,
    logout,
    updateProfile,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
