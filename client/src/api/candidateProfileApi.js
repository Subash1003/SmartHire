import axiosClient from './axiosClient';

export const candidateProfileApi = {
  getMine: () => axiosClient.get('/candidates/profile'),
  updateMine: (payload) => axiosClient.put('/candidates/profile', payload),
};
