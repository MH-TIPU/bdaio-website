"use client";

import { useState } from "react";
import { Combobox } from "@/components/ui/Combobox";
import { Field } from "@/components/ui/Field";
import {
  DIVISION_NAMES,
  districtNamesOf,
  upazilasOf,
} from "@/data/bd-geo";

export type AddressValue = {
  division: string;
  district: string;
  upazila: string;
  address: string;
};

/**
 * Division → District → Sub-district (upazila) → street, each dependent on the
 * one above. Changing a parent clears its children so an impossible
 * combination (e.g. Sylhet + Dhaka district) can never be submitted.
 */
export function useAddress(initial: AddressValue) {
  const [value, setValue] = useState<AddressValue>(initial);

  return {
    value,
    setDivision: (division: string) =>
      setValue({ division, district: "", upazila: "", address: value.address }),
    setDistrict: (district: string) =>
      setValue({ ...value, district, upazila: "" }),
    setUpazila: (upazila: string) => setValue({ ...value, upazila }),
    setAddress: (address: string) => setValue({ ...value, address }),
    set: setValue,
  };
}

export function AddressFields({
  prefix,
  address,
  errors,
  disabled = false,
}: {
  /** Field-name prefix, e.g. "present" → presentDivision, presentDistrict… */
  prefix: "present" | "permanent";
  address: ReturnType<typeof useAddress>;
  errors?: Record<string, string[] | undefined>;
  disabled?: boolean;
}) {
  const { value } = address;
  const cap = prefix.charAt(0).toUpperCase() + prefix.slice(1);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Combobox
        label="Division"
        name={`${prefix}Division`}
        options={DIVISION_NAMES}
        value={value.division}
        onChange={address.setDivision}
        errors={errors?.[`${prefix}Division`]}
        disabled={disabled}
      />
      <Combobox
        label="District"
        name={`${prefix}District`}
        options={districtNamesOf(value.division)}
        value={value.district}
        onChange={address.setDistrict}
        errors={errors?.[`${prefix}District`]}
        disabled={disabled || !value.division}
        disabledHint={disabled ? undefined : "Choose a division first"}
      />
      <Combobox
        label="Sub-district (Upazila)"
        name={`${prefix}Upazila`}
        options={upazilasOf(value.division, value.district)}
        value={value.upazila}
        onChange={address.setUpazila}
        errors={errors?.[`${prefix}Upazila`]}
        disabled={disabled || !value.district}
        disabledHint={disabled ? undefined : "Choose a district first"}
      />
      <Field
        label="Village / road / house"
        name={`${prefix}Address`}
        value={value.address}
        onChange={(e) => address.setAddress(e.target.value)}
        errors={errors?.[`${prefix}Address`]}
        disabled={disabled}
        aria-label={`${cap} street address`}
      />
    </div>
  );
}
