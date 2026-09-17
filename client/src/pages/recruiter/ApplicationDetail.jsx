import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { applicationsApi } from '../../api/applicationsApi';
import { getApiErrorMessage } from '../../utils/getApiErrorMessage';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import FloatingSelect from '../../components/ui/FloatingSelect';
import FloatingTextarea from '../../components/ui/FloatingTextarea';
import { STATUS_LABELS, STATUS_VARIANT } from '../../validators/applicationStatus';
import { RECOMMENDATION_LABELS, RECOMMENDATION_VARIANT } from '../../validators/evaluation.schema';

const PIPELINE_STATUS_OPTIONS = Object.entries(STATUS_LABELS)
  .filter(([value]) => value !== 'selected' && value !== 'rejected')
  .map(([value, label]) => ({ value, label }));

const DECISION_OPTIONS = [
  { value: 'selected', label: 'Selected' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'on_hold', label: 'On Hold' },
];

const RATING_FIELDS = [
  { key: 'technicalSkills', label: 'Technical skills' },
  { key: 'problemSolving', label: 'Problem solving' },
  { key: 'communication', label: 'Communication' },
  { key: 'roleKnowledge', label: 'Role knowledge' },
  { key: 'codingSkills', label: 'Coding skills' },
  { key: 'overallRating', label: 'Overall rating' },
];

export default function RecruiterApplicationDetail() {
  const { id } = useParams();
  const [state, setState] = useState({ status: 'loading', application: null });
  const [statusValue, setStatusValue] = useState('');
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState('');

  const [decisionValue, setDecisionValue] = useState('selected');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [decisionSaving, setDecisionSaving] = useState(false);
  const [decisionError, setDecisionError] = useState('');

  const [notes, setNotes] = useState([]);
  const [notesStatus, setNotesStatus] = useState('loading');
  const [noteError, setNoteError] = useState('');

  const [evaluations, setEvaluations] = useState([]);
  const [evaluationsStatus, setEvaluationsStatus] = useState('loading');

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm();

  const loadApplication = () => {
    applicationsApi
      .get(id)
      .then((res) => {
        setState({ status: 'success', application: res.data.data.application });
        setStatusValue(res.data.data.application.status);
      })
      .catch(() => setState({ status: 'error', application: null }));
  };

  const loadNotes = () => {
    setNotesStatus('loading');
    applicationsApi
      .listNotes(id)
      .then((res) => {
        setNotes(res.data.data.notes);
        setNotesStatus('success');
      })
      .catch(() => setNotesStatus('error'));
  };

  const loadEvaluations = () => {
    setEvaluationsStatus('loading');
    applicationsApi
      .listEvaluations(id)
      .then((res) => {
        setEvaluations(res.data.data.evaluations);
        setEvaluationsStatus('success');
      })
      .catch(() => setEvaluationsStatus('error'));
  };

  useEffect(() => {
    loadApplication();
    loadNotes();
    loadEvaluations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStatusUpdate = async () => {
    setStatusError('');
    setStatusSaving(true);
    try {
      await applicationsApi.updateStatus(id, statusValue);
      loadApplication();
    } catch (err) {
      setStatusError(getApiErrorMessage(err, 'Unable to update status.'));
    } finally {
      setStatusSaving(false);
    }
  };

  const handleDecision = async () => {
    setDecisionError('');
    setDecisionSaving(true);
    try {
      await applicationsApi.makeDecision(id, decisionValue, decisionNotes);
      setDecisionNotes('');
      loadApplication();
    } catch (err) {
      setDecisionError(getApiErrorMessage(err, 'Unable to record this decision.'));
    } finally {
      setDecisionSaving(false);
    }
  };

  const onAddNote = async (values) => {
    setNoteError('');
    try {
      await applicationsApi.createNote(id, values.content);
      reset({ content: '' });
      loadNotes();
    } catch (err) {
      setNoteError(getApiErrorMessage(err, 'Unable to add note.'));
    }
  };

  if (state.status === 'loading') {
    return <p className="text-muted">Loading application...</p>;
  }

  if (state.status === 'error') {
    return <p className="text-error">Unable to load this application. Please try again.</p>;
  }

  const application = state.application;

  return (
    <div className="form-page">
      <Link to="/recruiter/applications" className="link-accent">
        &larr; Back to applications
      </Link>

      <div className="application-detail__header">
        <h1 className="dashboard-page__title">{application.candidateId?.name}</h1>
        <Badge variant={STATUS_VARIANT[application.status]}>{STATUS_LABELS[application.status]}</Badge>
        <Link to={`/recruiter/interviews/schedule?applicationId=${application._id}`} className="application-detail__header-action">
          <Button variant="secondary">Schedule interview</Button>
        </Link>
      </div>
      <p className="text-muted">{application.candidateId?.email}</p>

      <p className="text-muted application-detail__applied-on">
        Applied to <span className="application-detail__label">{application.jobId?.title}</span> on{' '}
        {new Date(application.appliedAt).toLocaleDateString()}
      </p>

      <div className="application-detail__body">
        <p>
          <span className="application-detail__label">Resume:</span>{' '}
          <a href={application.resumeSnapshot.url} target="_blank" rel="noreferrer" className="link-accent">
            {application.resumeSnapshot.fileName}
          </a>
        </p>
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
      </div>

      <section className="card card--padded card--shadow application-detail__status-card">
        <h2 className="profile-page__section-title">Update status</h2>
        <div className="application-detail__status-row">
          <div className="filter-field">
            <FloatingSelect
              id="statusValue"
              label="Status"
              value={statusValue}
              onChange={(e) => setStatusValue(e.target.value)}
              options={PIPELINE_STATUS_OPTIONS}
            />
          </div>
          <Button onClick={handleStatusUpdate} disabled={statusSaving || statusValue === application.status}>
            {statusSaving ? 'Updating...' : 'Update status'}
          </Button>
        </div>
        {statusError && <p className="text-error">{statusError}</p>}

        {application.statusHistory?.length > 0 && (
          <ul className="application-detail__history">
            {[...application.statusHistory].reverse().map((entry, index) => (
              <li key={index} className="application-detail__history-item">
                <Badge variant={STATUS_VARIANT[entry.status]}>{STATUS_LABELS[entry.status]}</Badge>
                <span className="text-faint">
                  {entry.changedBy?.name ? `by ${entry.changedBy.name}` : ''} on{' '}
                  {new Date(entry.changedAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card card--padded card--shadow application-detail__status-card">
        <h2 className="profile-page__section-title">Final hiring decision</h2>
        <p className="text-faint">Only recruiters and admins can make this call — it is recorded permanently.</p>

        {application.decision && (
          <p className="application-detail__applied-on">
            <span className="application-detail__label">Current decision:</span>{' '}
            <Badge variant={STATUS_VARIANT[application.decision.status]}>{STATUS_LABELS[application.decision.status]}</Badge>{' '}
            <span className="text-faint">
              by {application.decision.madeBy?.name} on {new Date(application.decision.madeAt).toLocaleString()}
            </span>
            {application.decision.notes && <span className="text-faint"> — {application.decision.notes}</span>}
          </p>
        )}

        <div className="application-detail__status-row">
          <div className="filter-field">
            <FloatingSelect
              id="decisionValue"
              label="Decision"
              value={decisionValue}
              onChange={(e) => setDecisionValue(e.target.value)}
              options={DECISION_OPTIONS}
            />
          </div>
          <Button variant="danger" onClick={handleDecision} disabled={decisionSaving}>
            {decisionSaving ? 'Recording...' : 'Record decision'}
          </Button>
        </div>
        <FloatingTextarea
          id="decisionNotes"
          label="Decision notes (optional)"
          rows={2}
          value={decisionNotes}
          onChange={(e) => setDecisionNotes(e.target.value)}
        />
        {decisionError && <p className="text-error">{decisionError}</p>}
      </section>

      <section className="card card--padded card--shadow application-detail__status-card">
        <h2 className="profile-page__section-title">Evaluations</h2>

        {evaluationsStatus === 'loading' && <p className="text-muted">Loading evaluations...</p>}
        {evaluationsStatus === 'error' && <p className="text-error">Unable to load evaluations.</p>}
        {evaluationsStatus === 'success' && evaluations.length === 0 && (
          <p className="text-faint">No evaluations submitted yet.</p>
        )}
        {evaluationsStatus === 'success' && evaluations.length > 0 && (
          <ul className="application-detail__notes-list">
            {evaluations.map((evaluation) => (
              <li key={evaluation._id} className="application-detail__note-item">
                <div className="cluster cluster--gap-2">
                  <span className="application-detail__label capitalize">
                    {evaluation.interview?.type} interview (round {evaluation.interview?.round})
                  </span>
                  <Badge variant={RECOMMENDATION_VARIANT[evaluation.recommendation]}>
                    {RECOMMENDATION_LABELS[evaluation.recommendation]}
                  </Badge>
                </div>
                <p className="text-faint">
                  {evaluation.interviewerId?.name} &middot; {new Date(evaluation.createdAt).toLocaleString()}
                </p>
                <p className="application-detail__note-content">
                  {RATING_FIELDS.map((f) => `${f.label}: ${evaluation[f.key]}/10`).join(' · ')}
                </p>
                {evaluation.feedback && <p className="application-detail__note-content">{evaluation.feedback}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card card--padded card--shadow application-detail__notes-card">
        <h2 className="profile-page__section-title">Private notes</h2>
        <p className="text-faint">Only visible to your recruiting team — never shown to the candidate.</p>

        <form onSubmit={handleSubmit(onAddNote)} className="application-detail__note-form" noValidate>
          <FloatingTextarea id="content" label="Add a note" rows={3} {...register('content', { required: true })} />
          <Button type="submit" disabled={isSubmitting} className="application-detail__note-submit">
            {isSubmitting ? 'Adding...' : 'Add note'}
          </Button>
        </form>
        {noteError && <p className="text-error">{noteError}</p>}

        {notesStatus === 'loading' && <p className="text-muted">Loading notes...</p>}
        {notesStatus === 'error' && <p className="text-error">Unable to load notes.</p>}
        {notesStatus === 'success' && (
          <ul className="application-detail__notes-list">
            {notes.length === 0 && <li className="text-faint">No notes yet.</li>}
            {notes.map((note) => (
              <li key={note._id} className="application-detail__note-item">
                <p className="application-detail__note-content">{note.content}</p>
                <p className="text-faint">
                  {note.authorId?.name} &middot; {new Date(note.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
