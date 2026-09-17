import axiosClient from './axiosClient';

export const applicationsApi = {
  list: (params) => axiosClient.get('/applications', { params }),
  get: (id) => axiosClient.get(`/applications/${id}`),
  create: (payload) => axiosClient.post('/applications', payload),
  updateStatus: (id, status) => axiosClient.patch(`/applications/${id}/status`, { status }),
  listNotes: (id) => axiosClient.get(`/applications/${id}/notes`),
  createNote: (id, content) => axiosClient.post(`/applications/${id}/notes`, { content }),
  listEvaluations: (id) => axiosClient.get(`/applications/${id}/evaluations`),
  makeDecision: (id, status, notes) => axiosClient.post(`/applications/${id}/decision`, { status, notes }),
};
