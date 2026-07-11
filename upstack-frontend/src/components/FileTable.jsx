import { Download, File, Folder, Link, Share2, Trash2, FileText, Image as ImageIcon, Video, Music, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, downloadUrl, formatBytes } from '../lib/api.js';

export default function FileTable({ files, onChanged, onFolderClick }) {
  async function remove(file) {
    if (!window.confirm(`Are you sure you want to delete "${file.originalName}"?`)) return;
    try {
      await api.delete(`/files/${file._id}`);
      toast.success('File deleted successfully');
      onChanged?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  }

  async function share(file) {
    try {
      const expiration = window.prompt('Enter expiration days (leave blank for none):');
      let expiresAt = null;
      if (expiration) {
        const days = parseInt(expiration, 10);
        if (!isNaN(days)) {
          const date = new Date();
          date.setDate(date.getDate() + days);
          expiresAt = date.toISOString();
        }
      }
      
      const { data } = await api.post(`/share/${file._id}/link`, { 
        permission: 'download',
        expiresAt
      });
      await navigator.clipboard.writeText(data.url);
      toast.success('Secure download link copied to clipboard!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not create share link');
    }
  }

  async function shareWithUser(file) {
    const email = window.prompt('Enter the recipient\'s email:');
    if (!email || email.trim().length === 0) return;

    const permission = window.confirm('Allow recipient to download? (Cancel = View only)') ? 'download' : 'view';

    try {
      await api.post(`/share/${file._id}/user`, { email, permission });
      toast.success(`Shared successfully with ${email}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Share failed');
    }
  }

  function download(file) {
    const token = localStorage.getItem('token');
    toast.promise(
      fetch(downloadUrl(file._id), { headers: { Authorization: `Bearer ${token}` } })
        .then((response) => {
          if (!response.ok) throw new Error('Download failed');
          return response.blob();
        })
        .then((blob) => {
          const href = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = href;
          anchor.download = file.originalName;
          anchor.click();
          URL.revokeObjectURL(href);
        }),
      {
        loading: `Preparing download for ${file.originalName}...`,
        success: 'Download started!',
        error: 'Could not decrypt file for download.'
      }
    );
  }

  // Get File type specific icon and color class
  function getFileIcon(file) {
    if (file.isFolder) {
      return <Folder size={20} className="text-amber-500 fill-amber-500/20" />;
    }
    const mime = file.mimeType.toLowerCase();
    if (mime.startsWith('image/')) {
      return <ImageIcon size={19} className="text-emerald-500" />;
    }
    if (mime.startsWith('video/')) {
      return <Video size={19} className="text-rose-500" />;
    }
    if (mime.startsWith('audio/')) {
      return <Music size={19} className="text-purple-500" />;
    }
    if (mime.includes('pdf')) {
      return <FileText size={19} className="text-red-500" />;
    }
    if (mime.includes('text/') || mime.includes('json') || mime.includes('javascript')) {
      return <FileText size={19} className="text-blue-500" />;
    }
    return <File size={19} className="text-cyan-600" />;
  }

  if (!files.length) {
    return (
      <div className="rounded-2xl border border-slate-150/80 bg-white p-16 text-center text-slate-500 dark:border-slate-850 dark:bg-slate-900/60 dark:text-slate-400">
        <Folder size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4 stroke-[1.5]" />
        <p className="font-semibold text-base">This folder is empty</p>
        <p className="text-xs text-slate-450 mt-1">Drag and drop files to upload and get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white dark:border-slate-850 dark:bg-slate-900/60 shadow-sm">
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
            {files.map((file) => (
              <tr 
                key={file._id} 
                className="hover:bg-slate-50/70 dark:hover:bg-slate-800/25 transition duration-150 group"
              >
                {/* File/Folder Name */}
                <td className="px-6 py-4">
                  {file.isFolder ? (
                    <button
                      onClick={() => onFolderClick?.(file)}
                      className="flex items-center gap-3 font-semibold text-slate-800 dark:text-slate-200 hover:text-cyan-600 dark:hover:text-cyan-400 text-left focus:outline-none transition group-hover:translate-x-0.5"
                    >
                      {getFileIcon(file)}
                      <span className="truncate max-w-[200px] sm:max-w-[320px]">{file.originalName}</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 font-semibold text-slate-700 dark:text-slate-350">
                      {getFileIcon(file)}
                      <span className="truncate max-w-[200px] sm:max-w-[320px]">{file.originalName}</span>
                    </div>
                  )}
                </td>
                
                {/* File MimeType */}
                <td className="px-6 py-4 text-slate-500 dark:text-slate-450 hidden sm:table-cell">
                  {file.isFolder ? (
                    <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/30 dark:text-amber-450">Folder</span>
                  ) : (
                    <span className="text-xs font-medium uppercase truncate max-w-[120px] block">{file.mimeType.split('/')[1] || 'binary'}</span>
                  )}
                </td>

                {/* File Size */}
                <td className="px-6 py-4 text-slate-650 dark:text-slate-350 font-medium">
                  {file.isFolder ? '-' : formatBytes(file.size)}
                </td>

                {/* Upload Date */}
                <td className="px-6 py-4 text-slate-455 dark:text-slate-450 hidden md:table-cell text-xs">
                  {new Date(file.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </td>

                {/* Action Buttons */}
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-1">
                    {!file.isFolder && (
                      <>
                        <button 
                          className="rounded-lg p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 dark:hover:text-cyan-400 transition" 
                          onClick={() => download(file)} 
                          title="Download File"
                        >
                          <Download size={15} />
                        </button>
                        <button 
                          className="rounded-lg p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 dark:hover:text-cyan-400 transition" 
                          onClick={() => share(file)} 
                          title="Copy Share Link"
                        >
                          <Link size={15} />
                        </button>
                        <button 
                          className="rounded-lg p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 dark:hover:text-cyan-400 transition" 
                          onClick={() => shareWithUser(file)} 
                          title="Share with User"
                        >
                          <Share2 size={15} />
                        </button>
                      </>
                    )}
                    <button 
                      className="rounded-lg p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition" 
                      onClick={() => remove(file)} 
                      title="Delete Item"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
