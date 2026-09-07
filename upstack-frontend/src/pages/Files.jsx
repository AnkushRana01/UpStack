import { FolderPlus, RefreshCw, Search, ChevronRight, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import FileTable from '../components/FileTable.jsx';
import PageLoader from '../components/PageLoader.jsx';
import { api } from '../lib/api.js';

export default function Files() {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [currentFolder, setCurrentFolder] = useState(null); // null is root
  const [folderPath, setFolderPath] = useState([]); // array of { id, name }
  const [filters, setFilters] = useState({ search: initialSearch, type: '', sort: 'createdAt', order: 'desc' });

  // Sync search param from URL if changed by global search
  useEffect(() => {
    const urlQuery = searchParams.get('search');
    if (urlQuery !== null && urlQuery !== filters.search) {
      setFilters((prev) => ({ ...prev, search: urlQuery }));
    }
  }, [searchParams]);

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

  useEffect(() => {
    const handleRefresh = () => loadFiles(false);
    window.addEventListener('upstack:refresh-files', handleRefresh);
    return () => window.removeEventListener('upstack:refresh-files', handleRefresh);
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
      
      {/* Subheader: Breadcrumbs navigation & Action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1.5 text-xs sm:text-sm font-medium">
          <button
            onClick={() => navigateBreadcrumb(-1)}
            className={`transition hover:text-blue-600 dark:hover:text-blue-400 ${
              folderPath.length === 0
                ? 'text-slate-700 dark:text-slate-200 font-semibold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            All Files
          </button>
          {folderPath.map((folder, index) => (
            <div key={folder.id} className="flex items-center gap-1.5 text-slate-400">
              <ChevronRight size={14} />
              <button
                onClick={() => navigateBreadcrumb(index)}
                className={`transition max-w-[180px] truncate ${
                  index === folderPath.length - 1
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-blue-600 font-medium'
                }`}
              >
                {folder.name}
              </button>
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button 
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-xs" 
            onClick={() => loadFiles(false)}
            title="Refresh files"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-blue-500' : ''} /> 
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <button 
            disabled={creatingFolder}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 text-xs font-semibold shadow-xs transition duration-150 disabled:opacity-60 disabled:cursor-not-allowed" 
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
