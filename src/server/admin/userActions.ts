"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import { hashPassword } from "@/lib/auth/password";
import { logActivity } from "@/lib/auth/dal";

const ROLES = ["PARTICIPANT", "INSTITUTION_MODERATOR", "ADMIN", "SUPER_ADMIN"] as const;
const STATUSES = ["ACTIVE", "SUSPENDED", "PENDING"] as const;

export type FormState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

function generateHandle(fullName: string, email: string): string {
  const base = fullName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 16) || email.split("@")[0].replace(/[^a-z0-9]/g, "").slice(0, 16);
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${base}-${suffix}`;
}

export async function createUserAdmin(
  prevState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const actor = await requireRole("ADMIN");
  const isSuper = actor.role === "SUPER_ADMIN";

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const roleInput = String(formData.get("role") ?? "PARTICIPANT");
  const statusInput = String(formData.get("status") ?? "ACTIVE");

  const errors: Record<string, string[]> = {};
  if (!email || !email.includes("@")) errors.email = ["A valid email address is required."];
  if (!fullName) errors.fullName = ["Full name is required."];
  if (!password || password.length < 6) errors.password = ["Password must be at least 6 characters."];

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  // Only Super Admin can create ADMIN or SUPER_ADMIN
  const role = ROLES.includes(roleInput as (typeof ROLES)[number]) ? roleInput : "PARTICIPANT";
  if ((role === "ADMIN" || role === "SUPER_ADMIN") && !isSuper) {
    return { success: false, message: "Only super admins can create admin accounts." };
  }

  const status = STATUSES.includes(statusInput as (typeof STATUSES)[number]) ? statusInput : "ACTIVE";

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, errors: { email: ["A user with this email already exists."] } };
  }

  const passwordHash = await hashPassword(password);
  const handle = generateHandle(fullName, email);

  const newUser = await db.user.create({
    data: {
      email,
      passwordHash,
      role: role as (typeof ROLES)[number],
      status: status as (typeof STATUSES)[number],
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          fullName,
          phone: phone || null,
          handle,
        },
      },
    },
  });

  await logActivity({
    userId: actor.id,
    action: "admin.user.created",
    entityType: "User",
    entityId: newUser.id,
    metadata: { email, role, status },
  });

  revalidatePath("/admin/users");
  return { success: true, message: "User account created successfully." };
}

export async function updateUserAdmin(
  prevState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const actor = await requireRole("ADMIN");
  const isSuper = actor.role === "SUPER_ADMIN";

  const userId = String(formData.get("userId") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const roleInput = String(formData.get("role") ?? "");
  const statusInput = String(formData.get("status") ?? "");

  if (!userId) return { success: false, message: "User ID missing." };

  const target = await db.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
  if (!target) return { success: false, message: "User not found." };

  const targetIsAdmin = target.role === "ADMIN" || target.role === "SUPER_ADMIN";
  const isSelf = target.id === actor.id;

  // Cannot modify self role or status via this admin endpoint
  if (isSelf && (roleInput !== target.role || statusInput !== target.status)) {
    return { success: false, message: "You cannot change your own role or status." };
  }

  // Non-super admin cannot edit an admin or assign admin role
  const touchesAdmin = targetIsAdmin || roleInput === "ADMIN" || roleInput === "SUPER_ADMIN";
  if (touchesAdmin && !isSuper && !isSelf) {
    return { success: false, message: "Only super admins can modify admin accounts." };
  }

  const updateData: {
    email?: string;
    role?: (typeof ROLES)[number];
    status?: (typeof STATUSES)[number];
    passwordHash?: string;
  } = {};

  if (email && email !== target.email) {
    const existing = await db.user.findUnique({ where: { email } });
    if (existing && existing.id !== target.id) {
      return { success: false, errors: { email: ["Email is already in use by another user."] } };
    }
    updateData.email = email;
  }

  if (ROLES.includes(roleInput as (typeof ROLES)[number]) && !isSelf) {
    updateData.role = roleInput as (typeof ROLES)[number];
  }

  if (STATUSES.includes(statusInput as (typeof STATUSES)[number]) && !isSelf) {
    updateData.status = statusInput as (typeof STATUSES)[number];
  }

  if (password && password.length >= 6) {
    updateData.passwordHash = await hashPassword(password);
  }

  await db.user.update({
    where: { id: userId },
    data: {
      ...updateData,
      profile: {
        upsert: {
          create: {
            fullName: fullName || target.email.split("@")[0],
            phone: phone || null,
            handle: generateHandle(fullName || target.email, email || target.email),
          },
          update: {
            fullName: fullName || target.profile?.fullName || target.email.split("@")[0],
            phone: phone || target.profile?.phone || null,
          },
        },
      },
    },
  });

  await logActivity({
    userId: actor.id,
    action: "admin.user.updated",
    entityType: "User",
    entityId: userId,
    metadata: { email: email || target.email },
  });

  revalidatePath("/admin/users");
  return { success: true, message: "User updated successfully." };
}

export async function deleteUserAdmin(
  prevState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const actor = await requireRole("ADMIN");
  const isSuper = actor.role === "SUPER_ADMIN";

  const userId = String(formData.get("userId") ?? "").trim();
  if (!userId) return { success: false, message: "User ID missing." };

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, email: true },
  });
  if (!target) return { success: false, message: "User not found." };

  if (target.id === actor.id) {
    return { success: false, message: "You cannot delete your own account." };
  }

  const targetIsAdmin = target.role === "ADMIN" || target.role === "SUPER_ADMIN";
  if (targetIsAdmin && !isSuper) {
    return { success: false, message: "Only super admins can delete admin accounts." };
  }

  await db.user.delete({ where: { id: userId } });

  await logActivity({
    userId: actor.id,
    action: "admin.user.deleted",
    entityType: "User",
    entityId: userId,
    metadata: { email: target.email, role: target.role },
  });

  revalidatePath("/admin/users");
  return { success: true, message: `User ${target.email} deleted successfully.` };
}
