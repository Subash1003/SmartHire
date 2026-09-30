import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { analyticsApi } from '../../api/analyticsApi';
import KpiCard from '../../components/analytics/KpiCard';
import PageLoading from '../../components/ui/PageLoading';
import PageError from '../../components/ui/PageError';

export default function AdminDashboard() {
  const [state, setState] = useState({ status: 'loading', overview: null });

  const load = useCallback(() => {
    setState((s) => ({ ...s, status: 'loading' }));
    analyticsApi
      .getOverview()
      .then((res) => setState({ status: 'success', overview: res.data.data }))
      .catch(() => setState({ status: 'error', overview: null }));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-page__header">
        <h1 className="dashboard-page__title">Admin dashboard</h1>
        <Link to="/admin/analytics" className="link-accent">
          View full analytics
        </Link>
      </div>

      {state.status === 'loading' && <PageLoading />}
      {state.status === 'error' && <PageError message="Unable to load dashboard data." onRetry={load} />}

      {state.status === 'success' && (
        <div className="kpi-grid">
          <KpiCard label="Total jobs" value={state.overview.totalJobs} />
          <KpiCard label="Active jobs" value={state.overview.activeJobs} />
          <KpiCard label="Total applications" value={state.overview.totalApplications} />
          <KpiCard label="Shortlisted" value={state.overview.shortlisted} />
          <KpiCard label="Interviews" value={state.overview.interviews} />
          <KpiCard label="Selected" value={state.overview.selected} />
        </div>
      )}
    </div>
  );
}
