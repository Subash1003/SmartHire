import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { forgotPasswordSchema } from '../../validators/auth.schema';
import { authApi } from '../../api/authApi';
import { getApiErrorMessage } from '../../utils/getApiErrorMessage';
import FloatingInput from '../../components/ui/FloatingInput';
import Button from '../../components/ui/Button';

export default function ForgotPassword() {
  const [serverError, setServerError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await authApi.forgotPassword(values);
      setSubmitted(true);
    } catch (err) {
      setServerError(getApiErrorMessage(err));
    }
  };

  if (submitted) {
    return (
      <div className="auth-page auth-page--centered">
        <h1 className="auth-page__title">Check your email</h1>
        <p className="text-muted">
          If an account with that email exists, we&apos;ve sent a link to reset your password.
        </p>
        <Link to="/login" className="text-muted link-accent">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <h1 className="auth-page__title">Reset your password</h1>

      <div className="auth-card">
        <form onSubmit={handleSubmit(onSubmit)} className="stack stack--gap-4" noValidate>
          <FloatingInput
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />

          {serverError && <p className="text-error">{serverError}</p>}

          <Button type="submit" disabled={isSubmitting} className="btn--block">
            {isSubmitting ? 'Sending...' : 'Send reset link'}
          </Button>
        </form>
      </div>
    </div>
  );
}
