import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { loginSchema } from '../../validators/auth.schema';
import { useAuth } from '../../hooks/useAuth';
import { getApiErrorMessage } from '../../utils/getApiErrorMessage';
import FloatingInput from '../../components/ui/FloatingInput';
import Button from '../../components/ui/Button';
import { roleHomePath } from '../../routes/roleHomePath';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      const user = await login(values);
      const redirectTo = location.state?.from || roleHomePath(user.role);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setServerError(getApiErrorMessage(err, 'Invalid email or password.'));
    }
  };

  return (
    <div className="auth-page">
      <h1 className="auth-page__title">Log in to SmartHire</h1>

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
          <FloatingInput
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />

          {serverError && <p className="text-error">{serverError}</p>}

          <Button type="submit" disabled={isSubmitting} className="btn--block">
            {isSubmitting ? 'Logging in...' : 'Log in'}
          </Button>
        </form>
      </div>

      <div className="auth-page__footer-links">
        <Link to="/forgot-password" className="link-muted">
          Forgot password?
        </Link>
        <Link to="/register" className="link-muted">
          Create a candidate account
        </Link>
      </div>
    </div>
  );
}
