import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { SettingKey } from "@/lib/settings/registry";
import { ScrollToTop } from "./ScrollToTop";

/**
 * Brand glyphs, keyed by the social setting they belong to.
 *
 * Inline rather than an icon package: five paths do not justify a dependency,
 * and a footer icon that arrives with the page beats one that pops in later.
 */
const ICONS: Record<string, string> = {
  "social.facebook":
    "M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.52 1.5-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.9h-2.33V22c4.78-.79 8.44-4.94 8.44-9.94Z",
  "social.youtube":
    "M21.58 7.19a2.5 2.5 0 0 0-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42A2.5 2.5 0 0 0 2.42 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .42 4.81 2.5 2.5 0 0 0 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42a2.5 2.5 0 0 0 1.77-1.77A26 26 0 0 0 22 12a26 26 0 0 0-.42-4.81ZM10 15.02V8.98L15.2 12 10 15.02Z",
  "social.linkedin":
    "M6.94 5a1.94 1.94 0 1 1-3.88 0 1.94 1.94 0 0 1 3.88 0ZM3.2 8.4h3.6V21H3.2V8.4Zm6.03 0h3.45v1.72h.05c.48-.9 1.65-1.86 3.4-1.86 3.63 0 4.3 2.35 4.3 5.4V21h-3.6v-6.44c0-1.54-.03-3.51-2.16-3.51-2.16 0-2.49 1.67-2.49 3.4V21H9.23V8.4Z",
  "social.x": "M17.53 3h3.2l-7 8 8.23 10h-6.45l-5.05-6.2L4.2 21H1l7.5-8.57L.6 3h6.6l4.57 5.7L17.53 3Zm-1.12 16.1h1.77L7.1 4.8H5.2l11.2 14.3Z",
  "social.github":
    "M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.34 1.09 2.91.83.09-.65.35-1.1.63-1.35-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.85-2.34 4.7-4.57 4.94.36.31.68.92.68 1.85v2.75c0 .26.18.58.69.48A10 10 0 0 0 12 2Z",
};

export function Footer({
  locale,
  t,
  social,
}: {
  locale: Locale;
  t: Dictionary;
  social: { key: SettingKey; label: string; url: string }[];
}) {
  // Rendered on the server, so the year is the server's — fine for a copyright
  // line, and it avoids a hydration mismatch from a client-side clock.
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer relative border-t py-8">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        {social.length > 0 && (
          <nav aria-label={t.footer.followUs} className="mb-5 flex justify-center gap-3">
            {social.map((link) => (
              <a
                key={link.key}
                href={link.url}
                // These are our own accounts, but they are still off-site, and
                // `noopener` is what stops the opened tab reaching back here.
                target="_blank"
                rel="me noopener noreferrer"
                className="rounded-full p-2 text-bdaio-gray transition-colors hover:bg-slate-100 hover:text-bdaio-blue"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
                  <path d={ICONS[link.key]} />
                </svg>
                <span className="sr-only">{link.label}</span>
              </a>
            ))}
          </nav>
        )}

        <p className="text-sm font-semibold text-bdaio-gray tracking-tight">
          © {t.footer.copyright} {year}
        </p>
      </div>
      <ScrollToTop />
    </footer>
  );
}
