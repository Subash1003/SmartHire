import axiosClient from './axiosClient';

export const aiApi = {
  runResumeScreen: (applicationId) => axiosClient.post('/ai/resume-screen', { applicationId }),
  getScreening: (applicationId) => axiosClient.get(`/ai/screenings/${applicationId}`),
};
