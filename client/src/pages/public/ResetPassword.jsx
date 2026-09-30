import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPasswordSchema } from '../../validators/auth.schema';
import { authApi } from '../../api/authApi';
import { getApiErrorMessage } from '../../utils/getApiErrorMessage';
import FloatingInput from '../../components/ui/FloatingInput';
import Button from '../../components/ui/Button';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await authApi.resetPassword({ token, password: values.password });
      navigate('/login', { replace: true });
    } catch (err) {
      setServerError(getApiErrorMessage(err, 'This reset link is invalid or has expired.'));
    }
  };

  if (!token) {
    return (
      <div className="auth-page auth-page--centered">
        <h1 className="auth-page__title">Invalid link</h1>
        <p className="text-muted">This password reset link is missing its token.</p>
        <Link to="/forgot-password" className="text-muted link-accent">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <h1 className="auth-page__title">Set a new password</h1>

      <div className="auth-card">
        <form onSubmit={handleSubmit(onSubmit)} className="stack stack--gap-4" noValidate>
          <FloatingInput
            id="password"
            label="New password"
            type="password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password')}
          />

          {serverError && (
            <p className="text-error" role="alert">
              {serverError}
            </p>
          )}

          <Button type="submit" disabled={isSubmitting} className="btn--block">
            {isSubmitting ? 'Resetting...' : 'Reset password'}
          </Button>
        </form>
      </div>
    </div>
  );
}
