import axiosClient from './axiosClient';

export const jobsApi = {
  list: (params) => axiosClient.get('/jobs', { params }),
  get: (id) => axiosClient.get(`/jobs/${id}`),
  create: (payload) => axiosClient.post('/jobs', payload),
  update: (id, payload) => axiosClient.put(`/jobs/${id}`, payload),
  updateStatus: (id, status) => axiosClient.patch(`/jobs/${id}/status`, { status }),
};
