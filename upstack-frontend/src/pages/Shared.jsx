import { Download, Share2, File, User, Lock, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageLoader from '../components/PageLoader.jsx';
import { api, formatBytes } from '../lib/api.js';

export default function Shared() {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

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

  async function download(share) {
    if (downloadingId) return;
    if (share.permission !== 'download') {
      toast.error("You don't have permission to download this file.");
      return;
    }

    setDownloadingId(share._id);
    const token = localStorage.getItem('token');
    const fileName = share.file?.originalName || 'downloaded-file';
    
    try {
      const response = await fetch(`${api.defaults.baseURL}/share/me/${share._id}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        const message = errorJson.message || (response.status === 403
          ? "You don't have permission to download this file."
          : "Download failed. Please try again.");
        throw new Error(message);
      }

      const blob = await response.blob();
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = href;
      anchor.download = fileName;
      anchor.click();
      URL.revokeObjectURL(href);
      toast.success('Download complete!');
    } catch (error) {
      toast.error(error.message || 'Could not download file.');
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="space-y-8">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Shared With Me</h2>
        <p className="text-sm text-slate-500 dark:text-slate-455 mt-1 font-medium">View and download files shared directly with your account by other members.</p>
      </div>

      {loading ? (
        <PageLoader text="Loading incoming shares..." />
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
                    share.permission === 'download'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-450'
                  }`}>
                    {share.permission === 'download' ? 'Download' : 'No Access'}
                  </span>
                </div>
              </div>

              {/* Download Button or Legacy Message */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-850 flex justify-end">
                {share.permission === 'download' ? (
                  <button 
                    disabled={downloadingId === share._id}
                    onClick={() => download(share)} 
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 hover:bg-slate-850 dark:bg-slate-100 dark:hover:bg-slate-200 px-4 py-2 text-xs font-bold text-white dark:text-slate-950 shadow-md transition duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {downloadingId === share._id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Download size={13} />
                    )}
                    <span>{downloadingId === share._id ? 'Downloading...' : 'Download'}</span>
                  </button>
                ) : (
                  <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200/50 dark:border-amber-800/30 w-full text-left font-medium">
                    Download access is not available for this shared file. Ask the owner to reshare it with Download permission.
                  </p>
                )}
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
