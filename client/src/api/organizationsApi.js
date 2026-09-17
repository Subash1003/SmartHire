import axiosClient from './axiosClient';

export const organizationsApi = {
  getMine: () => axiosClient.get('/organizations/me'),
  updateMine: (payload) => axiosClient.put('/organizations/me', payload),
};
