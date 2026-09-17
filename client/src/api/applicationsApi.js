import axiosClient from './axiosClient';

export const applicationsApi = {
  list: (params) => axiosClient.get('/applications', { params }),
  get: (id) => axiosClient.get(`/applications/${id}`),
  create: (payload) => axiosClient.post('/applications', payload),
};
