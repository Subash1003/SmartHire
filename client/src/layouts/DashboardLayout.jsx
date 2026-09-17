import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';

const NAV_ITEMS = {
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/settings', label: 'Settings' },
  ],
  recruiter: [
    { to: '/recruiter/dashboard', label: 'Dashboard' },
    { to: '/recruiter/jobs', label: 'Jobs' },
  ],
  interviewer: [{ to: '/interviewer/dashboard', label: 'Dashboard' }],
  candidate: [
    { to: '/candidate/dashboard', label: 'Dashboard' },
    { to: '/candidate/profile', label: 'Profile' },
  ],
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = NAV_ITEMS[user?.role] || [];

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span className="text-lg font-semibold text-gray-900">SmartHire</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user?.name} &middot; <span className="capitalize">{user?.role}</span>
            </span>
            <Button variant="secondary" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-8 px-4 py-8">
        <nav className="w-48 shrink-0">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `block rounded-md px-3 py-2 text-sm font-medium ${
                      isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
