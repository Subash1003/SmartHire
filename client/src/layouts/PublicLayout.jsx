import { Outlet, Link } from 'react-router-dom';

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-lg font-semibold text-gray-900">
            SmartHire
          </Link>
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
