import { notFound } from "next/navigation";
import { Inter } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SiteNotice } from "@/components/SiteNotice";
import { Analytics } from "@/components/Analytics";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { ServiceWorker } from "@/components/ServiceWorker";
import { JsonLd } from "@/components/JsonLd";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { getSettings, socialLinks } from "@/lib/settings";
import { rootMetadata, rootViewport } from "@/lib/rootMetadata";
import { LOCALES, LOCALE_HREFLANG, getDictionary, isLocale } from "@/lib/i18n";
import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = rootMetadata;
export const viewport = rootViewport;

/**
 * The revalidation floor for every public route.
 *
 * This layout reads `getSettings()` — the site notice, contact address, footer
 * social links — so every page beneath it is database-backed whether its own
 * code touches the database or not. Without this the pages would prerender as
 * `○ (Static)` and those settings would **freeze until the next deploy**, which
 * is the §3.4 trap docs/OPS.md warns about: an organiser turns the notice bar on
 * and nothing happens.
 *
 * Next takes the *lowest* `revalidate` across a route's layout and page, so this
 * is a ceiling, not an override: the pages that already declare `60` keep it,
 * and a page needing fresher data can ask for less. Reading a cookie still opts
 * a page out entirely, which is why `/login`, `/register` and the pages that
 * show enrolment state stay `ƒ (Dynamic)` — correctly, since they personalise.
 */
export const revalidate = 60;

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = "en";

  const [t, settings] = await Promise.all([
    Promise.resolve(getDictionary(locale)),
    getSettings(),
  ]);
  const social = socialLinks(settings);

  return (
    <html
      lang={LOCALE_HREFLANG[locale]}
      data-scroll-behavior="smooth"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* Site-wide structured data. Page-level entities (Event, Person,
            EducationalOrganization) are added by the pages themselves. */}
        <JsonLd
          data={organizationJsonLd({
            email: settings["contact.email"],
            sameAs: social.map((link) => link.url),
          })}
        />
        <JsonLd data={websiteJsonLd()} />
        {settings["site.noticeEnabled"] && (
          <SiteNotice
            locale={locale}
            type={String(settings["site.noticeType"] || "topbar")}
            title={String(settings["site.noticeTitle"] || "Announcement")}
            text={String(settings["site.notice"] || "")}
            url={String(settings["site.noticeUrl"] || "")}
          />
        )}
        <Header t={t} />
        <main className="site-main flex-1">{children}</main>
        <Footer locale={locale} t={t} social={social} />
        <Analytics />
        <GoogleAnalytics />
        <ServiceWorker />
      </body>
    </html>
  );
}
