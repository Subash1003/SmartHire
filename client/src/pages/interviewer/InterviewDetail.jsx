import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { interviewsApi } from '../../api/interviewsApi';
import { applicationsApi } from '../../api/applicationsApi';
import Badge from '../../components/ui/Badge';
import { INTERVIEW_STATUS_LABELS, INTERVIEW_STATUS_VARIANT } from '../../validators/interviewStatus';

export default function InterviewerInterviewDetail() {
  const { id } = useParams();
  const [state, setState] = useState({ status: 'loading', interview: null, application: null });

  useEffect(() => {
    interviewsApi
      .get(id)
      .then(async (res) => {
        const interview = res.data.data.interview;
        const appRes = await applicationsApi.get(interview.applicationId._id || interview.applicationId);
        setState({ status: 'success', interview, application: appRes.data.data.application });
      })
      .catch(() => setState({ status: 'error', interview: null, application: null }));
  }, [id]);

  if (state.status === 'loading') {
    return <p className="text-muted">Loading interview...</p>;
  }

  if (state.status === 'error') {
    return <p className="text-error">Unable to load this interview. Please try again.</p>;
  }

  const { interview, application } = state;

  return (
    <div className="form-page">
      <Link to="/interviewer/interviews" className="link-accent">
        &larr; Back to your interviews
      </Link>

      <div className="application-detail__header">
        <h1 className="dashboard-page__title">{interview.candidateId?.name}</h1>
        <Badge variant={INTERVIEW_STATUS_VARIANT[interview.status]}>{INTERVIEW_STATUS_LABELS[interview.status]}</Badge>
      </div>
      <p className="text-muted">{interview.candidateId?.email}</p>

      <section className="job-detail__section">
        <h2 className="job-detail__section-title">Interview details</h2>
        <div className="application-detail__body">
          <p>
            <span className="application-detail__label">Job:</span> {interview.jobId?.title}
          </p>
          <p>
            <span className="application-detail__label">Type:</span> <span className="capitalize">{interview.type}</span>{' '}
            &middot; Round {interview.round}
          </p>
          <p>
            <span className="application-detail__label">When:</span> {new Date(interview.startTime).toLocaleString()} –{' '}
            {new Date(interview.endTime).toLocaleString()}
          </p>
          {interview.meetingLink && (
            <p>
              <span className="application-detail__label">Meeting link:</span>{' '}
              <a href={interview.meetingLink} target="_blank" rel="noreferrer" className="link-accent">
                {interview.meetingLink}
              </a>
            </p>
          )}
          {interview.notes && (
            <p>
              <span className="application-detail__label">Notes:</span> {interview.notes}
            </p>
          )}
        </div>
      </section>

      {application && (
        <section className="job-detail__section">
          <h2 className="job-detail__section-title">Candidate resume</h2>
          <p className="application-detail__body">
            <a href={application.resumeSnapshot.url} target="_blank" rel="noreferrer" className="link-accent">
              {application.resumeSnapshot.fileName}
            </a>
          </p>
        </section>
      )}
    </div>
  );
}
