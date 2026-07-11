import { Activity, FileText, HardDrive, ShieldCheck, Users, ToggleLeft, ToggleRight, Trash2, ArrowUpRight, Clock, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import MetricCard from '../components/MetricCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api, formatBytes } from '../lib/api.js';

export default function Admin() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [statsResponse, usersResponse, activityResponse] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/activity')
      ]);
      setStats(statsResponse.data);
      setUsers(usersResponse.data.users);
      setLogs(activityResponse.data.logs);
    } catch (error) {
      toast.error('Failed to load administrator data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.role === 'admin') load();
  }, [user]);

  async function updateUser(target, patch) {
    try {
      await api.patch(`/admin/users/${target._id}`, patch);
      toast.success(`User "${target.name}" status updated`);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    }
  }

  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-red-200/40 bg-red-50/20 p-16 text-center text-red-700 dark:border-red-950/40 dark:bg-red-950/20 dark:text-red-400">
        <AlertTriangle size={48} className="text-red-500 mb-4 stroke-[1.5] animate-bounce" />
        <h3 className="text-lg font-bold">Access Denied</h3>
        <p className="text-sm text-red-500/80 dark:text-red-400/80 mt-1 max-w-md">Administrator privileges are required to view the management panel.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Admin Console</h2>
        <p className="text-sm text-slate-500 dark:text-slate-455 mt-1 font-medium">Monitor system-wide cloud utilization, control memberships, and audit secure activity logs.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="hover-card-trigger">
          <MetricCard label="Registered Users" value={stats?.users ?? '-'} icon={Users} accent="text-cyan-600 dark:text-cyan-400" />
        </div>
        <div className="hover-card-trigger">
          <MetricCard label="Cloud Files" value={stats?.files ?? '-'} icon={FileText} accent="text-emerald-600 dark:text-emerald-450" />
        </div>
        <div className="hover-card-trigger">
          <MetricCard label="Total Storage" value={formatBytes(stats?.storageUsed || 0)} icon={HardDrive} accent="text-amber-600 dark:text-amber-450" />
        </div>
        <div className="hover-card-trigger">
          <MetricCard label="Security Framework" value="AES-256 / RBAC" icon={ShieldCheck} accent="text-fuchsia-600 dark:text-fuchsia-450" />
        </div>
      </div>

      {/* Grid: Left is user list, Right is audit logs */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* User Management */}
        <section className="rounded-2xl border border-slate-100 bg-white p-6 dark:border-slate-850 dark:bg-slate-900/60 lg:col-span-2 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-white text-base mb-6">User Accounts</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 dark:border-slate-850">
                <tr>
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((target) => (
                  <tr key={target._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition">
                    {/* Name */}
                    <td className="py-3.5 font-semibold text-slate-800 dark:text-slate-200">{target.name}</td>
                    
                    {/* Email */}
                    <td className="py-3.5 text-slate-550 dark:text-slate-400">{target.email}</td>
                    
                    {/* Role badge */}
                    <td className="py-3.5">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        target.role === 'admin' 
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400' 
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-450'
                      }`}>
                        {target.role}
                      </span>
                    </td>
                    
                    {/* Status badge */}
                    <td className="py-3.5">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        target.isActive 
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450' 
                          : 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                      }`}>
                        {target.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 text-right space-x-1">
                      <button 
                        title="Toggle role (Admin/User)"
                        className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 dark:text-cyan-400 dark:hover:text-cyan-300 dark:hover:bg-cyan-950/40 transition" 
                        onClick={() => updateUser(target, { role: target.role === 'admin' ? 'user' : 'admin', isActive: target.isActive })}
                      >
                        Role
                      </button>
                      <button 
                        title={target.isActive ? 'Suspend account' : 'Reactivate account'}
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                          target.isActive 
                            ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-950/40' 
                            : 'text-emerald-600 hover:text-emerald-750 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:text-emerald-350 dark:hover:bg-emerald-950/40'
                        }`}
                        onClick={() => updateUser(target, { role: target.role, isActive: !target.isActive })}
                      >
                        {target.isActive ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Activity Auditing Logs */}
        <section className="rounded-2xl border border-slate-100 bg-white p-6 dark:border-slate-850 dark:bg-slate-900/60 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="text-cyan-505" size={16} strokeWidth={2} />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Audit Trail</h3>
          </div>
          
          <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[400px] pr-1">
            {logs.map((log) => (
              <div 
                key={log._id} 
                className="flex flex-col border-b border-slate-100 pb-3 last:border-0 last:pb-0 dark:border-slate-800"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-bold text-slate-750 dark:text-slate-300 truncate max-w-[70%]" title={log.actor?.email || 'System'}>
                    {log.actor?.name || 'System'}
                  </p>
                  <span className="text-[10px] text-slate-450 dark:text-slate-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wide text-[10px]">
                    {log.action.replaceAll('_', ' ').replace('USER ', '').replace('FILE ', '')}
                  </span>
                  <span className="text-[10px] text-slate-400">{log.ipAddress || '127.0.0.1'}</span>
                </div>
              </div>
            ))}
            {!logs.length && (
              <p className="text-sm text-slate-400 py-6 text-center">No system operations audited.</p>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
