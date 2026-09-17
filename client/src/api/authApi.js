import axiosClient from './axiosClient';

export const authApi = {
  register: (payload) => axiosClient.post('/auth/register', payload),
  login: (payload) => axiosClient.post('/auth/login', payload),
  logout: () => axiosClient.post('/auth/logout'),
  me: () => axiosClient.get('/auth/me'),
  forgotPassword: (payload) => axiosClient.post('/auth/forgot-password', payload),
  resetPassword: (payload) => axiosClient.post('/auth/reset-password', payload),
};
