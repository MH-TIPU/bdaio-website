"use client";

import { useActionState, useState } from "react";
import { registerInstitution } from "@/server/community/actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Combobox } from "@/components/ui/Combobox";
import { SELECT_CLASS } from "@/components/admin/formStyles";
import { DIVISION_NAMES, districtNamesOf, upazilasOf } from "@/data/bd-geo";

export function RegisterInstitutionForm() {
  const [state, action, pending] = useActionState(registerInstitution, undefined);
  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [upazila, setUpazila] = useState("");

  return (
    <form action={action} className="space-y-4" noValidate>
      {state?.message && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {state.message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Institution name"
          name="name"
          required
          defaultValue=""
          errors={state?.errors?.name}
          className="sm:col-span-2"
        />
        <Field
          label="Name (বাংলা)"
          name="nameBn"
          errors={state?.errors?.nameBn}
          className="font-bengali sm:col-span-2"
        />
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-slate-700">
            Type
          </label>
          <select id="type" name="type" defaultValue="SCHOOL" className={SELECT_CLASS}>
            <option value="SCHOOL">School</option>
            <option value="COLLEGE">College</option>
            <option value="UNIVERSITY">University</option>
            <option value="CLUB">Club</option>
            <option value="COMMUNITY">Community</option>
          </select>
        </div>
        <Combobox
          label="Division"
          name="division"
          options={DIVISION_NAMES}
          value={division}
          onChange={(v) => {
            setDivision(v);
            setDistrict("");
            setUpazila("");
          }}
          errors={state?.errors?.division}
        />
        <Combobox
          label="District"
          name="district"
          options={districtNamesOf(division)}
          value={district}
          onChange={(v) => {
            setDistrict(v);
            setUpazila("");
          }}
          disabled={!division}
          disabledHint="Choose a division first"
          errors={state?.errors?.district}
        />
        <Combobox
          label="Sub-district (Upazila)"
          name="upazila"
          options={upazilasOf(division, district)}
          value={upazila}
          onChange={setUpazila}
          disabled={!district}
          disabledHint="Choose a district first"
          errors={state?.errors?.upazila}
        />
        <Field
          label="Website"
          name="website"
          type="url"
          errors={state?.errors?.website}
          className="sm:col-span-2"
        />
        <Field
          label="Description"
          name="description"
          errors={state?.errors?.description}
          className="sm:col-span-2"
        />
      </div>

      <p className="rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-600">
        BdAIO reviews every submission before an institution appears publicly.
        Once approved, you become its moderator and can approve members and
        verify that students really belong to your institution.
      </p>

      <Button type="submit" disabled={pending} className="w-auto">
        {pending ? "Submitting…" : "Submit for review"}
      </Button>
    </form>
  );
}
