import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { ScrollToTop } from "./ScrollToTop";

export function Footer({ locale, t }: { locale: Locale; t: Dictionary }) {
  // Rendered on the server, so the year is the server's — fine for a copyright
  // line, and it avoids a hydration mismatch from a client-side clock.
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer relative border-t py-8">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <p
          className={`text-sm font-semibold text-bdaio-gray tracking-tight ${
            locale === "bn" ? "font-bengali" : ""
          }`}
        >
          © {t.footer.copyright} {year}
        </p>
      </div>
      <ScrollToTop />
    </footer>
  );
}
