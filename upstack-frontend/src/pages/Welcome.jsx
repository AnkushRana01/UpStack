import { ArrowRight, Cloud, Files, LockKeyhole, Menu, Share2, Sparkles, Users, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import AppFooter from '../components/AppFooter.jsx';

const features = [
  { title: 'File Management', description: 'Organize folders, documents, media, and backups in one polished workspace.', icon: Files },
  { title: 'Team Collaboration', description: 'Share access with teammates while keeping ownership and permissions clear.', icon: Users },
  { title: 'Secure Cloud Storage', description: 'Encrypted storage patterns help protect private files from upload to download.', icon: LockKeyhole },
  { title: 'Fast Access & Sharing', description: 'Share with users, download quickly, and keep important files within reach.', icon: Share2 }
];

function WelcomeNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link to="/welcome" className="flex items-center gap-2.5 shrink-0">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
            <Cloud size={20} />
          </span>
          <span className="text-base font-black tracking-tight text-slate-950">UpStack</span>
        </Link>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-3 sm:flex">
          <Link
            to="/login"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
          >
            Sign Up
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 sm:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-4 space-y-2 sm:hidden dark:border-slate-800 dark:bg-slate-950">
          <Link
            to="/login"
            onClick={() => setMobileOpen(false)}
            className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            onClick={() => setMobileOpen(false)}
            className="block w-full rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-bold text-white hover:bg-blue-700"
          >
            Sign Up
          </Link>
        </div>
      )}
    </nav>
  );
}

function CloudIllustration() {
  return (
    <div className="relative mx-auto max-w-xl animate-float">
      <div className="rounded-[2rem] border border-white/70 bg-white/80 p-4 shadow-2xl shadow-blue-900/10 backdrop-blur">
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-300" />
              <span className="h-3 w-3 rounded-full bg-amber-300" />
              <span className="h-3 w-3 rounded-full bg-emerald-300" />
            </div>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">Live sync</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-[0.75fr_1.25fr]">
            <div className="space-y-3 rounded-2xl bg-white p-3 shadow-sm">
              {['Designs', 'Documents', 'Shared'].map((item, index) => (
                <div key={item} className={`flex items-center gap-2 rounded-xl px-3 py-2 ${index === 0 ? 'bg-blue-50 text-blue-700' : 'text-slate-500'}`}>
                  <Cloud size={15} />
                  <span className="text-xs font-bold">{item}</span>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {[72, 54, 88].map((width, index) => (
                <div key={width} className="rounded-2xl bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className={`grid h-10 w-10 place-items-center rounded-xl ${index === 1 ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                      {index === 2 ? <Share2 size={18} /> : <Files size={18} />}
                    </span>
                    <div className="flex-1">
                      <span className="block h-2 rounded-full bg-slate-200" style={{ width: `${width}%` }} />
                      <span className="mt-2 block h-2 w-1/2 rounded-full bg-slate-100" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Welcome() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      {/* Navbar */}
      <WelcomeNav />

      {/* Hero */}
      <section className="overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="mx-auto grid min-h-[84vh] max-w-7xl items-center gap-12 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:px-8">
          <div className="animate-fade-in-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm">
              <Sparkles size={16} />
              Premium secure cloud workspace
            </div>
            <h1 className="max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              UpStack
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              A clean, secure, and modern cloud platform for storing, organizing, and sharing your most important files.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
              >
                Sign In <ArrowRight size={16} />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700"
              >
                Create account
              </Link>
            </div>
          </div>
          <CloudIllustration />
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-black tracking-tight text-slate-950">Everything your cloud drive needs</h2>
            <p className="mt-3 text-slate-600">Simple tools, calm layouts, and secure sharing built for daily work.</p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/5"
              >
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-600">
                  <feature.icon size={22} />
                </span>
                <h3 className="mt-5 text-base font-black text-slate-950">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Video */}
      <section className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-black tracking-tight text-slate-950">See the workspace in motion</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">
            A quick look at the premium cloud-storage experience designed for fast access, sharing, and team confidence.
          </p>
          <div className="mt-10 overflow-hidden rounded-3xl border border-white bg-white p-2 shadow-2xl shadow-slate-950/10">
            <video
              className="aspect-video w-full rounded-[1.25rem] bg-slate-900 object-cover"
              src="/dbx1-hero-1920x1080-v2.mp4"
              autoPlay
              loop
              muted
              playsInline
              controls
              preload="metadata"
            />
          </div>
        </div>
      </section>

      <AppFooter />
    </main>
  );
}
