import { describe, expect, it } from "vitest";
import { formatBdMobile, normalizeBdMobile } from "@/lib/sms/phone";
import { districtNamesOf, isValidLocation, upazilasOf } from "@/data/bd-geo";
import { findColumn, headerIndex, parseCsv } from "@/lib/results/csv";
import { medalLabel } from "@/lib/results/medals";
import { emailBucket, retryAfterMessage } from "@/lib/security/rateLimit";
import { SETTINGS, decodeSetting, settingsFormSchema } from "@/lib/settings/registry";
import { SPONSOR_TIERS, TIER_COLUMNS, TIER_LABELS } from "@/lib/sponsors";
import { metaDescription } from "@/lib/seo";

describe("Bangladeshi mobile numbers", () => {
  it("normalises every way a person writes the same number", () => {
    for (const written of [
      "01712345678",
      "+880 1712 345678",
      "8801712345678",
      "01712-345678",
      " 017 1234 5678 ",
    ]) {
      expect(normalizeBdMobile(written)).toBe("8801712345678");
    }
  });

  it("accepts every live operator prefix", () => {
    for (const prefix of [13, 14, 15, 16, 17, 18, 19]) {
      expect(normalizeBdMobile(`0${prefix}12345678`)).toBe(`880${prefix}12345678`);
    }
  });

  it("rejects what would cost money for nothing", () => {
    expect(normalizeBdMobile("01212345678")).toBeNull(); // dead prefix
    expect(normalizeBdMobile("0171234567")).toBeNull(); // too short
    expect(normalizeBdMobile("017123456789")).toBeNull(); // too long
    expect(normalizeBdMobile("+44 7700 900000")).toBeNull(); // not Bangladeshi
    expect(normalizeBdMobile("")).toBeNull();
    expect(normalizeBdMobile(null)).toBeNull();
  });

  it("formats for display without changing what it means", () => {
    expect(formatBdMobile("01712345678")).toBe("+880 1712-345678");
    expect(formatBdMobile("nonsense")).toBeNull();
  });
});

describe("Bangladesh geography", () => {
  it("knows the districts of a division", () => {
    expect(districtNamesOf("Dhaka")).toContain("Dhaka");
    expect(districtNamesOf("Khulna")).toContain("Khulna");
    expect(districtNamesOf("Nowhere")).toEqual([]);
  });

  it("accepts a real division/district/upazila triple", () => {
    const upazilas = upazilasOf("Dhaka", "Dhaka");
    expect(upazilas.length).toBeGreaterThan(0);
    expect(
      isValidLocation({ division: "Dhaka", district: "Dhaka", upazila: upazilas[0] }),
    ).toBe(true);
  });

  it("rejects a district that belongs to another division", () => {
    expect(isValidLocation({ division: "Dhaka", district: "Khulna", upazila: null })).toBe(
      false,
    );
  });

  it("rejects an invented place", () => {
    expect(
      isValidLocation({ division: "Atlantis", district: "Atlantis", upazila: null }),
    ).toBe(false);
  });
});

describe("CSV import", () => {
  it("reads a plain file", () => {
    expect(parseCsv("email,marks\na@b.com,90\nc@d.com,80")).toEqual([
      ["email", "marks"],
      ["a@b.com", "90"],
      ["c@d.com", "80"],
    ]);
  });

  it("honours quoted fields containing commas, quotes and newlines", () => {
    const text = 'name,note\n"Hasan, Rafiul","said ""hi""\nthen left"';
    expect(parseCsv(text)).toEqual([
      ["name", "note"],
      ["Hasan, Rafiul", 'said "hi"\nthen left'],
    ]);
  });

  it("survives what spreadsheets actually produce", () => {
    // BOM, CRLF line endings, and trailing blank lines.
    const excel = "﻿email,marks\r\na@b.com,90\r\n\r\n";
    expect(parseCsv(excel)).toEqual([
      ["email", "marks"],
      ["a@b.com", "90"],
    ]);
  });

  it("keeps a final row that has no trailing newline", () => {
    expect(parseCsv("a,b")).toEqual([["a", "b"]]);
  });

  it("matches headers regardless of case, spacing or punctuation", () => {
    const index = headerIndex(["E-Mail Address", " Total_Marks "]);
    expect(findColumn(index, ["emailaddress"])).toBe(0);
    expect(findColumn(index, ["totalmarks"])).toBe(1);
    expect(findColumn(index, ["nothing"])).toBeUndefined();
  });

  it("takes the first alias that matches, so callers control precedence", () => {
    const index = headerIndex(["marks", "score"]);
    expect(findColumn(index, ["score", "marks"])).toBe(1);
  });
});

describe("medals", () => {
  it("names each medal the way a certificate should read", () => {
    expect(medalLabel("GOLD")).toBe("Gold Medal");
    expect(medalLabel("SILVER")).toBe("Silver Medal");
    expect(medalLabel("BRONZE")).toBe("Bronze Medal");
    expect(medalLabel("HONOURABLE_MENTION")).toBe("Honourable Mention");
  });
});

describe("rate limiting", () => {
  it("buckets an email without storing it", () => {
    const bucket = emailBucket("login", "Rafiul@Example.com");
    expect(bucket).not.toContain("Rafiul");
    expect(bucket).not.toContain("example.com");
    expect(bucket).toMatch(/^login:email:[a-f0-9]{32}$/);
  });

  it("buckets the same address the same way regardless of case", () => {
    expect(emailBucket("login", "a@b.com")).toBe(emailBucket("login", "A@B.COM"));
  });

  it("keeps different prefixes and different people apart", () => {
    expect(emailBucket("login", "a@b.com")).not.toBe(emailBucket("reset", "a@b.com"));
    expect(emailBucket("login", "a@b.com")).not.toBe(emailBucket("login", "c@d.com"));
  });

  it("phrases the wait in units a person would use", () => {
    expect(retryAfterMessage(1)).toContain("1 second.");
    expect(retryAfterMessage(45)).toContain("45 seconds.");
    expect(retryAfterMessage(600)).toContain("10 minutes.");
    expect(retryAfterMessage(61)).toContain("61 seconds.");
  });
});

describe("site settings registry", () => {
  it("gives every setting a unique key", () => {
    const keys = SETTINGS.map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("falls back to the shipped default when a row is missing", () => {
    const email = SETTINGS.find((s) => s.key === "contact.email")!;
    expect(decodeSetting(email, undefined)).toBe("bdaio@bdosn.org");
    expect(decodeSetting(email, "someone@else.org")).toBe("someone@else.org");
  });

  it("decodes booleans, treating anything that is not 'true' as off", () => {
    const toggle = SETTINGS.find((s) => s.key === "signup.enabled")!;
    expect(decodeSetting(toggle, "true")).toBe(true);
    expect(decodeSetting(toggle, "false")).toBe(false);
    expect(decodeSetting(toggle, "yes")).toBe(false);
    expect(decodeSetting(toggle, undefined)).toBe(true); // ships enabled
  });

  function form(overrides: Record<string, string> = {}) {
    return Object.fromEntries(
      SETTINGS.map((s) => [s.key, overrides[s.key] ?? (s.type === "boolean" ? "" : "")]),
    );
  }

  it("accepts a form where every optional field is blank", () => {
    expect(settingsFormSchema.safeParse(form()).success).toBe(true);
  });

  it("refuses a link that is not http(s) — a stored XSS is not a social link", () => {
    for (const bad of ["javascript:alert(1)", "data:text/html,x", "example.com"]) {
      const result = settingsFormSchema.safeParse(form({ "social.facebook": bad }));
      expect(result.success, bad).toBe(false);
    }
  });

  it("accepts a real URL and a real email", () => {
    const result = settingsFormSchema.safeParse(
      form({ "social.facebook": "https://facebook.com/bdaio", "contact.email": "a@b.org" }),
    );
    expect(result.success).toBe(true);
  });

  it("refuses a malformed email address", () => {
    expect(settingsFormSchema.safeParse(form({ "contact.email": "not-an-email" })).success).toBe(
      false,
    );
  });

  it("reads an unchecked checkbox as off rather than as missing", () => {
    const parsed = settingsFormSchema.parse(form());
    expect(parsed["signup.enabled"]).toBe("false");
    const on = settingsFormSchema.parse(form({ "signup.enabled": "on" }));
    expect(on["signup.enabled"]).toBe("true");
  });
});

describe("sponsor tiers", () => {
  it("gives every tier a heading and a column count", () => {
    for (const tier of SPONSOR_TIERS) {
      expect(TIER_LABELS[tier], tier).toBeTruthy();
      expect(TIER_COLUMNS[tier], tier).toBeGreaterThan(0);
    }
  });

  it("lists each tier once", () => {
    expect(new Set(SPONSOR_TIERS).size).toBe(SPONSOR_TIERS.length);
  });
});

describe("meta descriptions", () => {
  it("collapses whitespace and leaves short text alone", () => {
    expect(metaDescription("  a   b \n c ")).toBe("a b c");
  });

  it("truncates to something a search engine will display", () => {
    const long = "x".repeat(400);
    const out = metaDescription(long)!;
    expect(out.length).toBeLessThanOrEqual(155);
    expect(out.endsWith("…")).toBe(true);
  });

  it("returns undefined rather than an empty string", () => {
    expect(metaDescription("")).toBeUndefined();
    expect(metaDescription(null)).toBeUndefined();
    expect(metaDescription("   ")).toBeUndefined();
  });
});
