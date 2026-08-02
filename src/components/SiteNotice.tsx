import type { Locale } from "@/lib/i18n/config";

/**
 * The site-wide notice bar: one line above the header on every public page,
 * switched on and written from `/admin/settings`.
 *
 * Deliberately not dismissible. A strip an organiser turns on for "the deadline
 * moved to Friday" is worth interrupting for, and a dismiss button would need
 * client state to remember the choice — at which point the visitor who dismissed
 * it never sees the next one. Announcements are the place for things that can
 * wait to be read.
 *
 * Falls back to the English text when the Bengali translation has not been
 * filled in, because a blank bar is worse than an untranslated one.
 */
export function SiteNotice({
  locale,
  text,
  textBn,
}: {
  locale: Locale;
  text: string;
  textBn: string;
}) {
  const bengali = locale === "bn" && Boolean(textBn);
  const message = bengali ? textBn : text;
  if (!message) return null;

  return (
    <div role="status" className="bg-bdaio-blue text-white">
      <p
        className={`mx-auto max-w-7xl px-4 py-2 text-center text-sm font-medium sm:px-6 lg:px-8 ${
          bengali ? "font-bengali" : ""
        }`}
      >
        {message}
      </p>
    </div>
  );
}
