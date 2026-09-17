import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { roleHomePath } from '../routes/roleHomePath';

export default function PublicLayout() {
  const { user, status } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-lg font-semibold text-gray-900">
            SmartHire
          </Link>

          <nav className="flex items-center gap-4 text-sm">
            {status === 'authenticated' && user ? (
              <Link to={roleHomePath(user.role)} className="font-medium text-brand-600 hover:underline">
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:underline">
                  Log in
                </Link>
                <Link to="/register" className="text-gray-700 hover:underline">
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-gray-500">
          &copy; {new Date().getFullYear()} SmartHire
        </div>
      </footer>
    </div>
  );
}
