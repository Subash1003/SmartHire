import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { interviewsApi } from '../../api/interviewsApi';
import { evaluationsApi } from '../../api/evaluationsApi';
import KpiCard from '../../components/analytics/KpiCard';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import PageLoading from '../../components/ui/PageLoading';
import PageError from '../../components/ui/PageError';
import { INTERVIEW_STATUS_LABELS, INTERVIEW_STATUS_VARIANT } from '../../validators/interviewStatus';

function isToday(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export default function InterviewerDashboard() {
  const [state, setState] = useState({ status: 'loading', interviews: [], pendingEvaluationIds: new Set() });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: 'loading' }));
    try {
      const res = await interviewsApi.list({ limit: 100 });
      const interviews = res.data.data;

      const completed = interviews.filter((i) => i.status === 'completed');
      const evaluationChecks = await Promise.all(
        completed.map((interview) =>
          evaluationsApi
            .getForInterview(interview._id)
            .then(() => null)
            .catch(() => interview._id)
        )
      );
      const pendingEvaluationIds = new Set(evaluationChecks.filter(Boolean));

      setState({ status: 'success', interviews, pendingEvaluationIds });
    } catch {
      setState((s) => ({ ...s, status: 'error' }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (state.status === 'loading') {
    return <PageLoading />;
  }

  if (state.status === 'error') {
    return <PageError message="Unable to load your interviews." onRetry={load} />;
  }

  const { interviews, pendingEvaluationIds } = state;
  const now = new Date();

  const todaysInterviews = interviews.filter((i) => i.status === 'scheduled' && isToday(i.startTime));
  const upcomingInterviews = interviews.filter(
    (i) => i.status === 'scheduled' && new Date(i.startTime) > now && !isToday(i.startTime)
  );
  const completedInterviews = interviews.filter((i) => i.status === 'completed');
  const pendingEvaluations = completedInterviews.filter((i) => pendingEvaluationIds.has(i._id));

  const columns = [
    {
      key: 'candidate',
      header: 'Candidate',
      render: (row) => (
        <Link to={`/interviewer/interviews/${row._id}`} className="link-accent">
          {row.candidateId?.name}
        </Link>
      ),
    },
    { key: 'job', header: 'Job', render: (row) => row.jobId?.title },
    { key: 'when', header: 'When', render: (row) => new Date(row.startTime).toLocaleString() },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={INTERVIEW_STATUS_VARIANT[row.status]}>{INTERVIEW_STATUS_LABELS[row.status]}</Badge>,
    },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-page__header">
        <h1 className="dashboard-page__title">Interviewer dashboard</h1>
        <Link to="/interviewer/interviews" className="link-accent">
          View all interviews
        </Link>
      </div>

      <div className="kpi-grid">
        <KpiCard label="Today's interviews" value={todaysInterviews.length} />
        <KpiCard label="Upcoming interviews" value={upcomingInterviews.length} />
        <KpiCard label="Completed interviews" value={completedInterviews.length} />
        <KpiCard label="Pending evaluations" value={pendingEvaluations.length} />
      </div>

      <div className="card">
        <h2 className="chart-card__title">Today's interviews</h2>
        <DataTable
          columns={columns}
          rows={todaysInterviews}
          rowKey="_id"
          emptyMessage="No interviews scheduled for today."
        />
      </div>

      {pendingEvaluations.length > 0 && (
        <div className="card">
          <h2 className="chart-card__title">Awaiting your evaluation</h2>
          <DataTable
            columns={columns}
            rows={pendingEvaluations}
            rowKey="_id"
            emptyMessage="Nothing pending."
          />
        </div>
      )}
    </div>
  );
}
