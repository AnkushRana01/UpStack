import {
  CheckCircle2,
  Download,
  File,
  FileArchive,
  FileSpreadsheet,
  FileText,
  Folder,
  Image as ImageIcon,
  Loader2,
  Music,
  Plus,
  RefreshCw,
  Share2,
  Trash2,
  UserPlus,
  Video,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageLoader from '../components/PageLoader.jsx';
import { api, downloadUrl, formatBytes } from '../lib/api.js';

export default function Shared() {
  const [activeTab, setActiveTab] = useState('with-me'); // 'with-me' | 'by-me'
  const [sharedWithMe, setSharedWithMe] = useState([]);
  const [sharedByMe, setSharedByMe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [revokingId, setRevokingId] = useState(null);

  // Add Collaborator Modal states
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [userFiles, setUserFiles] = useState([]);
  const [loadingUserFiles, setLoadingUserFiles] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState('');
  const [collabEmail, setCollabEmail] = useState('');
  const [sharingBusy, setSharingBusy] = useState(false);

  async function loadAllShares(isInitial = false) {
    if (isInitial) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    try {
      const [withMeRes, byMeRes] = await Promise.all([
        api.get('/share/me'),
        api.get('/share/by-me')
      ]);
      setSharedWithMe(withMeRes.data?.shares || []);
      setSharedByMe(byMeRes.data?.shares || []);
    } catch (error) {
      toast.error('Failed to load shared files');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAllShares(true);
  }, []);

  useEffect(() => {
    const handleRefresh = () => loadAllShares(false);
    window.addEventListener('upstack:refresh-files', handleRefresh);
    return () => window.removeEventListener('upstack:refresh-files', handleRefresh);
  }, []);

  // Fetch user's own files when opening Add Collaborator modal
  async function openCollabModal() {
    setShowCollabModal(true);
    setLoadingUserFiles(true);
    try {
      const { data } = await api.get('/files');
      const regularFiles = (data.files || []).filter((f) => !f.isFolder);
      setUserFiles(regularFiles);
      if (regularFiles.length > 0) {
        setSelectedFileId(regularFiles[0]._id);
      }
    } catch (error) {
      toast.error('Failed to load your files for sharing');
    } finally {
      setLoadingUserFiles(false);
    }
  }

  async function handleAddCollaborator(e) {
    e.preventDefault();
    if (!selectedFileId || !collabEmail.trim()) {
      toast.error('Please choose a file and enter a recipient email');
      return;
    }

    setSharingBusy(true);
    try {
      await api.post(`/share/${selectedFileId}/user`, {
        email: collabEmail.trim(),
        permission: 'download'
      });
      toast.success(`Shared file with ${collabEmail.trim()}`);
      setShowCollabModal(false);
      setCollabEmail('');
      await loadAllShares(false);
      setActiveTab('by-me');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to share file');
    } finally {
      setSharingBusy(false);
    }
  }

  async function downloadIncoming(share) {
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
          : 'Download failed. Please try again.');
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

  async function downloadOutgoing(share) {
    if (downloadingId || !share.file?._id) return;
    setDownloadingId(share._id);
    const token = localStorage.getItem('token');
    const fileName = share.file?.originalName || 'file';

    try {
      const response = await fetch(downloadUrl(share.file._id), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.message || 'Download failed');
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

  async function handleRevoke(share) {
    if (revokingId) return;
    const recipient = share.sharedWith?.name || share.sharedWith?.email || 'this user';
    const fileName = share.file?.originalName || 'this file';
    if (!window.confirm(`Revoke sharing access for ${recipient} on "${fileName}"?`)) return;

    setRevokingId(share._id);
    try {
      await api.delete(`/share/${share._id}`);
      toast.success('Access revoked successfully');
      setSharedByMe((prev) => prev.filter((s) => s._id !== share._id));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to revoke access');
    } finally {
      setRevokingId(null);
    }
  }

  function getFileIcon(file) {
    if (!file) return <File size={19} className="text-slate-400" />;
    if (file.isFolder) return <Folder size={20} className="text-amber-500 fill-amber-500/20" />;
    const mime = (file.mimeType || '').toLowerCase();
    if (mime.startsWith('image/')) return <ImageIcon size={19} className="text-emerald-500" />;
    if (mime.startsWith('video/')) return <Video size={19} className="text-rose-500" />;
    if (mime.startsWith('audio/')) return <Music size={19} className="text-purple-500" />;
    if (mime.includes('pdf')) return <FileText size={19} className="text-red-500" />;
    if (mime.includes('sheet') || mime.includes('excel') || mime.includes('csv') || mime.includes('calc'))
      return <FileSpreadsheet size={19} className="text-emerald-600" />;
    if (mime.includes('zip') || mime.includes('tar') || mime.includes('archive') || mime.includes('compressed'))
      return <FileArchive size={19} className="text-amber-600" />;
    if (mime.includes('text/') || mime.includes('json') || mime.includes('javascript'))
      return <FileText size={19} className="text-blue-500" />;
    return <File size={19} className="text-blue-600" />;
  }

  function getInitials(name = '', email = '') {
    const target = name || email || 'User';
    const parts = target.trim().split(/[\s@._-]+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return target.slice(0, 2).toUpperCase();
  }

  const currentList = activeTab === 'with-me' ? sharedWithMe : sharedByMe;

  return (
    <div className="space-y-6">
      
      {/* Tabs and Actions Header Bar - Matching P2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-0">
        <div className="flex items-center gap-8">
          <button
            onClick={() => setActiveTab('with-me')}
            className={`relative pb-3 text-sm font-semibold transition ${
              activeTab === 'with-me'
                ? 'text-slate-900 dark:text-white font-bold'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <span>Shared with Me</span>
            {sharedWithMe.length > 0 && (
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-medium">
                {sharedWithMe.length}
              </span>
            )}
            {activeTab === 'with-me' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('by-me')}
            className={`relative pb-3 text-sm font-semibold transition ${
              activeTab === 'by-me'
                ? 'text-slate-900 dark:text-white font-bold'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <span>Shared by Me</span>
            {sharedByMe.length > 0 && (
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-medium">
                {sharedByMe.length}
              </span>
            )}
            {activeTab === 'by-me' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 mb-2 sm:mb-2 self-start sm:self-auto">
          <button
            disabled={refreshing || loading}
            onClick={() => loadAllShares(false)}
            title="Refresh list"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 transition shadow-xs disabled:opacity-60"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin text-blue-500' : ''} />
            <span className="hidden xs:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={openCollabModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 text-xs font-semibold shadow-xs transition duration-150"
          >
            <Plus size={14} />
            <span>Add Collaborators</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <PageLoader text="Loading shared files..." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/60 shadow-xs">
          {currentList.length === 0 ? (
            <div className="p-16 text-center text-slate-500 dark:text-slate-400">
              <Share2 className="mx-auto text-slate-300 dark:text-slate-700 mb-4 stroke-[1.5]" size={48} />
              <p className="font-semibold text-base text-slate-800 dark:text-slate-200">
                {activeTab === 'with-me' ? 'No files shared with you yet' : 'No files shared by you yet'}
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {activeTab === 'with-me'
                  ? 'When teammates share documents directly with your email, they will appear here.'
                  : 'Click "Add Collaborators" above to share files with other registered members.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm dark:divide-slate-800">
                <thead className="bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-3.5">File Name</th>
                    <th className="px-6 py-3.5">
                      {activeTab === 'with-me' ? 'Access By' : 'Shared With'}
                    </th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-transparent">
                  {currentList.map((share) => {
                    const file = share.file;
                    if (!file) return null;

                    const isOwnerView = activeTab === 'by-me';
                    const targetPerson = isOwnerView ? share.sharedWith : share.owner;
                    const personName = targetPerson?.name || targetPerson?.email || (isOwnerView ? 'Recipient' : 'Owner');
                    const personEmail = targetPerson?.email || '';
                    const personInitials = getInitials(personName, personEmail);
                    const isDownloading = downloadingId === share._id;
                    const isRevoking = revokingId === share._id;

                    return (
                      <tr
                        key={share._id}
                        className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/25 transition duration-150 group ${
                          isRevoking ? 'opacity-50 bg-rose-50/20' : ''
                        }`}
                      >
                        {/* File Name & Info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="shrink-0">{getFileIcon(file)}</div>
                            <div className="min-w-0">
                              <p
                                className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px] sm:max-w-[260px]"
                                title={file.originalName}
                              >
                                {file.originalName}
                              </p>
                              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                                {isOwnerView
                                  ? `Shared by you • ${formatBytes(file.size)}`
                                  : `Shared by ${personName} • ${formatBytes(file.size)}`}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Access by / Shared with Avatar */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                              {personInitials}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-750 dark:text-slate-300 truncate max-w-[150px]">
                                {personName}
                              </p>
                              {personEmail && personEmail !== personName && (
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[150px]">
                                  {personEmail}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-2 justify-end">
                            {/* Download Button */}
                            {(!isOwnerView ? share.permission === 'download' : true) && (
                              <button
                                disabled={isDownloading || isRevoking}
                                onClick={() => (isOwnerView ? downloadOutgoing(share) : downloadIncoming(share))}
                                title="Download file"
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400 transition disabled:opacity-50"
                              >
                                {isDownloading ? (
                                  <Loader2 size={15} className="animate-spin text-blue-500" />
                                ) : (
                                  <Download size={15} />
                                )}
                              </button>
                            )}

                            {/* Revoke Button for owner */}
                            {isOwnerView && (
                              <button
                                disabled={isRevoking || isDownloading}
                                onClick={() => handleRevoke(share)}
                                title="Revoke access"
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 transition disabled:opacity-50"
                              >
                                {isRevoking ? (
                                  <Loader2 size={15} className="animate-spin text-rose-500" />
                                ) : (
                                  <Trash2 size={15} />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Collaborator Modal */}
      {showCollabModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={sharingBusy ? undefined : () => setShowCollabModal(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-fade-in-up">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Add Collaborators</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Share one of your files with a team member.
                </p>
              </div>
              {!sharingBusy && (
                <button
                  type="button"
                  onClick={() => setShowCollabModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <form onSubmit={handleAddCollaborator} className="space-y-4">
              {/* File Select */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Select File to Share
                </label>
                {loadingUserFiles ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                    <Loader2 size={14} className="animate-spin" />
                    <span>Loading your files...</span>
                  </div>
                ) : userFiles.length === 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/20 dark:text-amber-300 font-medium">
                    You don't have any uploaded files yet. Please upload files before adding collaborators.
                  </div>
                ) : (
                  <select
                    required
                    disabled={sharingBusy}
                    value={selectedFileId}
                    onChange={(e) => setSelectedFileId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {userFiles.map((file) => (
                      <option key={file._id} value={file._id}>
                        {file.originalName} ({formatBytes(file.size)})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Recipient Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Recipient Email
                </label>
                <input
                  type="email"
                  required
                  disabled={sharingBusy || userFiles.length === 0}
                  placeholder="colleague@example.com"
                  value={collabEmail}
                  onChange={(e) => setCollabEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-950/50"
                />
              </div>

              {/* Permission Granted */}
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Permission Granted
                </span>
                <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-3 text-xs font-semibold text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                  <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Full access (Recipient can view file details and download)</span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={sharingBusy}
                  onClick={() => setShowCollabModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sharingBusy || !selectedFileId || !collabEmail.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {sharingBusy ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Sharing...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={15} />
                      <span>Share File</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
