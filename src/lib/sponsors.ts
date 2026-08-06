import type { SponsorTier } from "@/generated/prisma/enums";

/**
 * The sponsor tiers, in the order their sections appear on the home page.
 *
 * The enum fixes the set; this fixes the running order and the heading each one
 * renders under. Both the public page and the admin form read from here, so a
 * new tier is one edit rather than three that can disagree.
 */
export const SPONSOR_TIERS = [
  "ORGANIZER",
  "PLATINUM",
  "POWERED_BY",
  "GOLD",
  "SILVER",
  "BRONZE",
  "KNOWLEDGE",
  "TV",
  "PARTNER",
  "MAGAZINE",
  "VENUE",
] as const satisfies readonly SponsorTier[];

/** The heading shown above the tier's logos. */
export const TIER_LABELS: Record<SponsorTier, string> = {
  ORGANIZER: "Organizer",
  PLATINUM: "Platinum Sponsor & National Host",
  POWERED_BY: "Powered By Sponsor",
  GOLD: "Gold Sponsor",
  SILVER: "Silver Sponsors",
  BRONZE: "Bronze Sponsor",
  KNOWLEDGE: "Knowledge Partner",
  TV: "TV Partner",
  PARTNER: "Partners",
  MAGAZINE: "Magazine Partners",
  VENUE: "Regional Venue Partners",
};

/**
 * How much room a tier's logos get.
 *
 * The tiers exist to express a hierarchy, and every logo at the same size would
 * flatten it — the organiser would read the same as the ninth venue partner.
 * Size carries that now: the tiers all sit on one wrapping line, so a bigger box
 * is what makes a headline sponsor look like one.
 *
 * **This must never increase down the list.** It is the whole visual ranking:
 * read top to bottom in `SPONSOR_TIERS` order, the logos get smaller and never
 * larger, so where a sponsor sits in the order is legible at a glance without
 * reading a single label. A test holds that.
 */
export type TierSize = "xl" | "lg" | "md" | "sm" | "xs";

/** Largest first — the index into this is what "monotonic" is measured against. */
export const TIER_SIZE_ORDER: TierSize[] = ["xl", "lg", "md", "sm", "xs"];

export const TIER_SIZE: Record<SponsorTier, TierSize> = {
  ORGANIZER: "xl",
  PLATINUM: "xl",
  POWERED_BY: "lg",
  GOLD: "lg",
  SILVER: "md",
  BRONZE: "md",
  KNOWLEDGE: "md",
  TV: "md",
  PARTNER: "sm",
  MAGAZINE: "sm",
  VENUE: "xs",
};
