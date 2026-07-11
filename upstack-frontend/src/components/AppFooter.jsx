export default function AppFooter({ dark = false }) {
  return (
    <footer className={`border-t px-4 py-6 text-sm ${dark ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-500'}`}>
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
        <p>© All Rights Reserved by Ankush</p>
        <p>Built with ❤️ by Ankush Rana</p>
      </div>
    </footer>
  );
}
