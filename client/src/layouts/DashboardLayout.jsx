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
    { to: '/recruiter/applications', label: 'Applications' },
    { to: '/recruiter/candidates', label: 'Pipeline' },
    { to: '/recruiter/interviews', label: 'Interviews' },
  ],
  interviewer: [
    { to: '/interviewer/dashboard', label: 'Dashboard' },
    { to: '/interviewer/interviews', label: 'Interviews' },
  ],
  candidate: [
    { to: '/candidate/dashboard', label: 'Dashboard' },
    { to: '/candidate/applications', label: 'My Applications' },
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
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-header__inner">
          <span className="dashboard-header__logo">SmartHire</span>
          <div className="cluster cluster--gap-4">
            <span className="dashboard-header__user">
              {user?.name} &middot; <span className="capitalize">{user?.role}</span>
            </span>
            <Button variant="secondary" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        </div>
      </header>

      <div className="dashboard-body">
        <nav className="dashboard-sidebar">
          <ul className="dashboard-nav">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `dashboard-nav__link ${isActive ? 'dashboard-nav__link--active' : ''}`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <main className="dashboard-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
