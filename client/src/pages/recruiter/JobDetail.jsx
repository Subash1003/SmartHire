import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { jobsApi } from '../../api/jobsApi';
import { getApiErrorMessage } from '../../utils/getApiErrorMessage';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const STATUS_VARIANT = { draft: 'neutral', published: 'success', closed: 'danger', expired: 'warning' };

const TRANSITIONS = {
  draft: [{ to: 'published', label: 'Publish' }, { to: 'closed', label: 'Close' }],
  published: [{ to: 'closed', label: 'Close' }, { to: 'expired', label: 'Mark expired' }],
  closed: [],
  expired: [{ to: 'published', label: 'Republish' }, { to: 'closed', label: 'Close' }],
};

export default function RecruiterJobDetail() {
  const { id } = useParams();
  const [state, setState] = useState({ status: 'loading', job: null });
  const [actionError, setActionError] = useState('');

  const load = () => {
    jobsApi
      .get(id)
      .then((res) => setState({ status: 'success', job: res.data.data.job }))
      .catch(() => setState({ status: 'error', job: null }));
  };

  useEffect(load, [id]);

  const changeStatus = async (nextStatus) => {
    setActionError('');
    try {
      await jobsApi.updateStatus(id, nextStatus);
      load();
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Unable to update job status.'));
    }
  };

  if (state.status === 'loading') {
    return <p className="text-muted">Loading job...</p>;
  }

  if (state.status === 'error') {
    return <p className="text-error">Unable to load this job. Please try again.</p>;
  }

  const job = state.job;

  return (
    <div className="form-page">
      <div className="recruiter-job-detail__header">
        <div>
          <h1 className="dashboard-page__title">{job.title}</h1>
          <div className="recruiter-job-detail__status-row">
            <Badge variant={STATUS_VARIANT[job.status]}>{job.status}</Badge>
            <span className="text-faint">
              {job.department} &middot; {job.location}
            </span>
          </div>
        </div>
        <Link to={`/recruiter/jobs/${id}/edit`}>
          <Button variant="secondary">Edit</Button>
        </Link>
      </div>

      <div className="recruiter-job-detail__actions">
        {TRANSITIONS[job.status].map((t) => (
          <Button key={t.to} variant="secondary" onClick={() => changeStatus(t.to)}>
            {t.label}
          </Button>
        ))}
      </div>

      {actionError && <p className="text-error">{actionError}</p>}

      <section className="job-detail__section">
        <h2 className="job-detail__section-title">Description</h2>
        <p className="job-detail__section-body">{job.description}</p>
      </section>

      {job.requiredSkills?.length > 0 && (
        <section className="job-detail__section">
          <h2 className="job-detail__section-title">Required skills</h2>
          <div className="job-detail__skills">
            {job.requiredSkills.map((skill) => (
              <Badge key={skill} variant="brand">
                {skill}
              </Badge>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
