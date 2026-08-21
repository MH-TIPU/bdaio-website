"use client";

import { useState, useActionState } from "react";
import { createUserAdmin, updateUserAdmin, deleteUserAdmin } from "@/server/admin/userActions";

export type AdminUserRecord = {
  id: string;
  email: string;
  role: "PARTICIPANT" | "INSTITUTION_MODERATOR" | "ADMIN" | "SUPER_ADMIN";
  status: "ACTIVE" | "SUSPENDED" | "PENDING";
  emailVerifiedAt?: Date | string | null;
  createdAt: Date | string;
  profile?: {
    fullName: string;
    handle?: string | null;
    phone?: string | null;
    institution?: { name: string } | null;
  } | null;
  _count?: {
    registrations: number;
    certificates?: number;
  };
};

function ModalBackdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

export function AddUserModal({ isSuper }: { isSuper: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createUserAdmin, undefined);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-bdaio-blue px-4 py-2 text-sm font-semibold text-white hover:bg-bdaio-blue-dark transition shadow-xs"
      >
        + Add User
      </button>
    );
  }

  return (
    <ModalBackdrop onClose={() => setOpen(false)}>
      <h2 className="text-xl font-bold text-slate-900 mb-4">Add New User</h2>

      {state?.message && (
        <p
          className={`mb-4 rounded-lg px-3 py-2 text-xs font-medium ${
            state.success ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
          }`}
        >
          {state.message}
        </p>
      )}

      <form action={action} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
          <input
            name="fullName"
            required
            placeholder="e.g. Tanvir Ahmed"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-bdaio-blue focus:outline-none"
          />
          {state?.errors?.fullName && (
            <p className="mt-1 text-xs text-red-600">{state.errors.fullName[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
          <input
            name="email"
            type="email"
            required
            placeholder="user@example.com"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-bdaio-blue focus:outline-none"
          />
          {state?.errors?.email && (
            <p className="mt-1 text-xs text-red-600">{state.errors.email[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Password *</label>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="Minimum 6 characters"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-bdaio-blue focus:outline-none"
          />
          {state?.errors?.password && (
            <p className="mt-1 text-xs text-red-600">{state.errors.password[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Phone (Optional)</label>
          <input
            name="phone"
            type="tel"
            placeholder="+8801700000000"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-bdaio-blue focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
            <select
              name="role"
              defaultValue="PARTICIPANT"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-bdaio-blue focus:outline-none"
            >
              <option value="PARTICIPANT">Participant</option>
              <option value="INSTITUTION_MODERATOR">Institution Moderator</option>
              {isSuper && <option value="ADMIN">Admin</option>}
              {isSuper && <option value="SUPER_ADMIN">Super Admin</option>}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
            <select
              name="status"
              defaultValue="ACTIVE"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-bdaio-blue focus:outline-none"
            >
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-bdaio-blue px-4 py-2 text-sm font-semibold text-white hover:bg-bdaio-blue-dark disabled:opacity-60"
          >
            {pending ? "Creating…" : "Create User"}
          </button>
        </div>
      </form>
    </ModalBackdrop>
  );
}

export function ViewUserModal({ user }: { user: AdminUserRecord }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 transition"
      >
        View
      </button>

      {open && (
        <ModalBackdrop onClose={() => setOpen(false)}>
          <h2 className="text-xl font-bold text-slate-900 mb-1">User Details</h2>
          <p className="text-xs text-slate-500 mb-4">ID: {user.id}</p>

          <div className="space-y-3 divide-y divide-slate-100 text-sm text-slate-700">
            <div className="pt-2 flex justify-between">
              <span className="font-semibold text-slate-500">Full Name</span>
              <span className="font-bold text-slate-900">{user.profile?.fullName ?? "—"}</span>
            </div>

            <div className="pt-2 flex justify-between">
              <span className="font-semibold text-slate-500">Email</span>
              <span>{user.email}</span>
            </div>

            <div className="pt-2 flex justify-between">
              <span className="font-semibold text-slate-500">Phone</span>
              <span>{user.profile?.phone ?? "—"}</span>
            </div>

            <div className="pt-2 flex justify-between">
              <span className="font-semibold text-slate-500">Handle</span>
              <span>{user.profile?.handle ? `@${user.profile.handle}` : "—"}</span>
            </div>

            <div className="pt-2 flex justify-between">
              <span className="font-semibold text-slate-500">Role</span>
              <span className="font-semibold text-bdaio-blue">{user.role}</span>
            </div>

            <div className="pt-2 flex justify-between">
              <span className="font-semibold text-slate-500">Status</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  user.status === "ACTIVE"
                    ? "bg-emerald-50 text-emerald-700"
                    : user.status === "SUSPENDED"
                    ? "bg-red-50 text-red-700"
                    : "bg-amber-50 text-amber-800"
                }`}
              >
                {user.status}
              </span>
            </div>

            <div className="pt-2 flex justify-between">
              <span className="font-semibold text-slate-500">Registrations</span>
              <span>{user._count?.registrations ?? 0}</span>
            </div>

            <div className="pt-2 flex justify-between">
              <span className="font-semibold text-slate-500">Joined Date</span>
              <span>
                {new Date(user.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            >
              Close
            </button>
          </div>
        </ModalBackdrop>
      )}
    </>
  );
}

export function EditUserModal({ user, isSuper }: { user: AdminUserRecord; isSuper: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(updateUserAdmin, undefined);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded px-2 py-1 text-xs font-semibold text-bdaio-blue hover:bg-blue-50 border border-blue-200 transition"
      >
        Edit
      </button>

      {open && (
        <ModalBackdrop onClose={() => setOpen(false)}>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Edit User Account</h2>

          {state?.message && (
            <p
              className={`mb-4 rounded-lg px-3 py-2 text-xs font-medium ${
                state.success ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
              }`}
            >
              {state.message}
            </p>
          )}

          <form action={action} className="space-y-4">
            <input type="hidden" name="userId" value={user.id} />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                name="fullName"
                defaultValue={user.profile?.fullName ?? ""}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-bdaio-blue focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                name="email"
                type="email"
                defaultValue={user.email}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-bdaio-blue focus:outline-none"
              />
              {state?.errors?.email && (
                <p className="mt-1 text-xs text-red-600">{state.errors.email[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
              <input
                name="phone"
                type="tel"
                defaultValue={user.profile?.phone ?? ""}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-bdaio-blue focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reset Password (Leave blank to keep current)
              </label>
              <input
                name="password"
                type="password"
                minLength={6}
                placeholder="New password (optional)"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-bdaio-blue focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                <select
                  name="role"
                  defaultValue={user.role}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-bdaio-blue focus:outline-none"
                >
                  <option value="PARTICIPANT">Participant</option>
                  <option value="INSTITUTION_MODERATOR">Institution Moderator</option>
                  {isSuper && <option value="ADMIN">Admin</option>}
                  {isSuper && <option value="SUPER_ADMIN">Super Admin</option>}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  name="status"
                  defaultValue={user.status}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-bdaio-blue focus:outline-none"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING">Pending</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-bdaio-blue px-4 py-2 text-sm font-semibold text-white hover:bg-bdaio-blue-dark disabled:opacity-60"
              >
                {pending ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </ModalBackdrop>
      )}
    </>
  );
}

export function DeleteUserModal({ user }: { user: AdminUserRecord }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(deleteUserAdmin, undefined);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition"
      >
        Delete
      </button>

      {open && (
        <ModalBackdrop onClose={() => setOpen(false)}>
          <h2 className="text-xl font-bold text-red-600 mb-2">Delete User Account</h2>
          <p className="text-sm text-slate-700 mb-4 leading-relaxed">
            Are you sure you want to permanently delete the account for{" "}
            <strong>{user.profile?.fullName || user.email}</strong>? This action cannot be undone.
          </p>

          {state?.message && (
            <p
              className={`mb-4 rounded-lg px-3 py-2 text-xs font-medium ${
                state.success ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
              }`}
            >
              {state.message}
            </p>
          )}

          <form action={action} className="mt-4 flex items-center justify-end gap-3">
            <input type="hidden" name="userId" value={user.id} />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 shadow-xs"
            >
              {pending ? "Deleting…" : "Confirm Delete"}
            </button>
          </form>
        </ModalBackdrop>
      )}
    </>
  );
}
