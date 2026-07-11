import { Cloud, Download, AlertCircle, FileText, Server, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import AppFooter from '../components/AppFooter.jsx';
import { api, formatBytes } from '../lib/api.js';

export default function ShareLink() {
  const { token } = useParams();
  const [share, setShare] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/share/link/${token}`)
      .then(({ data }) => {
        setShare(data.share);
      })
      .catch((requestError) => {
        setError(requestError.response?.data?.message || 'This share link has expired or is invalid.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  function download() {
    window.location.href = `${api.defaults.baseURL}/share/link/${token}/download`;
  }

  return (
    <main className="relative flex min-h-screen flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Background decoration elements */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-cyan-600/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[120px]" />

      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-10">
      <section className="relative w-full max-w-lg rounded-2xl p-[1px] bg-gradient-to-r from-cyan-500 via-sky-600 to-indigo-500 shadow-2xl animate-fade-in-up">
        <div className="relative w-full rounded-2xl bg-slate-900/90 p-8 text-center backdrop-blur-md">
          
          {/* Logo animation area */}
          <div className="mx-auto relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-[1.5px] shadow-lg shadow-cyan-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950">
              <svg className="h-9 w-9 text-cyan-400 animate-float" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" stroke="currentColor" strokeOpacity="0.4" />
                <polyline points="12 12 12 2" stroke="url(#share-logo-grad)" />
                <polyline points="9 5 12 2 15 5" stroke="url(#share-logo-grad)" />
                <defs>
                  <linearGradient id="share-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="absolute inset-0 rounded-2xl border border-cyan-400/30 animate-ping opacity-25" style={{ animationDuration: '3.5s' }} />
          </div>

          <h2 className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent mb-1">UpStack Secure Share</h2>
          <p className="text-xs text-slate-400 mb-6">Cloud-Based Encrypted File Transfer</p>

          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-3">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
              <p className="text-xs font-semibold text-slate-500">Decrypting file manifest...</p>
            </div>
          ) : error ? (
            <div className="py-4 animate-fade-in-up">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-950/45 text-red-400 border border-red-500/20 mb-4 animate-pulse">
                <AlertCircle size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-200">Share Link Unavailable</h3>
              <p className="mt-2 text-sm text-slate-400 max-w-sm mx-auto">{error}</p>
            </div>
          ) : share ? (
            <div className="py-4 animate-fade-in-up space-y-6">
              {/* File Info Box */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5 flex items-center gap-4 text-left border-l-2 border-l-cyan-500">
                <div className="rounded-lg bg-slate-900 p-3 text-cyan-400 border border-slate-800 shadow-sm shrink-0">
                  <FileText size={24} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-white truncate max-w-[240px]" title={share.file?.originalName}>
                    {share.file?.originalName}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 font-semibold">{formatBytes(share.file?.size)}</p>
                </div>
              </div>

              {/* Ownership Card details */}
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-400 mt-4">
                <div className="rounded-lg bg-slate-950/40 p-3 border border-slate-800 flex flex-col items-center">
                  <Server size={14} className="text-cyan-400 mb-1" />
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Sender</span>
                  <span className="font-bold text-white mt-0.5 truncate max-w-[120px]">{share.owner?.name}</span>
                </div>
                <div className="rounded-lg bg-slate-950/40 p-3 border border-slate-800 flex flex-col items-center">
                  <Clock size={14} className="text-indigo-400 mb-1" />
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Expiry</span>
                  <span className="font-bold text-white mt-0.5">
                    {share.expiresAt ? new Date(share.expiresAt).toLocaleDateString() : 'Never'}
                  </span>
                </div>
              </div>

              {/* Action Trigger */}
              <button 
                onClick={download} 
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 py-3 font-semibold text-white shadow-lg shadow-cyan-500/10 hover:from-cyan-400 hover:to-indigo-500 transition duration-150"
              >
                <Download size={16} /> 
                <span>Download Secure File</span>
              </button>
            </div>
          ) : null}

        </div>
      </section>
      </div>
      <div className="relative z-10">
        <AppFooter dark />
      </div>
    </main>
  );
}
