import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { interviewsApi } from '../../api/interviewsApi';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import { INTERVIEW_STATUS_LABELS, INTERVIEW_STATUS_VARIANT } from '../../validators/interviewStatus';

export default function InterviewerInterviews() {
  const [state, setState] = useState({ status: 'loading', interviews: [] });

  useEffect(() => {
    interviewsApi
      .list({ limit: 100 })
      .then((res) => setState({ status: 'success', interviews: res.data.data }))
      .catch(() => setState({ status: 'error', interviews: [] }));
  }, []);

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
    { key: 'type', header: 'Type', render: (row) => <span className="capitalize">{row.type}</span> },
    { key: 'when', header: 'When', render: (row) => new Date(row.startTime).toLocaleString() },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={INTERVIEW_STATUS_VARIANT[row.status]}>{INTERVIEW_STATUS_LABELS[row.status]}</Badge>,
    },
  ];

  return (
    <div className="dashboard-page">
      <h1 className="dashboard-page__title">Your interviews</h1>

      <div className="card">
        {state.status === 'error' ? (
          <p className="table-error">Unable to load interviews. Please try again.</p>
        ) : (
          <DataTable
            columns={columns}
            rows={state.interviews}
            rowKey="_id"
            loading={state.status === 'loading'}
            emptyMessage="No interviews assigned yet."
          />
        )}
      </div>
    </div>
  );
}
