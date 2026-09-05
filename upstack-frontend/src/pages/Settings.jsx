import { User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { formatBytes } from '../lib/api.js';

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">

      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Workspace Settings</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
          Manage account information and check your storage quota.
        </p>
      </div>

      {/* Account Info */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
            <User size={18} />
          </span>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Profile Details</h3>
        </div>

        <dl className="space-y-3 text-sm">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-950/50">
            <dt className="font-semibold text-slate-500 dark:text-slate-400">Account Holder</dt>
            <dd className="font-bold text-slate-800 dark:text-slate-200">{user?.name}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-950/50">
            <dt className="font-semibold text-slate-500 dark:text-slate-400">Registered Email</dt>
            <dd className="truncate font-medium text-slate-700 dark:text-slate-300">{user?.email}</dd>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-950/50">
            <dt className="font-semibold text-slate-500 dark:text-slate-400">Workspace Access Role</dt>
            <dd className="rounded-full bg-cyan-50 dark:bg-cyan-950/30 px-2.5 py-0.5 text-xs font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider">
              {user?.role}
            </dd>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-950/50">
            <dt className="font-semibold text-slate-500 dark:text-slate-400">Private Quota Used</dt>
            <dd className="font-bold text-slate-800 dark:text-slate-200">{formatBytes(user?.storageUsed || 0)}</dd>
          </div>
        </dl>
      </section>

      {/* Security Infrastructure section removed per requirements */}

    </div>
  );
}
