import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { applicationsApi } from '../../api/applicationsApi';
import Badge from '../../components/ui/Badge';
import { STATUS_LABELS, STATUS_VARIANT } from '../../validators/applicationStatus';

export default function RecruiterApplicationDetail() {
  const { id } = useParams();
  const [state, setState] = useState({ status: 'loading', application: null });

  useEffect(() => {
    applicationsApi
      .get(id)
      .then((res) => setState({ status: 'success', application: res.data.data.application }))
      .catch(() => setState({ status: 'error', application: null }));
  }, [id]);

  if (state.status === 'loading') {
    return <p className="text-sm text-gray-500">Loading application...</p>;
  }

  if (state.status === 'error') {
    return <p className="text-sm text-red-600">Unable to load this application. Please try again.</p>;
  }

  const application = state.application;

  return (
    <div className="max-w-2xl">
      <Link to="/recruiter/applications" className="text-sm text-brand-600 hover:underline">
        &larr; Back to applications
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <h1 className="text-xl font-semibold text-gray-900">{application.candidateId?.name}</h1>
        <Badge variant={STATUS_VARIANT[application.status]}>{STATUS_LABELS[application.status]}</Badge>
      </div>
      <p className="text-sm text-gray-600">{application.candidateId?.email}</p>

      <p className="mt-2 text-sm text-gray-600">
        Applied to <span className="font-medium text-gray-900">{application.jobId?.title}</span> on{' '}
        {new Date(application.appliedAt).toLocaleDateString()}
      </p>

      <div className="mt-6 space-y-4 text-sm text-gray-700">
        <p>
          <span className="font-semibold text-gray-900">Resume:</span>{' '}
          <a href={application.resumeSnapshot.url} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">
            {application.resumeSnapshot.fileName}
          </a>
        </p>
        {application.coverLetter && (
          <div>
            <h2 className="font-semibold text-gray-900">Cover letter</h2>
            <p className="mt-1 whitespace-pre-line">{application.coverLetter}</p>
          </div>
        )}
        {application.expectedSalary && (
          <p>
            <span className="font-semibold text-gray-900">Expected salary:</span> {application.expectedSalary}
          </p>
        )}
        {application.availability && (
          <p>
            <span className="font-semibold text-gray-900">Availability:</span> {application.availability}
          </p>
        )}
      </div>

      <p className="mt-6 text-xs text-gray-400">Status changes are managed from the recruitment pipeline (coming next).</p>
    </div>
  );
}
