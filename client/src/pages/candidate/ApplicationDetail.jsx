import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { applicationsApi } from '../../api/applicationsApi';
import Badge from '../../components/ui/Badge';
import PageLoading from '../../components/ui/PageLoading';
import PageError from '../../components/ui/PageError';
import { STATUS_LABELS, STATUS_VARIANT } from '../../validators/applicationStatus';

export default function CandidateApplicationDetail() {
  const { id } = useParams();
  const [state, setState] = useState({ status: 'loading', application: null });

  const load = useCallback(() => {
    setState((s) => ({ ...s, status: 'loading' }));
    applicationsApi
      .get(id)
      .then((res) => setState({ status: 'success', application: res.data.data.application }))
      .catch(() => setState({ status: 'error', application: null }));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (state.status === 'loading') {
    return <PageLoading label="Loading application..." />;
  }

  if (state.status === 'error') {
    return <PageError message="Unable to load this application." onRetry={load} />;
  }

  const application = state.application;

  return (
    <div className="form-page">
      <Link to="/candidate/applications" className="link-accent">
        &larr; Back to applications
      </Link>

      <div className="application-detail__header">
        <h1 className="dashboard-page__title">{application.jobId?.title}</h1>
        <Badge variant={STATUS_VARIANT[application.status]}>{STATUS_LABELS[application.status]}</Badge>
      </div>

      <p className="text-muted application-detail__applied-on">
        Applied on {new Date(application.appliedAt).toLocaleDateString()}
      </p>

      <div className="application-detail__body">
        {application.coverLetter && (
          <div>
            <h2 className="application-detail__label">Cover letter</h2>
            <p className="application-detail__cover-letter">{application.coverLetter}</p>
          </div>
        )}
        {application.expectedSalary && (
          <p>
            <span className="application-detail__label">Expected salary:</span> {application.expectedSalary}
          </p>
        )}
        {application.availability && (
          <p>
            <span className="application-detail__label">Availability:</span> {application.availability}
          </p>
        )}
        <p>
          <span className="application-detail__label">Resume submitted:</span>{' '}
          <a href={application.resumeSnapshot.url} target="_blank" rel="noreferrer" className="link-accent">
            {application.resumeSnapshot.fileName}
          </a>
        </p>
      </div>
    </div>
  );
}
