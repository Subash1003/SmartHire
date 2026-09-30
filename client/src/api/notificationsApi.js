import axiosClient from './axiosClient';

export const notificationsApi = {
  list: (params) => axiosClient.get('/notifications', { params }),
  markAsRead: (id) => axiosClient.patch(`/notifications/${id}/read`),
  markAllAsRead: () => axiosClient.patch('/notifications/read-all'),
};
