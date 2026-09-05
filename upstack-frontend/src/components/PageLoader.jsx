export default function PageLoader({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 animate-fade-in-up">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-blue-600 border-t-transparent" />
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{text}</p>
    </div>
  );
}
