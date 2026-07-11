import { Database, FileText, HardDrive, Users, Clock, ArrowUpRight, Share2, Download, Trash2, FolderPlus, LogIn, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import MetricCard from '../components/MetricCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api, formatBytes } from '../lib/api.js';

export default function Dashboard() {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState(null);
  const [userActivity, setUserActivity] = useState([]);

  useEffect(() => {
    api.get('/files').then(({ data }) => setFiles(data.files));
    
    if (user?.role === 'admin') {
      api.get('/admin/stats').then(({ data }) => {
        setStats(data);
        setUserActivity(data.recentActivity || []);
      });
    } else {
      api.get('/auth/activity').then(({ data }) => {
        setUserActivity(data.logs || []);
      });
    }
  }, [user]);

  const userStorage = files.reduce((total, file) => total + (file.isFolder ? 0 : file.size), 0);

  // Get visually premium color badges for actions
  function getActionBadge(action) {
    const act = action.toUpperCase();
    if (act.includes('UPLOAD')) {
      return {
        label: 'Upload',
        color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-450 border-emerald-250/20',
        icon: ArrowUpRight
      };
    }
    if (act.includes('DOWNLOAD')) {
      return {
        label: 'Download',
        color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-450 border-blue-250/20',
        icon: Download
      };
    }
    if (act.includes('DELETE')) {
      return {
        label: 'Delete',
        color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-450 border-rose-250/20',
        icon: Trash2
      };
    }
    if (act.includes('FOLDER')) {
      return {
        label: 'Folder',
        color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-450 border-amber-250/20',
        icon: FolderPlus
      };
    }
    if (act.includes('SHARE')) {
      return {
        label: 'Share',
        color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-450 border-purple-250/20',
        icon: Share2
      };
    }
    if (act.includes('LOGIN')) {
      return {
        label: 'Login',
        color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-450 border-indigo-250/20',
        icon: LogIn
      };
    }
    if (act.includes('REGISTER')) {
      return {
        label: 'Register',
        color: 'bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-450 border-teal-250/20',
        icon: UserPlus
      };
    }
    return {
      label: 'System',
      color: 'bg-slate-50 text-slate-700 dark:bg-slate-950/30 dark:text-slate-450 border-slate-250/20',
      icon: Clock
    };
  }

  return (
    <div className="space-y-8">
      
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Overview</h2>
          <p className="text-sm text-slate-500 dark:text-slate-450 mt-1">Welcome to your secure file vault, {user?.name}.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="hover-card-trigger">
          <MetricCard label="Total Files" value={files.filter((file) => !file.isFolder).length} icon={FileText} accent="text-cyan-600 dark:text-cyan-400" />
        </div>
        <div className="hover-card-trigger">
          <MetricCard label="Used Storage" value={formatBytes(userStorage)} icon={HardDrive} accent="text-emerald-600 dark:text-emerald-450" />
        </div>
        <div className="hover-card-trigger">
          <MetricCard label="Created Folders" value={files.filter((file) => file.isFolder).length} icon={Database} accent="text-amber-600 dark:text-amber-450" />
        </div>
        <div className="hover-card-trigger">
          <MetricCard label="Role Assignment" value={user?.role?.toUpperCase() || '-'} icon={Users} accent="text-indigo-600 dark:text-indigo-450" />
        </div>
      </div>

      {/* Main Grid: Left is Activity Log, Right is storage information */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Activity Logs */}
        <section className="rounded-2xl border border-slate-100 bg-white p-6 dark:border-slate-850 dark:bg-slate-900/60 md:col-span-2 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="text-cyan-500 stroke-[2.2]" size={18} />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Recent Activity</h3>
          </div>
          
          <div className="space-y-3.5">
            {userActivity.length ? (
              userActivity.map((item) => {
                const badge = getActionBadge(item.action);
                const IconComponent = badge.icon;
                return (
                  <div 
                    key={item._id} 
                    className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Action Icon Badge */}
                      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border ${badge.color} shrink-0`}>
                        <IconComponent size={14} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {item.actor?.name || 'You'}{' '}
                          <span className="font-normal text-slate-500 dark:text-slate-400">
                            {item.action.toLowerCase().replaceAll('_', ' ').replace('user ', '').replace('file ', '')}
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          {item.metadata?.name ? `File: ${item.metadata.name}` : `IP: ${item.ipAddress || '127.0.0.1'}`}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-medium text-slate-450 dark:text-slate-500 whitespace-nowrap ml-4">
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">No activity logged yet.</p>
            )}
          </div>
        </section>

        {/* Storage status visualizer */}
        <section className="rounded-2xl border border-slate-100 bg-white p-6 dark:border-slate-850 dark:bg-slate-900/60 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-5">Storage Usage</h3>
            
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-2xl font-extrabold text-cyan-600 dark:text-cyan-400 tracking-tight">{formatBytes(userStorage)}</span>
              <span className="text-xs text-slate-500 dark:text-slate-450 font-medium">Used of 5 GB</span>
            </div>
            
            {/* Storage Progress Bar */}
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-6">
              <div 
                className="h-full rounded-full bg-cyan-500 dark:bg-cyan-400 transition-all duration-300"
                style={{ width: `${Math.min(100, (userStorage / (5 * 1024 * 1024 * 1024)) * 100)}%` }}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2 dark:border-slate-800">
                <span className="text-slate-450">Images</span>
                <span className="font-bold text-slate-750 dark:text-slate-350">{files.filter(f => f.mimeType?.startsWith('image/')).length} files</span>
              </div>
              <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2 dark:border-slate-800">
                <span className="text-slate-450">Documents</span>
                <span className="font-bold text-slate-750 dark:text-slate-350">{files.filter(f => f.mimeType?.includes('pdf') || f.mimeType?.includes('text')).length} files</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-450">Media</span>
                <span className="font-bold text-slate-750 dark:text-slate-350">{files.filter(f => f.mimeType?.startsWith('video/') || f.mimeType?.startsWith('audio/')).length} files</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <span className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 flex items-center justify-center gap-1.5 hover:underline cursor-pointer">
              <span>View storage allocation details</span>
              <ArrowUpRight size={12} />
            </span>
          </div>
        </section>

      </div>
    </div>
  );
}
