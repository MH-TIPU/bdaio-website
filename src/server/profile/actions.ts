"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser, logActivity } from "@/lib/auth/dal";
import { deleteAvatar, saveAvatar } from "@/lib/storage/uploads";
import { isValidLocation } from "@/data/bd-geo";
import {
  isMinor,
  profileSchema,
  type ProfileFormState,
} from "@/lib/validation/profile";

export async function updateProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await requireUser();

  // The photo is a File, not a text field — pull it out before Zod parsing.
  const photo = formData.get("photo");
  formData.delete("photo");
  const removePhoto = formData.get("removePhoto") === "1";
  formData.delete("removePhoto");

  const parsed = profileSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );

  if (!parsed.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      (errors[key] ??= []).push(issue.message);
    }
    return { errors };
  }

  const data = parsed.data;
  const dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;

  // Geography must be a real division/district/upazila combination. The client
  // cascades the dropdowns, but a crafted POST could pair Sylhet with Dhaka.
  if (
    !isValidLocation({
      division: data.presentDivision,
      district: data.presentDistrict,
      upazila: data.presentUpazila,
    })
  ) {
    return {
      errors: { presentDistrict: ["Choose a valid division, district, and sub-district."] },
    };
  }

  // "Same as present" mirrors the present address rather than trusting whatever
  // the disabled inputs happened to submit.
  const permanent = data.sameAddress
    ? {
        division: data.presentDivision,
        district: data.presentDistrict,
        upazila: data.presentUpazila,
        address: data.presentAddress,
      }
    : {
        division: data.permanentDivision,
        district: data.permanentDistrict,
        upazila: data.permanentUpazila,
        address: data.permanentAddress,
      };

  if (!isValidLocation(permanent)) {
    return {
      errors: {
        permanentDistrict: ["Choose a valid division, district, and sub-district."],
      },
    };
  }

  // Guardian contact is mandatory for minors — checked here because only the
  // server knows the authoritative date of birth.
  if (isMinor(dateOfBirth)) {
    const missing: Record<string, string[]> = {};
    if (!data.guardianName) {
      missing.guardianName = ["Guardian name is required for participants under 18."];
    }
    if (!data.guardianPhone) {
      missing.guardianPhone = ["Guardian phone is required for participants under 18."];
    }
    if (Object.keys(missing).length) return { errors: missing };
  }

  // A public profile needs a handle to live at /u/[handle].
  if (data.visibility === "PUBLIC" && !data.handle) {
    return {
      errors: { handle: ["Choose a username to make your profile public."] },
    };
  }

  if (data.handle) {
    const taken = await db.profile.findFirst({
      where: { handle: data.handle, userId: { not: user.id } },
      select: { id: true },
    });
    if (taken) {
      return { errors: { handle: ["That username is already taken."] } };
    }
  }

  if (data.institutionId) {
    const institution = await db.institution.findUnique({
      where: { id: data.institutionId },
      select: { id: true },
    });
    if (!institution) {
      return { errors: { institutionId: ["Please choose a valid institution."] } };
    }
  }

  // Photo is handled only after every other check passes, so a rejected form
  // never leaves an orphaned file on disk.
  const existingPhoto = user.profile?.photo ?? null;
  let nextPhoto: string | null | undefined; // undefined = leave unchanged

  if (photo instanceof File && photo.size > 0) {
    const saved = await saveAvatar(photo);
    if (!saved.ok) return { errors: { photo: [saved.error] } };
    nextPhoto = saved.filename;
  } else if (removePhoto) {
    nextPhoto = null;
  }

  const profile = await db.profile.update({
    where: { userId: user.id },
    data: {
      ...(nextPhoto !== undefined ? { photo: nextPhoto } : {}),
      fullName: data.fullName,
      fullNameBn: data.fullNameBn ?? null,
      handle: data.handle ?? null,
      phone: data.phone ?? null,
      dateOfBirth,
      gender: data.gender ? data.gender : null,
      presentDivision: data.presentDivision ?? null,
      presentDistrict: data.presentDistrict ?? null,
      presentUpazila: data.presentUpazila ?? null,
      presentAddress: data.presentAddress ?? null,
      permanentDivision: permanent.division ?? null,
      permanentDistrict: permanent.district ?? null,
      permanentUpazila: permanent.upazila ?? null,
      permanentAddress: permanent.address ?? null,
      sameAddress: data.sameAddress,
      classGrade: data.classGrade ?? null,
      institutionId: data.institutionId ?? null,
      bio: data.bio ?? null,
      visibility: data.visibility,
    },
    select: { id: true },
  });

  // Guardian details are stored separately; upsert or clear as needed.
  if (data.guardianName && data.guardianPhone) {
    await db.guardianInfo.upsert({
      where: { profileId: profile.id },
      create: {
        profileId: profile.id,
        name: data.guardianName,
        relation: data.guardianRelation ?? null,
        phone: data.guardianPhone,
      },
      update: {
        name: data.guardianName,
        relation: data.guardianRelation ?? null,
        phone: data.guardianPhone,
      },
    });
  } else {
    await db.guardianInfo.deleteMany({ where: { profileId: profile.id } });
  }

  // Only once the new filename is committed is the old file safe to remove.
  if (nextPhoto !== undefined && existingPhoto && existingPhoto !== nextPhoto) {
    await deleteAvatar(existingPhoto);
  }

  await logActivity({
    userId: user.id,
    action: "profile.updated",
    entityType: "Profile",
    entityId: profile.id,
  });

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");

  return { success: true, message: "Profile saved." };
}
