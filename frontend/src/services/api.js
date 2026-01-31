/**
 * Axios API Configuration
 * Base setup for making HTTP requests to backend
 * 
 *     - What this does:
        - Creates axios instance pointing to your backend
        - Automatically adds JWT token to every request (if user is logged in)
        - Handles errors globally (e.g., redirects to login if token expires)
        - Returns clean data from responses
 * 
 * 
 */

import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000,  // 30 seconds
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - Add auth token to every request
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add to Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    // Return just the data from response
    return response.data;
  },
  (error) => {
    // Handle specific error cases
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      if (status === 401) {
        // Unauthorized - token expired or invalid
        // Clear token and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      
      // Return error message from server
      return Promise.reject(data.error || 'An error occurred');
    }
    
    if (error.request) {
      // Request made but no response received
      return Promise.reject('Network error. Please check your connection.');
    }
    
    // Something else happened
    return Promise.reject('An unexpected error occurred');
  }
);

export default api;