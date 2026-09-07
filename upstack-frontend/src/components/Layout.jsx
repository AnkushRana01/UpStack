import { Cloud, Files, Gauge, LogOut, Menu, Moon, Settings, Share2, Shield, Sun, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import AppFooter from './AppFooter.jsx';
import GlobalSearchBar from './GlobalSearchBar.jsx';
import UploadNewButton from './UploadNewButton.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isDashboard = location.pathname === '/' || location.pathname === '/dashboard';
  const isFiles = location.pathname === '/files';
  const isShared = location.pathname === '/shared';
  const isAdminConsole = location.pathname === '/admin';
  const isSettings = location.pathname === '/settings';
  const hideNavbar = isAdminConsole || isSettings;

  // Nav items: admins see Admin Console instead of separate Settings
  const nav = [
    { to: '/', label: 'Dashboard', icon: Gauge },
    { to: '/files', label: 'My Files', icon: Files },
    { to: '/shared', label: 'Shared Files', icon: Share2 },
    // For admins: show Admin Console (settings are inside Admin page)
    ...(isAdmin
      ? [{ to: '/admin', label: 'Admin Console', icon: Shield }]
      : [{ to: '/settings', label: 'Settings', icon: Settings }]
    ),
  ];

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  function onLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  // UpStack Logo component
  const Logo = () => (
    <Link to="/" className="flex items-center gap-3">
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
        <Cloud size={24} />
      </div>
      <div>
        <p className="text-base font-black tracking-tight text-slate-950 dark:text-white">UpStack</p>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Cloud Drive</p>
      </div>
    </Link>
  );

  const NavItems = ({ onClick }) => (
    <>
      {nav.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          onClick={onClick}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-200 ${
              isActive
                ? 'bg-blue-50 text-blue-700 shadow-sm dark:bg-blue-950/40 dark:text-blue-200'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'
            }`
          }
        >
          <item.icon size={18} />
          {item.label}
        </NavLink>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-slate-200 bg-white/90 px-5 py-6 shadow-[8px_0_30px_rgba(15,23,42,0.04)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 lg:block">
        <Logo />
        <nav className="mt-10 space-y-1.5">
          <NavItems />
        </nav>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 bg-white px-5 py-6 shadow-2xl transition-transform duration-300 dark:border-slate-800 dark:bg-slate-900 lg:hidden ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between">
          <Logo />
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="mt-8 space-y-2">
          <NavItems onClick={() => setMobileOpen(false)} />
        </nav>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-72">
        {/* Navigation Header - Hidden on Admin Console and Settings pages per P2 */}
        {!hideNavbar ? (
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 pt-6 pb-2 md:px-8 md:pt-8 md:pb-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileOpen(true)}
                className="rounded-lg p-2 hover:bg-slate-200/60 dark:hover:bg-slate-800 lg:hidden text-slate-600 dark:text-slate-400"
                aria-label="Open menu"
              >
                <Menu size={22} />
              </button>
              {isDashboard && (
                <h1 className="text-xl sm:text-2xl lg:text-[28px] font-bold tracking-tight text-slate-900 dark:text-white truncate">
                  Welcome, {user?.name || 'User'}! 👋🏻
                </h1>
              )}
              {isFiles && (
                <h1 className="text-xl sm:text-2xl lg:text-[28px] font-bold tracking-tight text-slate-900 dark:text-white truncate">
                  My Files
                </h1>
              )}
              {isShared && (
                <h1 className="text-xl sm:text-2xl lg:text-[28px] font-bold tracking-tight text-slate-900 dark:text-white truncate">
                  Shared Files
                </h1>
              )}
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap sm:flex-nowrap">
              {/* Upload New Files and Folder Button */}
              <UploadNewButton />

              {/* Global Search Bar */}
              <GlobalSearchBar />

              {/* Dark mode toggle */}
              <button
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 sm:p-2.5"
                onClick={() => setDark((v) => !v)}
                title="Toggle theme"
                aria-label="Toggle dark mode"
              >
                {dark ? <Sun size={17} /> : <Moon size={17} />}
              </button>

              {/* Logout */}
              <button
                className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200 sm:px-3.5 sm:py-2.5"
                onClick={onLogout}
                aria-label="Log out"
                title="Log out"
              >
                <span className="inline-flex items-center gap-1.5">
                  <LogOut size={14} />
                  <span className="hidden md:inline">Logout</span>
                </span>
              </button>
            </div>
          </header>
        ) : (
          /* Mobile menu toggle for pages where navbar is removed */
          <div className="lg:hidden flex items-center justify-between px-4 pt-4 pb-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <main className={`flex-1 px-4 pb-8 md:px-8 md:pb-8 animate-fade-in-up ${hideNavbar ? 'pt-4 md:pt-6' : 'pt-2'}`}>
          <Outlet />
        </main>
        <AppFooter dark={dark} />
      </div>
    </div>
  );
}
