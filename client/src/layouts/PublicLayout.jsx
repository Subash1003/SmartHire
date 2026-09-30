import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { roleHomePath } from '../routes/roleHomePath';

export default function PublicLayout() {
  const { user, status } = useAuth();

  return (
    <div className="site">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <header className="site-header">
        <div className="site-header__inner">
          <Link to="/" className="site-header__logo">
            SmartHire
          </Link>

          <nav className="site-nav">
            <Link to="/jobs" className="site-nav__link">
              Browse jobs
            </Link>
            {status === 'authenticated' && user ? (
              <Link to={roleHomePath(user.role)} className="site-nav__cta">
                Go to dashboard
              </Link>
            ) : (
              <div className="cluster cluster--gap-3">
                <Link to="/login" className="site-nav__link">
                  Log in
                </Link>
                <Link to="/register" className="site-nav__cta">
                  Sign up
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main id="main-content" className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="site-footer__inner">&copy; {new Date().getFullYear()} SmartHire</div>
      </footer>
    </div>
  );
}
