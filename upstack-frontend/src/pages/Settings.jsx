import { HardDrive, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api, formatBytes } from '../lib/api.js';

export default function Settings() {
  const { user } = useAuth();
  const [files, setFiles] = useState(null);

  // Workspace Settings and User Console are only for Basic Users. Admins are redirected to Admin Console.
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  // Load files dynamically to calculate actual storage from user's active files
  useEffect(() => {
    let isMounted = true;
    async function loadFiles() {
      try {
        const res = await api.get('/files');
        if (isMounted) {
          setFiles(res.data.files || []);
        }
      } catch {
        // silently ignore, fallback to user.storageUsed
      }
    }

    loadFiles();
    const handleRefresh = () => loadFiles();
    window.addEventListener('upstack:refresh-files', handleRefresh);
    return () => {
      isMounted = false;
      window.removeEventListener('upstack:refresh-files', handleRefresh);
    };
  }, []);

  const USER_STORAGE_LIMIT = 200 * 1024 * 1024; // 200 MB
  const usedStorage = files !== null
    ? files.reduce((acc, f) => acc + (f.isFolder ? 0 : (f.size || 0)), 0)
    : (user?.storageUsed || 0);

  const storagePercentage = Math.min(100, Math.max(2, (usedStorage / USER_STORAGE_LIMIT) * 100));

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-[26px] font-bold tracking-tight text-slate-900 dark:text-white truncate">
          UpStack User Console - {user?.name || 'User'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
          Manage your workspace settings and storage quota.
        </p>
      </div>

      {/* Two Parallel Boxes: Left = Workspace Settings, Right = Total Used Storage */}
      <div className="grid gap-6 md:grid-cols-2 items-stretch">
        
        {/* Left Side: Workspace Settings */}
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 flex flex-col justify-between transition-all duration-300">
          <div>
            <div className="mb-6 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300 border border-slate-100/50 dark:border-slate-800">
                <User size={18} />
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Workspace Settings</h3>
            </div>

            <dl className="grid gap-3 sm:grid-cols-2 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-950/50">
                <dt className="font-semibold text-slate-500 dark:text-slate-400 text-xs">Account Holder</dt>
                <dd className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate max-w-[120px]">{user?.name}</dd>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-950/50">
                <dt className="font-semibold text-slate-500 dark:text-slate-400 text-xs">Registered Email</dt>
                <dd className="truncate font-medium text-slate-700 dark:text-slate-300 text-xs max-w-[140px]" title={user?.email}>{user?.email}</dd>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-950/50">
                <dt className="font-semibold text-slate-500 dark:text-slate-400 text-xs">Access Role</dt>
                <dd className="rounded-full bg-blue-50 dark:bg-blue-950/30 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                  {user?.role === 'admin' ? 'Admin' : 'Basic User'}
                </dd>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-950/50">
                <dt className="font-semibold text-slate-500 dark:text-slate-400 text-xs">Private Quota Used</dt>
                <dd className="font-bold text-slate-800 dark:text-slate-200 text-xs">{formatBytes(usedStorage)}</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Right Side: Total Used Storage */}
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-850 dark:bg-slate-900/60 flex flex-col justify-between transition-all duration-300">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">
                  Total Used Storage
                </p>
                <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {formatBytes(usedStorage)}
                </p>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-slate-50 dark:bg-slate-950/80 text-blue-600 dark:text-blue-400 border border-slate-100/50 dark:border-slate-800">
                <HardDrive size={22} strokeWidth={1.8} />
              </div>
            </div>

            <div className="mt-4">
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${storagePercentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span>{formatBytes(usedStorage)} / 200 MB</span>
                <span>{((usedStorage / USER_STORAGE_LIMIT) * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Storage limit: <span className="font-semibold text-slate-700 dark:text-slate-300">200 MB per account</span>.
              Uploads exceeding remaining storage will be prevented.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
