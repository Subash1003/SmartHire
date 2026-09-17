import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { roleHomePath } from './roleHomePath';

export default function RoleRoute({ allow }) {
  const { user } = useAuth();

  if (!allow.includes(user.role)) {
    return <Navigate to={roleHomePath(user.role)} replace />;
  }

  return <Outlet />;
}
