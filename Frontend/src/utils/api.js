import axios from 'axios';

// API configuration
const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Add auth token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper function to get image URL
export const getImageUrl = (filename) => {
  return `http://localhost:5000/public/uploads/${filename}`;
};

// API functions for complaints
export const complaintsAPI = {
  create: (data) => API.post('/complaints', data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  getMyComplaints: () => API.get('/complaints/my-complaints'),
  getAllComplaints: (filters = {}) => API.get('/complaints', { params: filters }),
  updateStatus: (id, status) => API.put(`/complaints/${id}/status`, { status }),
  updatePriority: (id, priority) => API.put(`/complaints/${id}/priority`, { priority }),
  update: (id, data) => API.put(`/complaints/${id}`, data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  delete: (id) => API.delete(`/complaints/${id}`),
  deleteImage: (id, imageName) => API.delete(`/complaints/${id}/images/${imageName}`), // Add this
};

export default API;