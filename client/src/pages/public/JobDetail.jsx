import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { jobsApi } from '../../api/jobsApi';
import { useAuth } from '../../hooks/useAuth';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

export default function JobDetail() {
  const { id } = useParams();
  const { user, status: authStatus } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState({ status: 'loading', job: null });
  const isCandidate = authStatus === 'authenticated' && user?.role === 'candidate';

  useEffect(() => {
    jobsApi
      .get(id)
      .then((res) => setState({ status: 'success', job: res.data.data.job }))
      .catch(() => setState({ status: 'error', job: null }));
  }, [id]);

  const handleApply = () => {
    if (authStatus !== 'authenticated') {
      navigate('/login', { state: { from: `/jobs/${id}` } });
    }
    // Candidates: the application flow itself is built in the next phase.
  };

  if (state.status === 'loading') {
    return <p className="mx-auto max-w-3xl px-4 py-10 text-sm text-gray-500">Loading job details...</p>;
  }

  if (state.status === 'error') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center">
        <p className="text-sm text-red-600">This job could not be found. It may have been closed or removed.</p>
        <Link to="/jobs" className="mt-2 inline-block text-sm text-brand-600 hover:underline">
          Back to job listings
        </Link>
      </div>
    );
  }

  const job = state.job;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/jobs" className="text-sm text-brand-600 hover:underline">
        &larr; Back to job listings
      </Link>

      <h1 className="mt-4 text-2xl font-semibold text-gray-900">{job.title}</h1>
      <p className="mt-1 text-sm text-gray-600">
        {job.department && `${job.department} · `}
        {job.location || 'Location not specified'} &middot; <span className="capitalize">{job.workMode}</span> &middot;{' '}
        <span className="capitalize">{job.employmentType.replace('-', ' ')}</span>
      </p>

      {(job.salaryMin || job.salaryMax) && (
        <p className="mt-1 text-sm text-gray-600">
          Salary: {job.salaryMin ?? '—'} - {job.salaryMax ?? '—'}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-1.5">
        {(job.requiredSkills || []).map((skill) => (
          <Badge key={skill} variant="brand">
            {skill}
          </Badge>
        ))}
      </div>

      <div className="mt-6">
        <Button onClick={handleApply} disabled={isCandidate}>
          Apply for this job
        </Button>
        {isCandidate && <p className="mt-2 text-sm text-gray-500">Applying opens in a future step.</p>}
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Description</h2>
        <p className="mt-2 whitespace-pre-line text-sm text-gray-700">{job.description}</p>
      </section>

      {job.responsibilities?.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900">Responsibilities</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
            {job.responsibilities.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {job.preferredSkills?.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900">Preferred skills</h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {job.preferredSkills.map((skill) => (
              <Badge key={skill}>{skill}</Badge>
            ))}
          </div>
        </section>
      )}

      {(job.education || job.experience) && (
        <section className="mt-6 text-sm text-gray-700">
          {job.education && <p>Education: {job.education}</p>}
          {job.experience && <p>Experience: {job.experience}</p>}
        </section>
      )}
    </div>
  );
}
