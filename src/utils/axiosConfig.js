import axios from 'axios';
import { toast } from 'react-toastify';

// Require VITE_API_BASE_URL and always append /api/v1
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

function extractErrorMessage(error) {
  if (!error.response) return { message: 'Network error', severity: 'error' };
  const status = error.response.status;
  let message = 'An unexpected error occurred.';
  let severity = 'error';
  if (status === 400) severity = 'warning';
  if (status === 401) severity = 'error';
  if (status === 403) severity = 'error';
  if (status === 500) severity = 'error';
  // Try to extract detail from backend
  if (error.response.data) {
    if (typeof error.response.data.detail === 'string') {
      message = error.response.data.detail;
    } else if (Array.isArray(error.response.data.detail)) {
      message = error.response.data.detail.map((d) => d.msg).join(' ');
    } else if (error.response.data.message) {
      message = error.response.data.message;
    }
  } else if (error.response.statusText) {
    message = error.response.statusText;
  } else if (error.code) {
    message = error.code;
  }
  return { message, severity };
}

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('token-expired'));
    }
    // Show alert for all error types
    const { message, severity } = extractErrorMessage(error);
    window.dispatchEvent(new CustomEvent('global-alert', { detail: { message, severity } }));
    return Promise.reject(error);
  }
);

export default axiosInstance;