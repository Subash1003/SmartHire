import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { interviewsApi } from '../../api/interviewsApi';
import { applicationsApi } from '../../api/applicationsApi';
import { evaluationsApi } from '../../api/evaluationsApi';
import { getApiErrorMessage } from '../../utils/getApiErrorMessage';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import FloatingSelect from '../../components/ui/FloatingSelect';
import FloatingTextarea from '../../components/ui/FloatingTextarea';
import ResumeViewerModal from '../../components/resume/ResumeViewerModal';
import PageLoading from '../../components/ui/PageLoading';
import PageError from '../../components/ui/PageError';
import { INTERVIEW_STATUS_LABELS, INTERVIEW_STATUS_VARIANT } from '../../validators/interviewStatus';
import {
  evaluationFormSchema,
  RECOMMENDATION_OPTIONS,
  RECOMMENDATION_LABELS,
  RECOMMENDATION_VARIANT,
} from '../../validators/evaluation.schema';

const RATING_OPTIONS = Array.from({ length: 10 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));
const RATING_FIELDS = [
  { name: 'technicalSkills', label: 'Technical skills' },
  { name: 'problemSolving', label: 'Problem solving' },
  { name: 'communication', label: 'Communication' },
  { name: 'roleKnowledge', label: 'Role knowledge' },
  { name: 'codingSkills', label: 'Coding skills' },
  { name: 'overallRating', label: 'Overall rating' },
];

export default function InterviewerInterviewDetail() {
  const { id } = useParams();
  const [state, setState] = useState({ status: 'loading', interview: null, application: null });
  const [resumeViewerOpen, setResumeViewerOpen] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(evaluationFormSchema), defaultValues: { recommendation: 'select' } });

  const load = async () => {
    try {
      const res = await interviewsApi.get(id);
      const interview = res.data.data.interview;
      const appRes = await applicationsApi.get(interview.applicationId._id || interview.applicationId);
      setState({ status: 'success', interview, application: appRes.data.data.application });

      try {
        const evalRes = await evaluationsApi.getForInterview(id);
        setEvaluation(evalRes.data.data.evaluation);
      } catch {
        setEvaluation(null);
      }
    } catch {
      setState({ status: 'error', interview: null, application: null });
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const startEditing = () => {
    if (evaluation) reset(evaluation);
    setIsEditing(true);
  };

  const onSubmit = async (values) => {
    setServerError('');
    try {
      if (evaluation) {
        await evaluationsApi.update(evaluation._id, values);
      } else {
        await evaluationsApi.create({ interviewId: id, ...values });
      }
      setIsEditing(false);
      load();
    } catch (err) {
      setServerError(getApiErrorMessage(err, 'Unable to save this evaluation.'));
    }
  };

  if (state.status === 'loading') {
    return <PageLoading label="Loading interview..." />;
  }

  if (state.status === 'error') {
    return <PageError message="Unable to load this interview." onRetry={load} />;
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
            <button type="button" className="resume-viewer__trigger" onClick={() => setResumeViewerOpen(true)}>
              <span className="link-accent">{application.resumeSnapshot.fileName}</span>
            </button>
          </p>
        </section>
      )}

      <section className="card card--padded card--shadow application-detail__status-card">
        <h2 className="profile-page__section-title">Evaluation</h2>

        {evaluation && !isEditing && (
          <div className="application-detail__body">
            <p>
              <span className="application-detail__label">Recommendation:</span>{' '}
              <Badge variant={RECOMMENDATION_VARIANT[evaluation.recommendation]}>
                {RECOMMENDATION_LABELS[evaluation.recommendation]}
              </Badge>
            </p>
            {RATING_FIELDS.map((field) => (
              <p key={field.name}>
                <span className="application-detail__label">{field.label}:</span> {evaluation[field.name]}/10
              </p>
            ))}
            {evaluation.feedback && (
              <p>
                <span className="application-detail__label">Feedback:</span> {evaluation.feedback}
              </p>
            )}
            <Button variant="secondary" onClick={startEditing}>
              Edit evaluation
            </Button>
          </div>
        )}

        {(!evaluation || isEditing) && (
          <form onSubmit={handleSubmit(onSubmit)} className="stack stack--gap-4" noValidate>
            <div className="form-grid-2">
              {RATING_FIELDS.map((field) => (
                <FloatingSelect
                  key={field.name}
                  id={field.name}
                  label={field.label}
                  options={RATING_OPTIONS}
                  error={errors[field.name]?.message}
                  {...register(field.name)}
                />
              ))}
            </div>

            <FloatingSelect
              id="recommendation"
              label="Recommendation"
              options={RECOMMENDATION_OPTIONS}
              error={errors.recommendation?.message}
              {...register('recommendation')}
            />

            <FloatingTextarea
              id="feedback"
              label="Feedback (optional)"
              rows={4}
              error={errors.feedback?.message}
              {...register('feedback')}
            />

            {serverError && (
            <p className="text-error" role="alert">
              {serverError}
            </p>
          )}

            <div className="cluster cluster--gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Submit evaluation'}
              </Button>
              {evaluation && (
                <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        )}
      </section>

      {application && (
        <ResumeViewerModal
          open={resumeViewerOpen}
          onClose={() => setResumeViewerOpen(false)}
          resumeUrl={application.resumeSnapshot.url}
          fileName={application.resumeSnapshot.fileName}
          fileType={application.resumeSnapshot.fileType}
        />
      )}
    </div>
  );
}
