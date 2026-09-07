import { CheckCircle2, Loader2, Share2, X } from 'lucide-react';
import { useState } from 'react';
import { formatBytes } from '../lib/api.js';

export default function ShareModal({ file, onClose, onShare, busy }) {
  const [email, setEmail] = useState('');

  if (!file) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (!email || !email.trim()) return;
    onShare(email.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={busy ? undefined : onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-fade-in-up">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Share File</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate max-w-[280px]">
              {file.originalName} ({formatBytes(file.size)})
            </p>
          </div>
          {!busy && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Recipient Email
            </label>
            <input
              type="email"
              required
              disabled={busy}
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-950/50"
            />
          </div>

          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Permission Granted
            </span>
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-3 text-xs font-semibold text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-300">
              <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Download access (Recipient can view details and download this file)</span>
            </div>
          </div>

          <div className="mt-6 flex gap-3 pt-2">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !email.trim()}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {busy ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Sharing...</span>
                </>
              ) : (
                <>
                  <Share2 size={15} />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
