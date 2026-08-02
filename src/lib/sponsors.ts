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
 * How wide the tier's logos are allowed to be.
 *
 * The old hand-built layout gave the organiser and the headline sponsors more
 * room than the long tail of partners, and losing that would flatten the
 * hierarchy the tiers exist to express. Kept as a column count per tier rather
 * than free-form markup so the sections stay uniform as sponsors come and go.
 */
export const TIER_COLUMNS: Record<SponsorTier, number> = {
  ORGANIZER: 1,
  PLATINUM: 1,
  POWERED_BY: 1,
  GOLD: 1,
  SILVER: 2,
  BRONZE: 1,
  KNOWLEDGE: 1,
  TV: 1,
  PARTNER: 3,
  MAGAZINE: 2,
  VENUE: 5,
};
