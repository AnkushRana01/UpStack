import { KeyRound, Lock, Server, Shield, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { formatBytes } from '../lib/api.js';

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Workspace Settings</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage account information, check your storage quota, and review application security policies.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Account Info */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900/70">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
              <User size={18} />
            </span>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Profile Details</h3>
          </div>

          <dl className="space-y-4 text-sm">
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

        {/* Security Architecture */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900/70">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
              <Shield size={18} />
            </span>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Security Infrastructure</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Simple safeguards for storage, access, and sharing.</p>
            </div>
          </div>

          <div className="grid gap-3 text-sm">
            <div className="flex items-center gap-3.5 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/50">
              <span className="rounded-xl bg-white p-2 text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-300 shrink-0">
                <Lock size={18} />
              </span>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">AES-256-GCM Encryption</p>
                <p className="text-xs text-slate-500 mt-0.5">Files are encrypted in transit and at rest.</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/50">
              <span className="rounded-xl bg-white p-2 text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-300 shrink-0">
                <KeyRound size={18} />
              </span>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">JWT Token Security</p>
                <p className="text-xs text-slate-500 mt-0.5">API requests are guarded by token-based sessions.</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/50">
              <span className="rounded-xl bg-white p-2 text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-300 shrink-0">
                <Server size={18} />
              </span>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">S3-Ready Storage & Backups</p>
                <p className="text-xs text-slate-500 mt-0.5">Storage is structured for resilient cloud backups.</p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
