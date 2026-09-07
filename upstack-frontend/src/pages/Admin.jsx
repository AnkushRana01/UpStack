import {
  AlertTriangle,
  FileText,
  HardDrive,
  Loader2,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import MetricCard from '../components/MetricCard.jsx';
import PageLoader from '../components/PageLoader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api, formatBytes } from '../lib/api.js';

// ─── Role Transfer Modal (Case B: multiple eligible users) ───────────────────
function RoleTransferModal({ eligibleUsers, onConfirm, onCancel, actionLabel }) {
  const [selectedId, setSelectedId] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    if (!selectedId) {
      toast.error('Please select a user to become the new Admin.');
      return;
    }
    setBusy(true);
    await onConfirm(selectedId);
    // Note: busy stays true — the modal will unmount after onConfirm resolves
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop — clicking outside cancels */}
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        onClick={busy ? undefined : onCancel}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            Transfer Admin Role
          </h3>
          {!busy && (
            <button
              onClick={onCancel}
              className="ml-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Cancel"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          You are about to suspend your Admin account. You must assign the Admin role
          to another active user before your account can be suspended.
        </p>

        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Select the new Admin
        </p>

        {/* Eligible user list — only active, non-self users */}
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {eligibleUsers.map((u) => (
            <button
              key={u._id}
              onClick={() => !busy && setSelectedId(u._id)}
              className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                selectedId === u._id
                  ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-slate-600'
              }`}
            >
              <span
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                  selectedId === u._id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {u.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 dark:text-white truncate">{u.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{u.email}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedId || busy}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 py-2.5 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {busy && <Loader2 size={15} className="animate-spin" />}
            Transfer Admin &amp; Suspend My Account
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Format Last Login Helper ───────────────────────────────────────────────
function formatLastLogin(dateStr) {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Never';

  const now = new Date();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `Today ${diffMinutes}m ago`;
  if (diffHours < 24 && date.getDate() === now.getDate()) {
    return `Today ${diffHours}h ago`;
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

// ─── Main Admin Component ────────────────────────────────────────────────────
export default function Admin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState({}); // per-user busy state

  // transferModal shape: { targetUser, patch, eligibleUsers, isSelf, newAdminName? }
  const [transferModal, setTransferModal] = useState(null);

  // ── Data loading ────────────────────────────────────────────────────────────
  async function load(isInitial = false) {
    if (isInitial || !stats) setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.users);
    } catch {
      toast.error('Failed to load administrator data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.role === 'admin') load(true);
  }, [user]);

  // ── Core PATCH helper ────────────────────────────────────────────────────────
  // isSelf: true when the currently-logged-in admin is suspending their own account.
  // After a successful self-suspension we must log out and redirect to /login.
  async function sendUpdate(targetUser, patch, newAdminId = null, isSelf = false) {
    setActionBusy((prev) => ({ ...prev, [targetUser._id]: true }));
    try {
      await api.patch(`/admin/users/${targetUser._id}`, {
        ...patch,
        ...(newAdminId && { newAdminId }),
      });

      if (isSelf) {
        // Self-suspension succeeded — the current admin account is now suspended.
        // Invalidate the session and redirect to the login page.
        toast.success('Your account has been suspended and Admin role transferred.');
        setTransferModal(null);
        // Small delay so the toast is visible before the session is cleared
        setTimeout(() => {
          logout();
          navigate('/login', { replace: true });
        }, 1200);
      } else {
        toast.success(`User "${targetUser.name}" updated`);
        setTransferModal(null);
        await load(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user');
      setActionBusy((prev) => ({ ...prev, [targetUser._id]: false }));
      setTransferModal(null);
    }
    // Note: we do NOT clear actionBusy after self-suspension because the component
    // will unmount (logout) shortly after. For non-self updates load() re-renders.
    if (!isSelf) {
      setActionBusy((prev) => ({ ...prev, [targetUser._id]: false }));
    }
  }

  // ── Role toggle (Admin ↔ User) ───────────────────────────────────────────────
  // Only triggered by the "Role" button — NOT related to suspension.
  async function handleRoleToggle(target) {
    const newRole = target.role === 'admin' ? 'user' : 'admin';
    const patch = { role: newRole, isActive: target.isActive };

    // Demoting an admin → check that another admin will still exist
    if (target.role === 'admin' && newRole === 'user') {
      const activeAdmins = users.filter((u) => u.role === 'admin' && u.isActive);
      if (activeAdmins.length <= 1) {
        // This is the last active admin
        const eligible = users.filter((u) => u._id !== target._id && u.isActive);
        if (!eligible.length) {
          toast.error('No other active users available to assign the Admin role to.');
          return;
        }
        // Show selection modal (no self-logout needed for role demotion)
        setTransferModal({
          targetUser: target,
          patch,
          eligibleUsers: eligible,
          isSelf: false,
          actionLabel: 'demoting this admin',
        });
        return;
      }
    }

    await sendUpdate(target, patch);
  }

  // ── Suspend / Activate ───────────────────────────────────────────────────────
  async function handleSuspend(target) {
    const suspending = target.isActive; // true = we are suspending, false = reactivating
    const patch = { role: target.role, isActive: !target.isActive };

    // ── Reactivation — always straightforward ──────────────────────────────
    if (!suspending) {
      await sendUpdate(target, patch);
      return;
    }

    // ── Suspending a NORMAL USER — always straightforward ──────────────────
    if (target.role !== 'admin') {
      await sendUpdate(target, patch);
      return;
    }

    // ── Suspending an ADMIN ────────────────────────────────────────────────
    // Determine whether this is the admin suspending their own account.
    const isSelf = target._id === user?._id;

    if (!isSelf) {
      // Suspending ANOTHER admin account (not the current user).
      // Only prevent it if this would leave zero active admins.
      const activeAdmins = users.filter((u) => u.role === 'admin' && u.isActive);
      if (activeAdmins.length <= 1) {
        // target is the last admin — suspension would leave no admins
        toast.error(
          'Cannot suspend this account — it is the only active Admin. Promote another user to Admin first.'
        );
        return;
      }
      // Safe to suspend — at least one other admin exists
      await sendUpdate(target, patch);
      return;
    }

    // ── Admin is suspending THEMSELVES (isSelf = true) ─────────────────────
    // Collect all active users who can receive the Admin role.
    // Criteria: active, not the current admin (target), any role.
    const eligible = users.filter((u) => u._id !== target._id && u.isActive);

    // Edge case: only one account in the system (or all others are suspended)
    if (!eligible.length) {
      const totalUsers = users.length;
      if (totalUsers <= 1) {
        toast.error(
          'You are the only account in the system. Create or activate another user and transfer the Admin role before suspending this account.',
          { duration: 6000 }
        );
      } else {
        toast.error(
          'All other accounts are currently suspended. Activate another user first so the Admin role can be transferred.',
          { duration: 6000 }
        );
      }
      return;
    }

    // Case A — exactly one other active account: auto-transfer, no modal needed
    if (eligible.length === 1) {
      const autoUser = eligible[0];
      const toastId = toast.loading(
        `Transferring Admin role to "${autoUser.name}" and suspending your account…`
      );
      await sendUpdate(target, patch, autoUser._id, true /* isSelf */);
      toast.dismiss(toastId);
      return;
    }

    // Case B — multiple eligible users: open the selection modal
    setTransferModal({
      targetUser: target,
      patch,
      eligibleUsers: eligible,
      isSelf: true,
      actionLabel: 'suspending your account',
    });
  }

  // ── Access denied guard ──────────────────────────────────────────────────────
  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-red-200/40 bg-red-50/20 p-16 text-center text-red-700 dark:border-red-950/40 dark:bg-red-950/20 dark:text-red-400">
        <AlertTriangle size={48} className="text-red-500 mb-4 stroke-[1.5]" />
        <h3 className="text-lg font-bold">Access Denied</h3>
        <p className="text-sm text-red-500/80 dark:text-red-400/80 mt-1 max-w-md">
          Administrator privileges are required to view the management panel.
        </p>
      </div>
    );
  }

  // ── Page loading ─────────────────────────────────────────────────────────────
  if (loading && !stats) {
    return <PageLoader text="Loading admin console…" />;
  }

  return (
    <>
      {/* Role Transfer Modal — Case B (multiple eligible users) */}
      {transferModal && (
        <RoleTransferModal
          eligibleUsers={transferModal.eligibleUsers}
          actionLabel={transferModal.actionLabel}
          onConfirm={(newAdminId) =>
            sendUpdate(
              transferModal.targetUser,
              transferModal.patch,
              newAdminId,
              transferModal.isSelf
            )
          }
          onCancel={() => setTransferModal(null)}
        />
      )}

      <div className="space-y-8">
        {/* Heading */}
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-[26px] font-bold tracking-tight text-slate-900 dark:text-white truncate">
            UpStack Admin Console - {user?.name || 'Admin'} (Admin)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Organization Overview
          </p>
        </div>

        {/* Metrics Cards matching P2 */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="hover-card-trigger">
            <MetricCard
              label="Total Users"
              value={stats?.users ?? '—'}
              icon={Users}
              accent="text-blue-600 dark:text-blue-400"
            />
          </div>
          <div className="hover-card-trigger">
            <MetricCard
              label="Cloud Files"
              value={stats?.files ?? '—'}
              icon={FileText}
              accent="text-indigo-600 dark:text-indigo-400"
            />
          </div>

          {/* Total Organization Storage Card matching P2 */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-850 dark:bg-slate-900/60 transition-all duration-300 hover:shadow-md hover:scale-[1.01] hover:-translate-y-0.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">
                  Total Organization Storage
                </p>
                <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {formatBytes(stats?.storageUsed || 0)}
                </p>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-slate-50 dark:bg-slate-950/80 text-blue-600 dark:text-blue-400 border border-slate-100/50 dark:border-slate-800">
                <HardDrive size={22} strokeWidth={1.8} />
              </div>
            </div>
            <div className="mt-3">
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-1.5">
                <div
                  className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(2, ((stats?.storageUsed || 0) / (stats?.storageLimit || 5 * 1024 * 1024 * 1024)) * 100))}%`
                  }}
                />
              </div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {formatBytes(stats?.storageUsed || 0)} / 5 GB
              </p>
            </div>
          </div>
        </div>

        {/* User Management Section */}
        <section className="rounded-2xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-white text-base mb-6">User Management</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="pb-3 pr-4">User</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 pr-4">Permissions</th>
                  <th className="pb-3 pr-4">Last Login</th>
                  <th className="pb-3 text-right">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((target) => {
                  const busy = actionBusy[target._id];
                  const isSelf = target._id === user?._id;
                  return (
                    <tr
                      key={target._id}
                      className={`transition ${isSelf ? 'bg-blue-50/30 dark:bg-blue-950/10' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/20'}`}
                    >
                      {/* Name / User */}
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{target.name}</span>
                          {isSelf && (
                            <span className="text-[10px] font-bold uppercase tracking-wider rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 px-2 py-0.5">
                              You
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 pr-4 text-slate-500 dark:text-slate-400 text-xs">{target.email}</td>

                      {/* Permissions / Role badge */}
                      <td className="py-3.5 pr-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          target.role === 'admin'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {target.role === 'admin' ? 'Admin' : 'Basic User'}
                        </span>
                      </td>

                      {/* Last Login */}
                      <td className="py-3.5 pr-4 text-xs">
                        {target.lastLogin ? (
                          <span className="text-slate-600 dark:text-slate-300 font-medium">
                            {formatLastLogin(target.lastLogin)}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic">
                            Never
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          {busy ? (
                            <Loader2 size={16} className="animate-spin text-slate-400" />
                          ) : (
                            <>
                              <button
                                title="Toggle role (Admin / User)"
                                disabled={busy}
                                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 dark:text-cyan-400 dark:hover:text-cyan-300 dark:hover:bg-cyan-950/40 transition disabled:opacity-50"
                                onClick={() => handleRoleToggle(target)}
                              >
                                Role
                              </button>

                              <button
                                title={target.isActive ? 'Suspend account' : 'Reactivate account'}
                                disabled={busy}
                                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                                  target.isActive
                                    ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-950/40'
                                    : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-950/40'
                                }`}
                                onClick={() => handleSuspend(target)}
                              >
                                {target.isActive ? 'Suspend' : 'Activate'}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {users.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">No users found.</p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
