import {
  Database,
  Download,
  File,
  FileArchive,
  FileSpreadsheet,
  FileText,
  Folder,
  HardDrive,
  Image as ImageIcon,
  Loader2,
  MoreHorizontal,
  Share2
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import MetricCard from '../components/MetricCard.jsx';
import PageLoader from '../components/PageLoader.jsx';
import QuickUploadCard from '../components/QuickUploadCard.jsx';
import ShareModal from '../components/ShareModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api, downloadUrl, formatBytes } from '../lib/api.js';

function formatRelativeTime(dateString) {
  if (!dateString) return 'recently';
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? 'min' : 'mins'} ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
  const diffDays = Math.floor(diffHour / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

function getFileTypeDetails(file) {
  if (file.isFolder) {
    return {
      label: 'Folder',
      color: 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
      icon: Folder
    };
  }
  const ext = file.originalName?.split('.').pop()?.toUpperCase() || 'FILE';
  const mime = file.mimeType || '';

  if (mime.includes('pdf') || ext === 'PDF') {
    return {
      label: 'PDF',
      color: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400',
      icon: FileText
    };
  }
  if (mime.startsWith('image/') || ['PNG', 'JPG', 'JPEG', 'WEBP', 'SVG'].includes(ext)) {
    return {
      label: ext,
      color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
      icon: ImageIcon
    };
  }
  if (['ZIP', 'RAR', '7Z', 'TAR', 'GZ'].includes(ext) || mime.includes('zip') || mime.includes('tar')) {
    return {
      label: ext.toLowerCase() + '.zip',
      color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
      icon: FileArchive
    };
  }
  if (['XLS', 'XLSX', 'CSV'].includes(ext) || mime.includes('sheet') || mime.includes('excel')) {
    return {
      label: ext.toLowerCase(),
      color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
      icon: FileSpreadsheet
    };
  }
  return {
    label: ext,
    color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    icon: File
  };
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shareModalFile, setShareModalFile] = useState(null);
  const [sharing, setSharing] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const loadDashboardData = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const filesResponse = await api.get('/files');
      setFiles(filesResponse.data.files || []);
    } catch (_err) {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData(true);
    const handleRefresh = () => loadDashboardData(false);
    window.addEventListener('upstack:refresh-files', handleRefresh);
    return () => window.removeEventListener('upstack:refresh-files', handleRefresh);
  }, [loadDashboardData]);

  const userStorage = files.reduce((total, file) => total + (file.isFolder ? 0 : file.size), 0);

  // Filter and display recent files and folders (most recently created/uploaded)
  const recentItems = [...files]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);

  async function handleShareSubmit(email) {
    if (!shareModalFile || sharing) return;
    setSharing(true);
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
      setSharing(false);
    }
  }

  async function handleDownload(file) {
    if (downloadingId || file.isFolder) return;
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
          : 'Download failed. Please try again.');
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

  function renderOwnerName(item) {
    if (!item.owner) return 'You';
    const ownerId = typeof item.owner === 'object' ? item.owner._id : item.owner;
    if (ownerId && String(ownerId) === String(user?._id)) {
      return 'You';
    }
    return typeof item.owner === 'object' ? (item.owner.name || 'Member') : 'Member';
  }

  if (loading) {
    return <PageLoader text="Loading your workspace…" />;
  }

  return (
    <div className="space-y-8">
      {/* 4 Stats Cards matching P1: Total Files, Used Storage, Created Folders, Quick Upload */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="hover-card-trigger">
          <MetricCard
            label="Total Files"
            value={files.filter((f) => !f.isFolder).length}
            icon={FileText}
            accent="text-cyan-600 dark:text-cyan-400"
          />
        </div>
        <div className="hover-card-trigger">
          <MetricCard
            label="Used Storage"
            value={formatBytes(userStorage)}
            icon={HardDrive}
            accent="text-emerald-600 dark:text-emerald-400"
          />
        </div>
        <div className="hover-card-trigger">
          <MetricCard
            label="Created Folders"
            value={files.filter((f) => f.isFolder).length}
            icon={Database}
            accent="text-amber-600 dark:text-amber-400"
          />
        </div>
        <div className="hover-card-trigger">
          <QuickUploadCard />
        </div>
      </div>

      {/* Main Grid: Recent Activity Table + Storage Usage */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity Section matching P1 visual reference */}
        <section className="rounded-2xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60 lg:col-span-2 shadow-sm flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">
                Recent Activity
              </h3>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                Recently uploaded files & folders
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <th className="pb-3 pl-1 font-semibold">File Name</th>
                    <th className="pb-3 px-3 font-semibold">Owner</th>
                    <th className="pb-3 px-3 font-semibold">Modified</th>
                    <th className="pb-3 px-3 font-semibold">Type</th>
                    <th className="pb-3 px-3 font-semibold">Size</th>
                    <th className="pb-3 pr-1 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {recentItems.length > 0 ? (
                    recentItems.map((item) => {
                      const typeDetails = getFileTypeDetails(item);
                      const TypeIcon = typeDetails.icon;
                      return (
                        <tr
                          key={item._id}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors duration-150"
                        >
                          {/* File Name + Icon */}
                          <td className="py-3.5 pl-1 pr-3 font-medium text-slate-900 dark:text-slate-100">
                            <div className="flex items-center gap-2.5 min-w-0 max-w-[200px] sm:max-w-[240px]">
                              <span
                                className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${typeDetails.color}`}
                              >
                                <TypeIcon size={15} />
                              </span>
                              <span className="truncate font-semibold text-slate-800 dark:text-slate-200" title={item.originalName}>
                                {item.originalName}
                              </span>
                            </div>
                          </td>

                          {/* Owner */}
                          <td className="py-3.5 px-3 whitespace-nowrap text-slate-600 dark:text-slate-400 font-medium">
                            {renderOwnerName(item)}
                          </td>

                          {/* Modified Relative Time */}
                          <td className="py-3.5 px-3 whitespace-nowrap text-slate-500 dark:text-slate-400">
                            {formatRelativeTime(item.createdAt)}
                          </td>

                          {/* Type */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <span className="inline-block rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                              {typeDetails.label}
                            </span>
                          </td>

                          {/* Size */}
                          <td className="py-3.5 px-3 whitespace-nowrap text-slate-500 dark:text-slate-400 font-medium">
                            {item.isFolder ? '-' : formatBytes(item.size)}
                          </td>

                          {/* Actions: Share & Download */}
                          <td className="py-3.5 pr-1 pl-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-3">
                              {/* Folder or File Actions */}
                              {item.isFolder ? (
                                <button
                                  type="button"
                                  onClick={() => navigate('/files')}
                                  className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition"
                                  title="Open folder"
                                >
                                  <Folder size={13} />
                                  <span>Open</span>
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setShareModalFile(item)}
                                    className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition"
                                    title="Share file"
                                  >
                                    <Share2 size={13} />
                                    <span>Share</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDownload(item)}
                                    disabled={downloadingId === item._id}
                                    className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition disabled:opacity-50"
                                    title="Download file"
                                  >
                                    {downloadingId === item._id ? (
                                      <Loader2 size={13} className="animate-spin" />
                                    ) : (
                                      <Download size={13} />
                                    )}
                                    <span>Download</span>
                                  </button>
                                </>
                              )}

                              {/* More details / actions */}
                              <span className="text-slate-300 dark:text-slate-700">
                                <MoreHorizontal size={14} />
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-slate-500">
                        No recently uploaded files or created folders yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Storage Usage Section */}
        <section className="rounded-2xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-5">
              Storage Usage
            </h3>

            <div className="flex items-baseline justify-between mb-2">
              <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">
                {formatBytes(userStorage)}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Used of {user?.role === 'admin' ? '5 GB' : '200 MB'}
              </span>
            </div>

            {/* Storage Progress Bar */}
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-6">
              <div
                className="h-full rounded-full bg-blue-600 dark:bg-blue-400 transition-all duration-300"
                style={{
                  width: `${Math.min(100, (userStorage / (user?.role === 'admin' ? 5 * 1024 * 1024 * 1024 : 200 * 1024 * 1024)) * 100)}%`
                }}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2 dark:border-slate-800">
                <span className="text-slate-500">Images</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {files.filter((f) => f.mimeType?.startsWith('image/')).length} files
                </span>
              </div>
              <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2 dark:border-slate-800">
                <span className="text-slate-500">Documents</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {
                    files.filter(
                      (f) => f.mimeType?.includes('pdf') || f.mimeType?.includes('text')
                    ).length
                  } files
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Media</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {
                    files.filter(
                      (f) => f.mimeType?.startsWith('video/') || f.mimeType?.startsWith('audio/')
                    ).length
                  } files
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Share Modal Dialog */}
      {shareModalFile && (
        <ShareModal
          file={shareModalFile}
          busy={sharing}
          onClose={() => setShareModalFile(null)}
          onShare={handleShareSubmit}
        />
      )}
    </div>
  );
}
