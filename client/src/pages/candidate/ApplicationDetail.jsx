import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { applicationsApi } from '../../api/applicationsApi';
import Badge from '../../components/ui/Badge';
import { STATUS_LABELS, STATUS_VARIANT } from '../../validators/applicationStatus';

export default function CandidateApplicationDetail() {
  const { id } = useParams();
  const [state, setState] = useState({ status: 'loading', application: null });

  useEffect(() => {
    applicationsApi
      .get(id)
      .then((res) => setState({ status: 'success', application: res.data.data.application }))
      .catch(() => setState({ status: 'error', application: null }));
  }, [id]);

  if (state.status === 'loading') {
    return <p className="text-muted">Loading application...</p>;
  }

  if (state.status === 'error') {
    return <p className="text-error">Unable to load this application. Please try again.</p>;
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
