import { Download, File, Folder, Share2, Trash2, FileText, Image as ImageIcon, Video, Music, Loader2, CheckCircle2, X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { api, downloadUrl, formatBytes } from '../lib/api.js';

// ─── Share Modal (Download-only permission) ──────────────────────────────────
function ShareModal({ file, onClose, onShare, busy }) {
  const [email, setEmail] = useState('');

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
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-cyan-950/50"
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
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 py-2.5 text-sm font-bold text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
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

export default function FileTable({ files, onChanged, onFolderClick }) {
  const [deletingId, setDeletingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [sharingId, setSharingId] = useState(null);
  const [shareModalFile, setShareModalFile] = useState(null);

  async function remove(file) {
    if (deletingId) return;
    const isFolder = file.isFolder;
    const promptMsg = isFolder
      ? `Are you sure you want to delete the folder "${file.originalName}"?`
      : `Are you sure you want to delete "${file.originalName}"?`;
    if (!window.confirm(promptMsg)) return;

    setDeletingId(file._id);
    try {
      await api.delete(`/files/${file._id}`);
      toast.success(isFolder ? 'Folder deleted successfully' : 'File deleted successfully');
      onChanged?.();
    } catch (error) {
      toast.error(error.response?.data?.message || `${isFolder ? 'Folder' : 'File'} delete failed`);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleShareSubmit(email) {
    if (!shareModalFile || sharingId) return;

    setSharingId(shareModalFile._id);
    try {
      await api.post(`/share/${shareModalFile._id}/user`, {
        email: email.trim(),
        permission: 'download'
      });
      toast.success(`Shared successfully with ${email}`);
      setShareModalFile(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Share failed');
    } finally {
      setSharingId(null);
    }
  }

  async function download(file) {
    if (downloadingId) return;
    setDownloadingId(file._id);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(downloadUrl(file._id), {
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
      anchor.download = file.originalName;
      anchor.click();
      URL.revokeObjectURL(href);
      toast.success('Download complete!');
    } catch (error) {
      toast.error(error.message || 'Could not download file.');
    } finally {
      setDownloadingId(null);
    }
  }

  function getFileIcon(file) {
    if (file.isFolder) return <Folder size={20} className="text-amber-500 fill-amber-500/20" />;
    const mime = file.mimeType.toLowerCase();
    if (mime.startsWith('image/'))  return <ImageIcon size={19} className="text-emerald-500" />;
    if (mime.startsWith('video/'))  return <Video size={19} className="text-rose-500" />;
    if (mime.startsWith('audio/'))  return <Music size={19} className="text-purple-500" />;
    if (mime.includes('pdf'))       return <FileText size={19} className="text-red-500" />;
    if (mime.includes('text/') || mime.includes('json') || mime.includes('javascript'))
      return <FileText size={19} className="text-blue-500" />;
    return <File size={19} className="text-cyan-600" />;
  }

  if (!files.length) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-16 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
        <Folder size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4 stroke-[1.5]" />
        <p className="font-semibold text-base">This folder is empty</p>
        <p className="text-xs text-slate-400 mt-1">Drag and drop files above to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900/60 shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-sm dark:divide-slate-800">
          <thead className="bg-slate-50/40 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-950 dark:text-slate-400">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4 hidden sm:table-cell">Type</th>
              <th className="px-6 py-4">Size</th>
              <th className="px-6 py-4 hidden md:table-cell">Uploaded</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-transparent">
            {files.map((file) => {
              const isDeleting = deletingId === file._id;
              return (
                <tr
                  key={file._id}
                  className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/25 transition duration-150 group ${
                    isDeleting ? 'opacity-60 bg-rose-50/20 dark:bg-rose-950/10' : ''
                  }`}
                >
                  {/* File/Folder Name */}
                  <td className="px-6 py-4">
                    {file.isFolder ? (
                      <button
                        disabled={isDeleting}
                        onClick={() => onFolderClick?.(file)}
                        className={`flex items-center gap-3 font-semibold text-slate-800 dark:text-slate-200 hover:text-cyan-600 dark:hover:text-cyan-400 text-left focus:outline-none focus:ring-2 focus:ring-cyan-300 rounded transition ${
                          isDeleting ? 'pointer-events-none opacity-50' : ''
                        }`}
                      >
                        {getFileIcon(file)}
                        <span className="truncate max-w-[200px] sm:max-w-[320px]">{file.originalName}</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-3 font-semibold text-slate-700 dark:text-slate-300">
                        {getFileIcon(file)}
                        <span className="truncate max-w-[200px] sm:max-w-[320px]">{file.originalName}</span>
                      </div>
                    )}
                  </td>

                {/* File MimeType */}
                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                  {file.isFolder ? (
                    <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">Folder</span>
                  ) : (
                    <span className="text-xs font-medium uppercase truncate max-w-[120px] block">{file.mimeType.split('/')[1] || 'binary'}</span>
                  )}
                </td>

                {/* File Size */}
                <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">
                  {file.isFolder ? '—' : formatBytes(file.size)}
                </td>

                {/* Upload Date */}
                <td className="px-6 py-4 text-slate-400 dark:text-slate-500 hidden md:table-cell text-xs">
                  {new Date(file.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </td>

                {/* Action Buttons */}
                <td className="px-6 py-4">
                  <div className="flex justify-end items-center gap-1 min-h-[36px]">
                    {isDeleting ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 animate-fade-in-up">
                        <Loader2 size={13} className="animate-spin" />
                        <span>Deleting...</span>
                      </span>
                    ) : (
                      <>
                        {!file.isFolder && (
                          <>
                            <button
                              disabled={downloadingId === file._id || deletingId !== null || sharingId === file._id}
                              className="rounded-lg p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 dark:hover:text-cyan-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => download(file)}
                              title="Download file"
                              aria-label={`Download ${file.originalName}`}
                            >
                              {downloadingId === file._id ? (
                                <Loader2 size={15} className="animate-spin text-cyan-500" />
                              ) : (
                                <Download size={15} />
                              )}
                            </button>
                            {/* Copy Share Link button removed per requirements */}
                            <button
                              disabled={sharingId === file._id || deletingId !== null || downloadingId === file._id}
                              className="rounded-lg p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 dark:hover:text-cyan-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => setShareModalFile(file)}
                              title="Share with user"
                              aria-label={`Share ${file.originalName} with a user`}
                            >
                              {sharingId === file._id ? (
                                <Loader2 size={15} className="animate-spin text-purple-500" />
                              ) : (
                                <Share2 size={15} />
                              )}
                            </button>
                          </>
                        )}
                        <button
                          disabled={deletingId !== null || downloadingId === file._id || sharingId === file._id}
                          className="rounded-lg p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => remove(file)}
                          title={file.isFolder ? 'Delete folder' : 'Delete file'}
                          aria-label={`Delete ${file.originalName}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          </tbody>
        </table>
      </div>

      {/* Share Modal Dialog */}
      {shareModalFile && (
        <ShareModal
          file={shareModalFile}
          onClose={() => setShareModalFile(null)}
          onShare={handleShareSubmit}
          busy={sharingId === shareModalFile._id}
        />
      )}
    </div>
  );
}
