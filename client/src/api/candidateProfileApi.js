import axiosClient from './axiosClient';

export const candidateProfileApi = {
  getMine: () => axiosClient.get('/candidates/profile'),
  updateMine: (payload) => axiosClient.put('/candidates/profile', payload),
  uploadResume: (file) => {
    const formData = new FormData();
    formData.append('resume', file);
    return axiosClient.post('/candidates/profile/resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
