import { FolderPlus, RefreshCw, Search, ChevronRight, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import FileTable from '../components/FileTable.jsx';
import FileUploader from '../components/FileUploader.jsx';
import PageLoader from '../components/PageLoader.jsx';
import { api } from '../lib/api.js';

export default function Files() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [currentFolder, setCurrentFolder] = useState(null); // null is root
  const [folderPath, setFolderPath] = useState([]); // array of { id, name }
  const [filters, setFilters] = useState({ search: '', type: '', sort: 'createdAt', order: 'desc' });

  async function loadFiles(isInitial = false) {
    if (isInitial) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    try {
      const { data } = await api.get('/files', {
        params: {
          ...filters,
          folder: currentFolder || 'root'
        }
      });
      setFiles(data.files);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load files');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      // If we don't have files yet, treat as initial; otherwise background refresh
      loadFiles(files.length === 0);
    }, 250);
    return () => clearTimeout(timer);
  }, [filters, currentFolder]);

  async function createFolder() {
    if (creatingFolder) return;
    const name = window.prompt('Enter folder name:');
    if (!name || name.trim().length === 0) return;
    setCreatingFolder(true);
    try {
      await api.post('/files/folders', { name, folder: currentFolder });
      toast.success(`Folder "${name}" created`);
      await loadFiles(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Folder creation failed');
    } finally {
      setCreatingFolder(false);
    }
  }

  function handleFolderClick(folder) {
    setCurrentFolder(folder._id);
    setFolderPath([...folderPath, { id: folder._id, name: folder.originalName }]);
  }

  function navigateBreadcrumb(index) {
    if (index === -1) {
      setCurrentFolder(null);
      setFolderPath([]);
    } else {
      const target = folderPath[index];
      setCurrentFolder(target.id);
      setFolderPath(folderPath.slice(0, index + 1));
    }
  }

  return (
    <div className="space-y-8">
      
      {/* Title & Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Cloud Drive</h2>
          <p className="text-sm text-slate-500 dark:text-slate-450 mt-1 font-medium">Manage, organize, search, share, and backup files securely.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white px-4 py-2.5 text-xs font-semibold text-slate-650 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350 dark:hover:bg-slate-800/80 transition disabled:opacity-60 disabled:cursor-not-allowed" 
            onClick={() => loadFiles(false)}
            title="Refresh files"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-cyan-500' : ''} /> 
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <button 
            disabled={creatingFolder}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-cyan-500/10 hover:from-cyan-400 hover:to-indigo-500 transition duration-150 disabled:opacity-60 disabled:cursor-not-allowed" 
            onClick={createFolder}
          >
            {creatingFolder ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <FolderPlus size={14} />
            )}
            <span>{creatingFolder ? 'Creating...' : 'New Folder'}</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop Uploader */}
      <FileUploader folder={currentFolder} onUploaded={loadFiles} />

      {/* Directory Breadcrumbs — only shown when inside a subfolder */}
      {folderPath.length > 0 && (
        <div className="flex items-center flex-wrap gap-2 rounded-2xl border border-slate-100 bg-white/70 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/60 text-xs sm:text-sm shadow-sm">
          {folderPath.map((folder, index) => (
            <div key={folder.id} className="flex items-center gap-2 text-slate-400">
              {index > 0 && <ChevronRight size={14} />}
              <button
                onClick={() => navigateBreadcrumb(index)}
                className={`font-bold hover:text-cyan-500 transition max-w-[160px] truncate ${
                  index === folderPath.length - 1
                    ? 'text-cyan-500 dark:text-cyan-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {folder.name}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search, Filter & Sorting Panel */}
      <div className="grid gap-3.5 rounded-2xl border border-slate-100 bg-white p-5 dark:border-slate-850 dark:bg-slate-900/60 sm:grid-cols-4 shadow-sm">
        
        {/* Search */}
        <label className="relative sm:col-span-2">
          <Search className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
          <input 
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-sm outline-none transition focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:border-slate-800 dark:bg-slate-950" 
            placeholder="Search documents, photos..." 
            value={filters.search} 
            onChange={(event) => setFilters({ ...filters, search: event.target.value })} 
          />
        </label>

        {/* Filter Type */}
        <select 
          className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none focus:bg-white focus:border-cyan-500 dark:border-slate-800 dark:bg-slate-950 text-slate-700 dark:text-slate-350" 
          value={filters.type} 
          onChange={(event) => setFilters({ ...filters, type: event.target.value })}
        >
          <option value="">All Types</option>
          <option value="image">Images</option>
          <option value="pdf">PDF Documents</option>
          <option value="text">Text Files</option>
          <option value="video">Videos</option>
          <option value="audio">Audio Files</option>
        </select>

        {/* Sorting */}
        <select 
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500 dark:border-slate-800 dark:bg-slate-950 text-slate-700 dark:text-slate-300" 
          value={`${filters.sort}:${filters.order}`} 
          onChange={(event) => {
            const [sort, order] = event.target.value.split(':');
            setFilters({ ...filters, sort, order });
          }}
        >
          <option value="createdAt:desc">Newest First</option>
          <option value="createdAt:asc">Oldest First</option>
          <option value="originalName:asc">Name A-Z</option>
          <option value="size:desc">Largest Size</option>
        </select>

      </div>

      {/* Files Display Section */}
      {loading && files.length === 0 ? (
        <PageLoader text="Scanning cloud storage..." />
      ) : (
        <div className="relative">
          {refreshing && (
            <div className="absolute top-2 right-4 z-10 flex items-center gap-2 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold text-cyan-300 shadow-md backdrop-blur-sm dark:bg-slate-800/80">
              <Loader2 size={12} className="animate-spin" />
              <span>Updating...</span>
            </div>
          )}
          <FileTable files={files} onChanged={() => loadFiles(false)} onFolderClick={handleFolderClick} />
        </div>
      )}
    </div>
  );
}
