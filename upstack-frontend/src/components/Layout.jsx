import { Bell, ChevronDown, Cloud, Files, Gauge, LogOut, Menu, Moon, Plus, Search, Settings, Share2, Shield, Sun, UserCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import AppFooter from './AppFooter.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const nav = [
  { to: '/', label: 'Dashboard', icon: Gauge },
  { to: '/files', label: 'Files', icon: Files },
  { to: '/shared', label: 'Shared', icon: Share2 },
  { to: '/admin', label: 'Admin', icon: Shield, admin: true },
  { to: '/settings', label: 'Settings', icon: Settings }
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  function onLogout() {
    logout();
    navigate('/login');
  }

  // UpStack Logo component
  const Logo = () => (
    <div className="flex items-center gap-3">
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
        <Cloud size={24} />
      </div>
      <div>
        <p className="text-base font-black tracking-tight text-slate-950 dark:text-white">UpStack</p>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Cloud Drive</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-slate-200 bg-white/90 px-5 py-6 shadow-[8px_0_30px_rgba(15,23,42,0.04)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 lg:block">
        <Logo />
        <nav className="mt-10 space-y-1.5">
          {nav.filter((item) => !item.admin || user?.role === 'admin').map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
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
          >
            <X size={20} />
          </button>
        </div>
        <nav className="mt-8 space-y-2">
          {nav.filter((item) => !item.admin || user?.role === 'admin').map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
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
        </nav>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-72">
        {/* Navigation Header */}
        <header className="sticky top-0 z-10 flex min-h-20 items-center justify-between gap-4 border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80 md:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button 
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden text-slate-500"
            >
              <Menu size={20} />
            </button>
            <div className="relative hidden w-full max-w-xl sm:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-100/70 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:ring-blue-950/40"
                placeholder="Search files, folders, shared items..."
                type="search"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              className="hidden items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 sm:inline-flex"
              onClick={() => navigate('/files')}
            >
              <Plus size={16} />
              <span>Create</span>
            </button>
            <button
              className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              title="Notifications"
            >
              <Bell size={18} />
            </button>
            <button
              className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              onClick={() => setDark((value) => !value)}
              title="Toggle theme"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex">
              <UserCircle size={28} className="text-blue-600 dark:text-blue-300" />
              <div className="max-w-28">
                <p className="truncate text-sm font-black text-slate-900 dark:text-white">{user?.name}</p>
                <p className="text-[10px] font-bold uppercase text-slate-400">{user?.role}</p>
              </div>
              <ChevronDown size={16} className="text-slate-400" />
            </div>
            <button
              className="rounded-2xl bg-slate-950 px-3 py-3 text-xs font-bold text-white shadow-md shadow-slate-900/10 transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200 sm:px-4"
              onClick={onLogout}
            >
              <span className="inline-flex items-center gap-2">
                <LogOut size={14} /> 
                <span>Logout</span>
              </span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 animate-fade-in-up">
          <Outlet />
        </main>
        <AppFooter dark={dark} />
      </div>
    </div>
  );
}
