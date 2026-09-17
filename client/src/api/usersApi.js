import axiosClient from './axiosClient';

export const usersApi = {
  list: (params) => axiosClient.get('/users', { params }),
  create: (payload) => axiosClient.post('/users', payload),
  update: (id, payload) => axiosClient.put(`/users/${id}`, payload),
  updateStatus: (id, isActive) => axiosClient.patch(`/users/${id}/status`, { isActive }),
};
