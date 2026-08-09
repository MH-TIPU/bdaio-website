/**
 * The page shell every public page shares.
 *
 * Widths used to be chosen per page — 2xl, 3xl, 4xl, 5xl, 7xl all appeared — so
 * a list page could sit in a 1024px column on a 2000px screen with several
 * hundred pixels of nothing either side, and the site's edges moved as you
 * navigated. One shell, so the content starts and ends in the same place on
 * every page.
 */
export const PAGE = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";

/**
 * A readable column for running prose inside the shell.
 *
 * The shell is as wide as the design allows; a paragraph should not be. Past
 * roughly 75 characters a line is measurably harder to track back from, so body
 * copy gets this and the grids around it get the full width.
 */
export const PROSE = "max-w-3xl";

/**
 * Forms and single-purpose pages that are *meant* to be narrow.
 *
 * A sign-up form stretched to 1280px is worse, not better: the eye has to
 * travel from a label on the far left to a field on the far right. Kept as a
 * named constant so "narrow here" reads as a decision rather than an oversight.
 */
export const PAGE_NARROW = "mx-auto w-full max-w-2xl px-4 sm:px-6 lg:px-8";
