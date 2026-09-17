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
    return <p className="text-sm text-gray-500">Loading job...</p>;
  }

  if (state.status === 'error') {
    return <p className="text-sm text-red-600">Unable to load this job. Please try again.</p>;
  }

  const job = state.job;

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{job.title}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant={STATUS_VARIANT[job.status]}>{job.status}</Badge>
            <span className="text-sm text-gray-500">
              {job.department} &middot; {job.location}
            </span>
          </div>
        </div>
        <Link to={`/recruiter/jobs/${id}/edit`}>
          <Button variant="secondary">Edit</Button>
        </Link>
      </div>

      <div className="mt-4 flex gap-2">
        {TRANSITIONS[job.status].map((t) => (
          <Button key={t.to} variant="secondary" onClick={() => changeStatus(t.to)}>
            {t.label}
          </Button>
        ))}
      </div>

      {actionError && <p className="mt-2 text-sm text-red-600">{actionError}</p>}

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900">Description</h2>
        <p className="mt-2 whitespace-pre-line text-sm text-gray-700">{job.description}</p>
      </section>

      {job.requiredSkills?.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900">Required skills</h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
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
