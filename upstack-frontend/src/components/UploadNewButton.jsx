import { ChevronDown, FileUp, FolderPlus, FolderUp, Loader2, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../lib/api.js';

export default function UploadNewButton() {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Handle uploading multiple files
  async function handleFilesUpload(fileList) {
    if (!fileList || fileList.length === 0) return;
    const filesArray = Array.from(fileList);
    setUploading(true);
    let successCount = 0;

    for (const file of filesArray) {
      const data = new FormData();
      data.append('file', file);

      try {
        await api.post('/s3/upload', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        successCount++;
      } catch (error) {
        toast.error(error.response?.data?.message || `Failed to upload "${file.name}"`);
      }
    }

    if (successCount > 0) {
      toast.success(
        successCount === 1
          ? `"${filesArray[0].name}" uploaded successfully!`
          : `${successCount} files uploaded successfully!`
      );
      window.dispatchEvent(new CustomEvent('upstack:refresh-files'));
    }

    setUploading(false);
    // Reset file input values
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (folderInputRef.current) folderInputRef.current.value = '';
  }

  // Handle creating a new folder
  async function handleCreateFolder() {
    if (creatingFolder) return;
    setOpen(false);
    const name = window.prompt('Enter new folder name:');
    if (!name || name.trim().length === 0) return;

    setCreatingFolder(true);
    try {
      await api.post('/files/folders', { name: name.trim() });
      toast.success(`Folder "${name.trim()}" created!`);
      window.dispatchEvent(new CustomEvent('upstack:refresh-files'));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Folder creation failed');
    } finally {
      setCreatingFolder(false);
    }
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Hidden inputs for file and directory selection */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          setOpen(false);
          handleFilesUpload(e.target.files);
        }}
      />
      <input
        ref={folderInputRef}
        type="file"
        webkitdirectory=""
        directory=""
        multiple
        className="hidden"
        onChange={(e) => {
          setOpen(false);
          handleFilesUpload(e.target.files);
        }}
      />

      {/* Button matching P1 styling */}
      <button
        type="button"
        disabled={uploading || creatingFolder}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors duration-150 hover:bg-blue-700 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70 sm:px-4 sm:py-2.5"
        title="Upload New Files and Folder"
        aria-expanded={open}
      >
        {uploading || creatingFolder ? (
          <Loader2 size={16} className="animate-spin text-white" />
        ) : (
          <Upload size={16} className="stroke-[2.2]" />
        )}
        <span className="whitespace-nowrap">Upload New</span>
        <ChevronDown
          size={14}
          className={`opacity-80 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-52 origin-top-right rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5 backdrop-blur-md transition dark:border-slate-800 dark:bg-slate-900 z-50 animate-fade-in-up">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              fileInputRef.current?.click();
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition"
          >
            <FileUp size={15} className="text-blue-600 dark:text-blue-400" />
            <span>Upload File(s)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              folderInputRef.current?.click();
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition"
          >
            <FolderUp size={15} className="text-emerald-600 dark:text-emerald-400" />
            <span>Upload Folder</span>
          </button>

          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

          <button
            type="button"
            onClick={handleCreateFolder}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition"
          >
            <FolderPlus size={15} className="text-amber-600 dark:text-amber-400" />
            <span>Create New Folder</span>
          </button>
        </div>
      )}
    </div>
  );
}
