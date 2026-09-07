import { File, Folder, Loader2, Search, X, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, formatBytes } from '../lib/api.js';

export default function GlobalSearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const searchContainerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search query
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get('/files', {
          params: { search: trimmed }
        });
        setResults(data.files || []);
        setIsOpen(true);
      } catch (_err) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle enter key press
  function handleKeyDown(e) {
    if (e.key === 'Enter' && query.trim()) {
      setIsOpen(false);
      navigate(`/files?search=${encodeURIComponent(query.trim())}`);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }

  // Clear query
  function handleClear() {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  }

  // Handle clicking a search result item
  function handleSelectResult(item) {
    setIsOpen(false);
    navigate(`/files?search=${encodeURIComponent(item.originalName)}`);
  }

  return (
    <div className="relative flex-1 max-w-[320px] sm:w-64 md:w-72 lg:w-80" ref={searchContainerRef}>
      {/* Search Input Container matching P1 */}
      <div className="relative flex items-center">
        <Search
          size={16}
          className="absolute left-3.5 text-slate-400 pointer-events-none stroke-[2]"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen && e.target.value.trim()) setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim() && results.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search files, folders..."
          className="w-full rounded-lg border border-slate-200/90 bg-white py-2 pl-9 pr-8 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs transition duration-150 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 sm:py-2.5 sm:text-sm"
        />
        {loading ? (
          <Loader2 size={14} className="absolute right-3 text-slate-400 animate-spin" />
        ) : query ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 transition"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>

      {/* Instant Search Results Dropdown */}
      {isOpen && query.trim() && (
        <div className="absolute left-0 right-0 mt-2 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-2xl ring-1 ring-black/5 dark:border-slate-800 dark:bg-slate-900 z-50 animate-fade-in-up">
          {results.length > 0 ? (
            <div className="space-y-1">
              <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Found {results.length} {results.length === 1 ? 'item' : 'items'}
              </div>
              {results.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => handleSelectResult(item)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-xs transition hover:bg-slate-100 dark:hover:bg-slate-800/80"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="shrink-0 text-slate-500 dark:text-slate-400">
                      {item.isFolder ? (
                        <Folder size={16} className="text-amber-500" />
                      ) : (
                        <File size={16} className="text-blue-500" />
                      )}
                    </span>
                    <span className="truncate font-semibold text-slate-800 dark:text-slate-200">
                      {item.originalName}
                    </span>
                  </div>
                  <span className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    {item.isFolder ? 'Folder' : formatBytes(item.size)}
                  </span>
                </button>
              ))}
              <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    navigate(`/files?search=${encodeURIComponent(query.trim())}`);
                  }}
                  className="flex w-full items-center justify-between px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  <span>View all results in Files</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ) : !loading ? (
            <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
              No files or folders found for "{query.trim()}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
