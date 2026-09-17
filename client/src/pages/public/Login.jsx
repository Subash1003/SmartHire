import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { loginSchema } from '../../validators/auth.schema';
import { useAuth } from '../../hooks/useAuth';
import { getApiErrorMessage } from '../../utils/getApiErrorMessage';
import Input from '../../components/ui/Input';
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
    <div className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-semibold text-gray-900">Log in to SmartHire</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Input
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Logging in...' : 'Log in'}
        </Button>
      </form>

      <div className="flex justify-between text-sm text-gray-600">
        <Link to="/forgot-password" className="hover:underline">
          Forgot password?
        </Link>
        <Link to="/register" className="hover:underline">
          Create a candidate account
        </Link>
      </div>
    </div>
  );
}
