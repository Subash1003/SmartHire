import axiosClient from './axiosClient';

export const evaluationsApi = {
  getForInterview: (interviewId) => axiosClient.get(`/evaluations/interview/${interviewId}`),
  create: (payload) => axiosClient.post('/evaluations', payload),
  update: (id, payload) => axiosClient.put(`/evaluations/${id}`, payload),
};
