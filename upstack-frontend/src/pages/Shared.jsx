import { Download, Share2, File, User, Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api, formatBytes } from '../lib/api.js';

export default function Shared() {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadShares() {
    setLoading(true);
    try {
      const { data } = await api.get('/share/me');
      setShares(data.shares || []);
    } catch (error) {
      toast.error('Failed to load shared documents');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadShares();
  }, []);

  function download(share) {
    const token = localStorage.getItem('token');
    const fileName = share.file?.originalName || 'downloaded-file';
    
    toast.promise(
      fetch(`${api.defaults.baseURL}/share/me/${share._id}/download`, { headers: { Authorization: `Bearer ${token}` } })
        .then((response) => {
          if (!response.ok) throw new Error('Download failed');
          return response.blob();
        })
        .then((blob) => {
          const href = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = href;
          anchor.download = fileName;
          anchor.click();
          URL.revokeObjectURL(href);
        }),
      {
        loading: `Decrypting and downloading ${fileName}...`,
        success: 'Download complete!',
        error: 'Insufficient download permissions for this item.'
      }
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Shared With Me</h2>
        <p className="text-sm text-slate-500 dark:text-slate-455 mt-1 font-medium">View and download files shared directly with your account by other members.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-20 dark:border-slate-800 dark:bg-slate-900 shadow-sm gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-cyan-500 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading incoming shares...</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shares.map((share) => (
            <article 
              key={share._id} 
              className="group relative rounded-2xl border border-slate-100 bg-white p-6 dark:border-slate-850 dark:bg-slate-900/60 shadow-sm hover:shadow-md hover:scale-[1.01] hover:-translate-y-0.5 transition-all duration-300"
            >
              {/* Top part */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="rounded-lg bg-cyan-50 dark:bg-cyan-950/40 p-2 text-cyan-600 dark:text-cyan-400">
                    <File size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition" title={share.file?.originalName}>
                      {share.file?.originalName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {formatBytes(share.file?.size)}
                    </p>
                  </div>
                </div>
                <Share2 size={16} className="text-slate-400 dark:text-slate-600" />
              </div>

              {/* Owner and Permission badges */}
              <div className="mt-6 flex flex-col gap-2.5">
                {/* Shared By */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-450 font-medium">
                  <User size={13} className="text-slate-400" />
                  <span>Shared by:</span>
                  <span className="font-semibold text-slate-750 dark:text-slate-300 truncate max-w-[140px]">{share.owner?.name || 'System'}</span>
                </div>
                
                {/* Access */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-450 font-medium">
                  <Lock size={13} className="text-slate-400" />
                  <span>Access:</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    share.permission === 'download' || share.permission === 'edit'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-450'
                  }`}>
                    {share.permission}
                  </span>
                </div>
              </div>

              {/* Download Button */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-850 flex justify-end">
                <button 
                  onClick={() => download(share)} 
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 hover:bg-slate-850 dark:bg-slate-100 dark:hover:bg-slate-200 px-4 py-2 text-xs font-bold text-white dark:text-slate-950 shadow-md transition duration-150"
                >
                  <Download size={13} /> 
                  <span>Download</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {!shares.length && !loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-16 text-center text-slate-500 dark:border-slate-850 dark:bg-slate-900/60 dark:text-slate-400 shadow-sm">
          <Share2 className="mx-auto text-slate-300 dark:text-slate-700 mb-4 stroke-[1.5]" size={48} />
          <p className="font-semibold text-base">No shared documents found</p>
          <p className="text-xs text-slate-450 mt-1">When users share files directly with your email, they will appear here.</p>
        </div>
      )}
    </div>
  );
}
