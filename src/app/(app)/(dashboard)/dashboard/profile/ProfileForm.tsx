"use client";

import { useActionState, useState } from "react";
import { updateProfile } from "@/server/profile/actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { AvatarField } from "@/components/ui/AvatarField";
import { AddressFields, useAddress } from "@/components/ui/AddressFields";
import { InstitutionPicker } from "@/components/community/InstitutionPicker";

export type ProfileDefaults = {
  fullName: string;
  fullNameBn: string;
  handle: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  presentDivision: string;
  presentDistrict: string;
  presentUpazila: string;
  presentAddress: string;
  permanentDivision: string;
  permanentDistrict: string;
  permanentUpazila: string;
  permanentAddress: string;
  sameAddress: boolean;
  classGrade: string;
  institutionId: string;
  bio: string;
  visibility: "PRIVATE" | "PUBLIC";
  smsOptIn: boolean;
  guardianName: string;
  guardianRelation: string;
  guardianPhone: string;
};

const SELECT_CLASS =
  "mt-1.5 block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-bdaio-blue focus:outline-none focus:ring-2 focus:ring-bdaio-blue/30";

function isUnder18(iso: string): boolean {
  if (!iso) return false;
  const dob = new Date(iso);
  if (Number.isNaN(dob.getTime())) return false;
  const eighteen = new Date(dob);
  eighteen.setFullYear(eighteen.getFullYear() + 18);
  return eighteen > new Date();
}

export function ProfileForm({
  defaults,
  institutionName,
  photoUrl,
}: {
  defaults: ProfileDefaults;
  institutionName: string;
  photoUrl: string | null;
}) {
  const [state, action, pending] = useActionState(updateProfile, undefined);
  const [dob, setDob] = useState(defaults.dateOfBirth);
  const minor = isUnder18(dob);

  const present = useAddress({
    division: defaults.presentDivision,
    district: defaults.presentDistrict,
    upazila: defaults.presentUpazila,
    address: defaults.presentAddress,
  });
  const permanent = useAddress({
    division: defaults.permanentDivision,
    district: defaults.permanentDistrict,
    upazila: defaults.permanentUpazila,
    address: defaults.permanentAddress,
  });
  const [same, setSame] = useState(defaults.sameAddress);

  return (
    <form action={action} className="space-y-8" noValidate>
      {state?.success && state.message && (
        <p
          role="status"
          className="rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800"
        >
          {state.message}
        </p>
      )}

      <section>
        <h2 className="text-sm font-semibold text-slate-900">Your details</h2>
        <div className="mt-4">
          <AvatarField
            currentUrl={photoUrl}
            fullName={defaults.fullName}
            errors={state?.errors?.photo}
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="Full name"
            name="fullName"
            required
            defaultValue={defaults.fullName}
            errors={state?.errors?.fullName}
          />
          <Field
            label="Phone"
            name="phone"
            type="tel"
            defaultValue={defaults.phone}
            errors={state?.errors?.phone}
          />
          <Field
            label="Date of birth"
            name="dateOfBirth"
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            errors={state?.errors?.dateOfBirth}
          />
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-slate-700">
              Gender
            </label>
            <select
              id="gender"
              name="gender"
              defaultValue={defaults.gender}
              className={SELECT_CLASS}
            >
              <option value="">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-900">Present address</h2>
        <p className="mt-1 text-xs text-slate-500">
          Where you live now. Start typing to search.
        </p>
        <div className="mt-4">
          <AddressFields prefix="present" address={present} errors={state?.errors} />
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Permanent address</h2>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="sameAddress"
              checked={same}
              onChange={(e) => {
                setSame(e.target.checked);
                if (e.target.checked) permanent.set(present.value);
              }}
              className="h-4 w-4 rounded border-slate-300"
            />
            Same as present
          </label>
        </div>
        <div className="mt-4">
          <AddressFields
            prefix="permanent"
            address={same ? present : permanent}
            errors={state?.errors}
            disabled={same}
          />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-900">Institution</h2>
        <p className="mt-1 text-xs text-slate-500">
          Suggestions come from your present district — search by name.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <InstitutionPicker
            defaultId={defaults.institutionId}
            defaultName={institutionName}
            district={present.value.district}
            division={present.value.division}
            errors={state?.errors?.institutionId}
          />
          <Field
            label="Class / grade"
            name="classGrade"
            defaultValue={defaults.classGrade}
            errors={state?.errors?.classGrade}
          />
        </div>
      </section>

      {minor && (
        <section>
          <h2 className="text-sm font-semibold text-slate-900">
            Guardian contact
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Required for participants under 18.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label="Guardian name"
              name="guardianName"
              defaultValue={defaults.guardianName}
              errors={state?.errors?.guardianName}
            />
            <Field
              label="Relationship"
              name="guardianRelation"
              defaultValue={defaults.guardianRelation}
              errors={state?.errors?.guardianRelation}
            />
            <Field
              label="Guardian phone"
              name="guardianPhone"
              type="tel"
              defaultValue={defaults.guardianPhone}
              errors={state?.errors?.guardianPhone}
            />
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold text-slate-900">Public profile</h2>
        <p className="mt-1 text-xs text-slate-500">
          Your profile is private unless you choose to make it public.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="Username"
            name="handle"
            defaultValue={defaults.handle}
            hint="Your public page: /u/username"
            errors={state?.errors?.handle}
          />
          <div>
            <label
              htmlFor="visibility"
              className="block text-sm font-medium text-slate-700"
            >
              Visibility
            </label>
            <select
              id="visibility"
              name="visibility"
              defaultValue={defaults.visibility}
              className={SELECT_CLASS}
            >
              <option value="PRIVATE">Private — only you and BdAIO staff</option>
              <option value="PUBLIC">Public — anyone can view</option>
            </select>
          </div>
          <Field
            label="Short bio"
            name="bio"
            defaultValue={defaults.bio}
            errors={state?.errors?.bio}
            className="sm:col-span-2"
          />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-900">Notifications</h2>
        <p className="mt-1 text-xs text-slate-500">
          You always get an email and an in-app notification. Text messages are
          extra, and off unless you ask for them.
        </p>
        <label className="mt-4 flex items-start gap-2.5 text-sm text-slate-700">
          <input
            type="checkbox"
            name="smsOptIn"
            defaultChecked={defaults.smsOptIn}
            className="mt-0.5 h-4 w-4 rounded border-slate-300"
          />
          <span>
            Send me an SMS for important updates — a registration decision or a
            published result.
            <span className="mt-0.5 block text-xs text-slate-500">
              Needs a Bangladeshi mobile number in the contact details above.
              Standard operator charges never apply to you; we pay for what we
              send.
            </span>
          </span>
        </label>
      </section>

      <Button type="submit" disabled={pending} className="w-auto">
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
