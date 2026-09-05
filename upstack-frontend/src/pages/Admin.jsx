import {
  AlertTriangle,
  FileText,
  HardDrive,
  Loader2,
  User as UserIcon,
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

// ─── Inline Settings panel for Admin users ───────────────────────────────────
function AdminSettings({ user }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2 text-sm">
      <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-950/50">
        <dt className="font-semibold text-slate-500 dark:text-slate-400">Account Holder</dt>
        <dd className="font-bold text-slate-800 dark:text-slate-200">{user?.name}</dd>
      </div>
      <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-950/50">
        <dt className="font-semibold text-slate-500 dark:text-slate-400">Registered Email</dt>
        <dd className="truncate font-medium text-slate-700 dark:text-slate-300">{user?.email}</dd>
      </div>
      <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-950/50">
        <dt className="font-semibold text-slate-500 dark:text-slate-400">Role</dt>
        <dd className="rounded-full bg-cyan-50 dark:bg-cyan-950/30 px-2.5 py-0.5 text-xs font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider">
          {user?.role}
        </dd>
      </div>
      <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-950/50">
        <dt className="font-semibold text-slate-500 dark:text-slate-400">Storage Used</dt>
        <dd className="font-bold text-slate-800 dark:text-slate-200">{formatBytes(user?.storageUsed || 0)}</dd>
      </div>
    </dl>
  );
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

        {/* Title */}
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Admin Console</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Monitor system-wide cloud utilization and manage user accounts.
          </p>
        </div>

        {/* Metrics — 3 cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="hover-card-trigger">
            <MetricCard label="Registered Users" value={stats?.users ?? '—'} icon={Users} accent="text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="hover-card-trigger">
            <MetricCard label="Cloud Files" value={stats?.files ?? '—'} icon={FileText} accent="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="hover-card-trigger">
            <MetricCard label="Total Storage" value={formatBytes(stats?.storageUsed || 0)} icon={HardDrive} accent="text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        {/* User Management */}
        <section className="rounded-2xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-white text-base mb-6">User Accounts</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 pr-4">Role</th>
                  <th className="pb-3 pr-4">Status</th>
                  {/* Actions: this entire page is already admin-only via backend + UI guard */}
                  <th className="pb-3 text-right">Actions</th>
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
                      {/* Name — highlight own row */}
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

                      {/* Role badge */}
                      <td className="py-3.5 pr-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          target.role === 'admin'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {target.role}
                        </span>
                      </td>

                      {/* Status badge */}
                      <td className="py-3.5 pr-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          target.isActive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                            : 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                        }`}>
                          {target.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>

                      {/* Actions — admin-only page means only admin ever sees these */}
                      <td className="py-3.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          {busy ? (
                            <Loader2 size={16} className="animate-spin text-slate-400" />
                          ) : (
                            <>
                              {/* Role toggle — visible to admin, hidden from normal users
                                  (entire page requires admin role) */}
                              <button
                                title="Toggle role (Admin / User)"
                                disabled={busy}
                                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 dark:text-cyan-400 dark:hover:text-cyan-300 dark:hover:bg-cyan-950/40 transition disabled:opacity-50"
                                onClick={() => handleRoleToggle(target)}
                              >
                                Role
                              </button>

                              {/* Suspend / Activate */}
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

        {/* Embedded Workspace Settings for admin users */}
        <section className="rounded-2xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
              <UserIcon size={17} />
            </span>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Workspace Settings</h3>
          </div>
          <AdminSettings user={user} />
        </section>

      </div>
    </>
  );
}
