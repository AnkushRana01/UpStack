export default function MetricCard({ label, value, icon: Icon, accent = 'text-cyan-600' }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-850 dark:bg-slate-900/60 transition-all duration-300 hover:shadow-md hover:scale-[1.01] hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">{label}</p>
          <p className="mt-2.5 text-2xl font-black text-slate-900 dark:text-white tracking-tight">{value}</p>
        </div>
        <div className={`grid h-12 w-12 place-items-center rounded-xl bg-slate-50 dark:bg-slate-950/80 ${accent} border border-slate-100/50 dark:border-slate-800`}>
          <Icon size={22} strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
}
