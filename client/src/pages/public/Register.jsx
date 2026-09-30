import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { registerSchema } from '../../validators/auth.schema';
import { useAuth } from '../../hooks/useAuth';
import { getApiErrorMessage } from '../../utils/getApiErrorMessage';
import FloatingInput from '../../components/ui/FloatingInput';
import Button from '../../components/ui/Button';

const ORGANIZATION_ID = import.meta.env.VITE_ORGANIZATION_ID;

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await registerUser({ ...values, organizationId: ORGANIZATION_ID });
      navigate('/candidate/dashboard', { replace: true });
    } catch (err) {
      setServerError(getApiErrorMessage(err, 'Unable to create your account.'));
    }
  };

  return (
    <div className="auth-page">
      <h1 className="auth-page__title">Create a candidate account</h1>

      <div className="auth-card">
        <form onSubmit={handleSubmit(onSubmit)} className="stack stack--gap-4" noValidate>
          <FloatingInput
            id="name"
            label="Full name"
            autoComplete="name"
            error={errors.name?.message}
            {...register('name')}
          />
          <FloatingInput
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <FloatingInput
            id="password"
            label="Password"
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
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </Button>
        </form>
      </div>

      <p className="text-muted">
        Already have an account?{' '}
        <Link to="/login" className="link-accent">
          Log in
        </Link>
      </p>
    </div>
  );
}
