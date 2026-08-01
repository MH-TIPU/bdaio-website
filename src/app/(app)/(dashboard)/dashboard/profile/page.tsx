import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import { avatarUrl } from "@/lib/storage/uploads";
import { ProfileForm, type ProfileDefaults } from "./ProfileForm";

export const metadata: Metadata = { title: "My Profile" };

function isoDate(value: Date | null): string {
  return value ? value.toISOString().slice(0, 10) : "";
}

export default async function ProfilePage() {
  const user = await requireUser();

  const profile = await db.profile.findUnique({
    where: { userId: user.id },
    include: { guardian: true, institution: { select: { name: true } } },
  });

  const defaults: ProfileDefaults = {
    fullName: profile?.fullName ?? "",
    fullNameBn: profile?.fullNameBn ?? "",
    handle: profile?.handle ?? "",
    phone: profile?.phone ?? "",
    dateOfBirth: isoDate(profile?.dateOfBirth ?? null),
    gender: profile?.gender ?? "",
    presentDivision: profile?.presentDivision ?? "",
    presentDistrict: profile?.presentDistrict ?? "",
    presentUpazila: profile?.presentUpazila ?? "",
    presentAddress: profile?.presentAddress ?? "",
    permanentDivision: profile?.permanentDivision ?? "",
    permanentDistrict: profile?.permanentDistrict ?? "",
    permanentUpazila: profile?.permanentUpazila ?? "",
    permanentAddress: profile?.permanentAddress ?? "",
    sameAddress: profile?.sameAddress ?? false,
    classGrade: profile?.classGrade ?? "",
    institutionId: profile?.institutionId ?? "",
    bio: profile?.bio ?? "",
    visibility: profile?.visibility ?? "PRIVATE",
    smsOptIn: profile?.smsOptIn ?? false,
    guardianName: profile?.guardian?.name ?? "",
    guardianRelation: profile?.guardian?.relation ?? "",
    guardianPhone: profile?.guardian?.phone ?? "",
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
      <p className="mt-1 text-sm text-slate-600">
        Used for olympiad and workshop registrations.
      </p>

      <div className="mt-8 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <ProfileForm
          defaults={defaults}
          institutionName={profile?.institution?.name ?? ""}
          photoUrl={avatarUrl(profile?.photo)}
        />
      </div>
    </>
  );
}
