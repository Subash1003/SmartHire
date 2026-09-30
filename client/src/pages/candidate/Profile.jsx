import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { candidateProfileApi } from '../../api/candidateProfileApi';
import { updateCandidateProfileSchema } from '../../validators/candidateProfile.schema';
import { getApiErrorMessage } from '../../utils/getApiErrorMessage';
import FloatingInput from '../../components/ui/FloatingInput';
import FloatingTextarea from '../../components/ui/FloatingTextarea';
import Button from '../../components/ui/Button';
import FileUpload from '../../components/ui/FileUpload';
import PageLoading from '../../components/ui/PageLoading';
import PageError from '../../components/ui/PageError';

export default function CandidateProfile() {
  const [status, setStatus] = useState('loading');
  const [serverError, setServerError] = useState('');
  const [saved, setSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [savedValues, setSavedValues] = useState(null);
  const [resume, setResume] = useState(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeError, setResumeError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(updateCandidateProfileSchema) });

  const load = useCallback(() => {
    setStatus('loading');
    candidateProfileApi
      .getMine()
      .then((res) => {
        const profile = res.data.data.profile;
        const values = {
          phone: profile.phone || '',
          location: profile.location || '',
          summary: profile.summary || '',
          skillsText: (profile.skills || []).join(', '),
          portfolio: profile.portfolio || '',
          github: profile.github || '',
          linkedin: profile.linkedin || '',
        };
        reset(values);
        setSavedValues(values);
        setIsEditing(false);
        setResume(profile.resume || null);
        setStatus('success');
      })
      .catch(() => setStatus('error'));
  }, [reset]);

  useEffect(() => {
    load();
  }, [load]);

  const startEditing = () => {
    setSaved(false);
    setServerError('');
    setIsEditing(true);
  };

  const cancelEditing = () => {
    if (savedValues) reset(savedValues);
    setServerError('');
    setIsEditing(false);
  };

  const onSubmit = async (values) => {
    setServerError('');
    setSaved(false);
    const { skillsText, ...rest } = values;
    const skills = skillsText
      ? skillsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    try {
      await candidateProfileApi.updateMine({ ...rest, skills });
      setSavedValues(values);
      setSaved(true);
      setIsEditing(false);
    } catch (err) {
      setServerError(getApiErrorMessage(err, 'Unable to save your profile.'));
    }
  };

  const handleResumeSelect = async (file) => {
    setResumeError('');
    setResumeUploading(true);
    try {
      const res = await candidateProfileApi.uploadResume(file);
      setResume(res.data.data.profile.resume);
    } catch (err) {
      setResumeError(getApiErrorMessage(err, 'Unable to upload resume.'));
    } finally {
      setResumeUploading(false);
    }
  };

  if (status === 'loading') {
    return <PageLoading label="Loading your profile..." />;
  }

  if (status === 'error') {
    return <PageError message="Unable to load your profile." onRetry={load} />;
  }

  return (
    <div className="form-page">
      <h1 className="dashboard-page__title">Your profile</h1>
      <p className="text-muted profile-page__intro">Experience and education entries are added in a later step.</p>

      <section className="card card--padded card--shadow profile-page__section">
        <h2 className="profile-page__section-title">Resume</h2>
        {resume?.url && (
          <p className="text-muted profile-page__resume-current">
            Current file:{' '}
            <a href={resume.url} target="_blank" rel="noreferrer" className="link-accent">
              {resume.fileName}
            </a>
          </p>
        )}
        <div className="profile-page__resume-upload">
          <FileUpload
            onSelect={handleResumeSelect}
            uploading={resumeUploading}
            error={resumeError}
            currentFileName={resume?.fileName}
          />
        </div>
        {!resume?.url && <p className="text-faint profile-page__resume-hint">You will need a resume on file to apply for jobs.</p>}
      </section>

      <div className="card card--padded card--shadow form-page__card">
        <div className="dashboard-page__header">
          <h2 className="profile-page__section-title">Profile details</h2>
          {!isEditing && (
            <Button type="button" variant="secondary" onClick={startEditing}>
              Edit
            </Button>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="stack stack--gap-4" noValidate>
          <FloatingInput id="phone" label="Phone" disabled={!isEditing} error={errors.phone?.message} {...register('phone')} />
          <FloatingInput id="location" label="Location" disabled={!isEditing} error={errors.location?.message} {...register('location')} />
          <FloatingTextarea
            id="summary"
            label="Professional summary"
            disabled={!isEditing}
            error={errors.summary?.message}
            {...register('summary')}
          />
          <FloatingInput
            id="skillsText"
            label="Skills (comma-separated)"
            placeholder="React, Node.js, MongoDB"
            disabled={!isEditing}
            error={errors.skillsText?.message}
            {...register('skillsText')}
          />
          <FloatingInput id="portfolio" label="Portfolio URL" disabled={!isEditing} error={errors.portfolio?.message} {...register('portfolio')} />
          <FloatingInput id="github" label="GitHub URL" disabled={!isEditing} error={errors.github?.message} {...register('github')} />
          <FloatingInput id="linkedin" label="LinkedIn URL" disabled={!isEditing} error={errors.linkedin?.message} {...register('linkedin')} />

          {serverError && (
            <p className="text-error" role="alert">
              {serverError}
            </p>
          )}
          {saved && <p className="text-success">Profile saved.</p>}

          {isEditing && (
            <div className="cluster cluster--gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save profile'}
              </Button>
              <Button type="button" variant="secondary" onClick={cancelEditing} disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
