import { ArrowRight, Cloud, Files, Lock, Mail, ShieldCheck, User as UserIcon, Users } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import AppFooter from '../components/AppFooter.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Auth({ mode }) {
  const isRegister = mode === 'register';
  const { login, register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  async function submit(event) {
    event.preventDefault();
    try {
      await (isRegister ? register(form) : login({ email: form.email, password: form.password }));
      toast.success(isRegister ? 'Welcome to UpStack!' : 'Successfully signed in');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Authentication failed');
    }
  }

  return (
    <main className="flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-blue-50 via-white to-slate-50 text-slate-950">
      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/10 animate-fade-in-up lg:grid-cols-[1.05fr_0.95fr]">
          <section className="hidden bg-gradient-to-br from-blue-600 to-cyan-500 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 backdrop-blur">
                  <Cloud size={26} />
                </span>
                <div>
                  <p className="text-xl font-black">UpStack</p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-100">Secure Cloud Drive</p>
                </div>
              </div>

              <div className="mt-14 max-w-md">
                <h1 className="text-4xl font-black tracking-tight">Your premium workspace for secure files.</h1>
                <p className="mt-4 text-base leading-7 text-blue-50">
                  Store, organize, and share documents from a clean dashboard built for speed and confidence.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/20 bg-white/15 p-5 backdrop-blur">
              <div className="grid gap-3">
                {[
                  { label: 'Encrypted storage', icon: ShieldCheck },
                  { label: 'File organization', icon: Files },
                  { label: 'Team sharing', icon: Users }
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 rounded-2xl bg-white/15 px-4 py-3">
                    <item.icon size={18} />
                    <span className="text-sm font-bold">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <form onSubmit={submit} className="p-6 sm:p-10 lg:p-12">
            <Link to="/welcome" className="mb-10 inline-flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                <Cloud size={23} />
              </span>
              <span>
                <span className="block text-lg font-black leading-none text-slate-950">UpStack</span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Cloud Drive</span>
              </span>
            </Link>

            <div className="mb-8">
              <p className="text-sm font-bold text-blue-600">{isRegister ? 'Create workspace' : 'Welcome back'}</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                {isRegister ? 'Start your secure cloud account' : 'Sign in to your dashboard'}
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                {isRegister ? 'Create an account to manage uploads, folders, sharing, and backups.' : 'Access your files, shared links, analytics, and account settings.'}
              </p>
            </div>

            <div className="space-y-5">
              {isRegister && (
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">Full Name</span>
                  <label className="relative mt-2 block">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      placeholder="John Doe"
                      value={form.name}
                      onChange={(event) => setForm({ ...form, name: event.target.value })}
                      required
                    />
                  </label>
                </div>
              )}

              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</span>
                <label className="relative mt-2 block">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    required
                  />
                </label>
              </div>

              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">Password</span>
                <label className="relative mt-2 block">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    minLength={8}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    placeholder="Password"
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                    required
                  />
                </label>
              </div>
            </div>

            <button
              disabled={loading}
              className="group mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:translate-y-0 disabled:opacity-70"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>{isRegister ? 'Create account' : 'Sign in'}</span>
                  <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                </>
              )}
            </button>

            <p className="mt-6 text-center text-sm text-slate-500">
              {isRegister ? 'Already have an account?' : 'Need a new account?'}{' '}
              <Link className="font-bold text-blue-600 hover:text-blue-700" to={isRegister ? '/login' : '/register'}>
                {isRegister ? 'Sign in' : 'Register now'}
              </Link>
            </p>
          </form>
        </div>
      </div>
      <AppFooter />
    </main>
  );
}
