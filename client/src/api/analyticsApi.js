import axiosClient from './axiosClient';

export const analyticsApi = {
  getOverview: () => axiosClient.get('/analytics/overview'),
  getApplications: () => axiosClient.get('/analytics/applications'),
  getHiringFunnel: () => axiosClient.get('/analytics/hiring-funnel'),
  getInterviews: () => axiosClient.get('/analytics/interviews'),
};
