import { Loader2, Upload, UploadCloud } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../lib/api.js';

export default function QuickUploadCard() {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeFileName, setActiveFileName] = useState('');
  const fileInputRef = useRef(null);

  const handleUploadFiles = useCallback(async (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    setUploading(true);
    let successCount = 0;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      setActiveFileName(file.name);
      setProgress(0);

      const data = new FormData();
      data.append('file', file);

      try {
        await api.post('/s3/upload', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (event) => {
            if (event.total) {
              setProgress(Math.round((event.loaded * 100) / event.total));
            }
          }
        });
        successCount++;
      } catch (error) {
        toast.error(error.response?.data?.message || `Failed to upload "${file.name}"`);
      }
    }

    if (successCount > 0) {
      toast.success(
        successCount === 1
          ? `"${fileList[0].name}" uploaded successfully!`
          : `${successCount} files uploaded successfully!`
      );
      window.dispatchEvent(new CustomEvent('upstack:refresh-files'));
    }

    setUploading(false);
    setActiveFileName('');
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  function onDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading) setIsDragActive(true);
  }

  function onDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }

  function onDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (uploading) return;
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files);
    }
  }

  function handleFileSelect(e) {
    if (e.target?.files && e.target.files.length > 0) {
      handleUploadFiles(e.target.files);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-850 dark:bg-slate-900/60 transition-all duration-300 hover:shadow-md hover:scale-[1.01] hover:-translate-y-0.5 flex flex-col justify-between h-full">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        disabled={uploading}
      />

      {/* Card Header matching P1 */}
      <div className="mb-2">
        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
          Quick Upload
        </h4>
      </div>

      {/* Drop Zone Box matching P1 visual reference */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative flex-1 min-h-[96px] rounded-xl border border-dashed flex flex-col items-center justify-center p-3 text-center transition-all duration-200 cursor-pointer ${
          uploading
            ? 'border-blue-400 bg-blue-50/20 dark:border-blue-700 dark:bg-blue-950/10 cursor-not-allowed'
            : isDragActive
            ? 'border-blue-500 bg-blue-50/50 scale-[0.99] dark:border-blue-400 dark:bg-blue-950/30'
            : 'border-slate-250 bg-slate-50/40 hover:border-blue-400 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-slate-700'
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center w-full px-2">
            <Loader2 size={20} className="text-blue-600 dark:text-blue-400 animate-spin mb-1.5" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate max-w-full">
              Uploading {activeFileName}
            </p>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-full bg-slate-100 p-2 text-slate-500 dark:bg-slate-800 dark:text-slate-400 mb-1.5 group-hover:text-blue-600 transition">
              <UploadCloud size={20} className={isDragActive ? 'animate-bounce text-blue-600' : ''} />
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-tight">
              {isDragActive ? 'Release to upload' : 'Drag & Drop Files here'}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              or{' '}
              <span
                className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Browse
              </span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
