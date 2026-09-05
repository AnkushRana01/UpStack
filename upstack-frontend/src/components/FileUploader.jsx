import { UploadCloud } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { api } from '../lib/api.js';

export default function FileUploader({ folder, onUploaded }) {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [activeFile, setActiveFile] = useState('');

  const uploadFiles = useCallback(async (acceptedFiles) => {
    for (const file of acceptedFiles) {
      const data = new FormData();
      data.append('file', file);
      if (folder) {
        data.append('folder', folder);
      }
      setUploading(true);
      setProgress(0);
      setActiveFile(file.name);

      try {
        await api.post('/s3/upload', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (event) => {
            if (event.total) {
              setProgress(Math.round((event.loaded * 100) / event.total));
            }
          }
        });
        toast.success(`"${file.name}" uploaded successfully to S3!`);
        onUploaded?.();
      } catch (error) {
        toast.error(error.response?.data?.message || `Upload failed for ${file.name}`);
      } finally {
        setUploading(false);
        setActiveFile('');
      }
    }
  }, [folder, onUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: uploadFiles,
    multiple: true,
    disabled: uploading
  });

  return (
    <section
      {...getRootProps()}
      className={`relative rounded-2xl border border-dashed p-8 transition-all duration-350 shadow-sm ${
        uploading
          ? 'cursor-not-allowed border-slate-300 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/30 opacity-80 pointer-events-none'
          : isDragActive
          ? 'cursor-pointer border-cyan-500 bg-cyan-50/40 dark:bg-cyan-950/20 scale-[0.99] shadow-inner animate-glow'
          : 'cursor-pointer border-slate-250 bg-white hover:border-cyan-450 dark:border-slate-800 dark:bg-slate-900/50 hover:shadow-md'
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center text-center">
        {/* Upload Icon */}
        <div className={`rounded-full p-4 transition-all duration-300 ${isDragActive ? 'bg-cyan-100 dark:bg-cyan-950 text-cyan-500 scale-110' : 'bg-slate-50 dark:bg-slate-950 text-cyan-600'}`}>
          <UploadCloud className={`${isDragActive ? 'animate-bounce' : 'animate-float'}`} size={32} />
        </div>
        
        <p className="mt-4 text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">
          {isDragActive ? 'Release to upload files' : 'Drag & drop files here or click to select'}
        </p>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          Secure encryption is applied to all uploads. Max file size: 100 MB.
        </p>
      </div>

      {/* Uploading progress bar */}
      {uploading && (
        <div className="absolute inset-0 rounded-xl bg-slate-950/70 backdrop-blur-xs flex flex-col justify-center px-8 z-10 animate-fade-in-up">
          <div className="flex items-center justify-between text-xs font-semibold text-white mb-2">
            <span className="truncate max-w-[70%]">Uploading {activeFile}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800 p-[1px]">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500 transition-all duration-150 shadow-[0_0_12px_rgba(34,211,238,0.5)]" 
              style={{ width: `${progress}%` }} 
            />
          </div>
        </div>
      )}
    </section>
  );
}
