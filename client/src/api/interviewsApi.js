import axiosClient from './axiosClient';

export const interviewsApi = {
  list: (params) => axiosClient.get('/interviews', { params }),
  get: (id) => axiosClient.get(`/interviews/${id}`),
  create: (payload) => axiosClient.post('/interviews', payload),
  update: (id, payload) => axiosClient.put(`/interviews/${id}`, payload),
  updateStatus: (id, status) => axiosClient.patch(`/interviews/${id}/status`, { status }),
};
