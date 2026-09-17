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
    } else if (isCandidate) {
      navigate(`/candidate/jobs/${id}/apply`);
    }
  };

  if (state.status === 'loading') {
    return <p className="page page--md page__loading-text">Loading job details...</p>;
  }

  if (state.status === 'error') {
    return (
      <div className="page page--md job-detail--centered">
        <p className="text-error">This job could not be found. It may have been closed or removed.</p>
        <Link to="/jobs" className="link-accent job-detail__back-link">
          Back to job listings
        </Link>
      </div>
    );
  }

  const job = state.job;

  return (
    <div className="page page--md">
      <Link to="/jobs" className="link-accent">
        &larr; Back to job listings
      </Link>

      <h1 className="job-detail__title">{job.title}</h1>
      <p className="job-detail__meta">
        {job.department && `${job.department} · `}
        {job.location || 'Location not specified'} &middot; <span className="capitalize">{job.workMode}</span> &middot;{' '}
        <span className="capitalize">{job.employmentType.replace('-', ' ')}</span>
      </p>

      {(job.salaryMin || job.salaryMax) && (
        <p className="job-detail__meta">
          Salary: {job.salaryMin ?? '—'} - {job.salaryMax ?? '—'}
        </p>
      )}

      <div className="job-detail__skills">
        {(job.requiredSkills || []).map((skill) => (
          <Badge key={skill} variant="brand">
            {skill}
          </Badge>
        ))}
      </div>

      <div className="job-detail__apply">
        <Button onClick={handleApply}>Apply for this job</Button>
      </div>

      <section className="job-detail__section">
        <h2 className="job-detail__section-title">Description</h2>
        <p className="job-detail__section-body">{job.description}</p>
      </section>

      {job.responsibilities?.length > 0 && (
        <section className="job-detail__section">
          <h2 className="job-detail__section-title">Responsibilities</h2>
          <ul className="job-detail__list">
            {job.responsibilities.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {job.preferredSkills?.length > 0 && (
        <section className="job-detail__section">
          <h2 className="job-detail__section-title">Preferred skills</h2>
          <div className="job-detail__skills">
            {job.preferredSkills.map((skill) => (
              <Badge key={skill}>{skill}</Badge>
            ))}
          </div>
        </section>
      )}

      {(job.education || job.experience) && (
        <section className="job-detail__section job-detail__facts">
          {job.education && <p>Education: {job.education}</p>}
          {job.experience && <p>Experience: {job.experience}</p>}
        </section>
      )}
    </div>
  );
}
