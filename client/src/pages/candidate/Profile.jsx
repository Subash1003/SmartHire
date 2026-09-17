import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { candidateProfileApi } from '../../api/candidateProfileApi';
import { updateCandidateProfileSchema } from '../../validators/candidateProfile.schema';
import { getApiErrorMessage } from '../../utils/getApiErrorMessage';
import FloatingInput from '../../components/ui/FloatingInput';
import FloatingTextarea from '../../components/ui/FloatingTextarea';
import Button from '../../components/ui/Button';
import FileUpload from '../../components/ui/FileUpload';

export default function CandidateProfile() {
  const [status, setStatus] = useState('loading');
  const [serverError, setServerError] = useState('');
  const [saved, setSaved] = useState(false);
  const [resume, setResume] = useState(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeError, setResumeError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(updateCandidateProfileSchema) });

  useEffect(() => {
    candidateProfileApi
      .getMine()
      .then((res) => {
        const profile = res.data.data.profile;
        reset({
          phone: profile.phone || '',
          location: profile.location || '',
          summary: profile.summary || '',
          skillsText: (profile.skills || []).join(', '),
          portfolio: profile.portfolio || '',
          github: profile.github || '',
          linkedin: profile.linkedin || '',
        });
        setResume(profile.resume || null);
        setStatus('success');
      })
      .catch(() => setStatus('error'));
  }, [reset]);

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
      setSaved(true);
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
    return <p className="text-muted">Loading your profile...</p>;
  }

  if (status === 'error') {
    return <p className="text-error">Unable to load your profile. Please try again.</p>;
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
        <form onSubmit={handleSubmit(onSubmit)} className="stack stack--gap-4" noValidate>
          <FloatingInput id="phone" label="Phone" error={errors.phone?.message} {...register('phone')} />
          <FloatingInput id="location" label="Location" error={errors.location?.message} {...register('location')} />
          <FloatingTextarea
            id="summary"
            label="Professional summary"
            error={errors.summary?.message}
            {...register('summary')}
          />
          <FloatingInput
            id="skillsText"
            label="Skills (comma-separated)"
            placeholder="React, Node.js, MongoDB"
            error={errors.skillsText?.message}
            {...register('skillsText')}
          />
          <FloatingInput id="portfolio" label="Portfolio URL" error={errors.portfolio?.message} {...register('portfolio')} />
          <FloatingInput id="github" label="GitHub URL" error={errors.github?.message} {...register('github')} />
          <FloatingInput id="linkedin" label="LinkedIn URL" error={errors.linkedin?.message} {...register('linkedin')} />

          {serverError && <p className="text-error">{serverError}</p>}
          {saved && <p className="text-success">Profile saved.</p>}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save profile'}
          </Button>
        </form>
      </div>
    </div>
  );
}
