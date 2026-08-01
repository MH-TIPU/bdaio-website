import { notFound } from "next/navigation";
import { Inter, Hind_Siliguri } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Analytics } from "@/components/Analytics";
import { ServiceWorker } from "@/components/ServiceWorker";
import { JsonLd } from "@/components/JsonLd";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { rootMetadata, rootViewport } from "@/lib/rootMetadata";
import { LOCALES, LOCALE_HREFLANG, getDictionary, isLocale } from "@/lib/i18n";
import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const hindSiliguri = Hind_Siliguri({
  variable: "--font-hind-siliguri",
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = rootMetadata;
export const viewport = rootViewport;

/**
 * Pre-renders both language trees at build time, which is the whole reason the
 * locale lives in the URL rather than in a cookie: these pages stay static.
 */
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

/**
 * Root layout for every public page.
 *
 * This is one of **two** root layouts — the authenticated tree has its own in
 * `(app)/layout.tsx`. They are separate because the locale reaches them
 * differently: here from the URL segment, which keeps these pages statically
 * rendered and gives Bengali its own indexable address; there from a cookie,
 * because those pages already render per session (§13.2).
 *
 * The cost of two roots is that crossing between the public site and the
 * dashboard is a full page load rather than a client navigation. That happens
 * once per sign-in, not while browsing, so it is a fair trade for keeping the
 * public site static.
 */
export default async function LocaleRootLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  // `/de/events` reaches here with an unsupported locale. 404 rather than fall
  // back silently, so a bad link is visible instead of pretending to work.
  if (!isLocale(locale)) notFound();

  const t = getDictionary(locale);

  return (
    <html
      lang={LOCALE_HREFLANG[locale]}
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${hindSiliguri.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* Site-wide structured data. Page-level entities (Event, Person,
            EducationalOrganization) are added by the pages themselves. */}
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <Header locale={locale} t={t} />
        <main className="site-main flex-1">{children}</main>
        <Footer locale={locale} t={t} />
        <Analytics />
        <ServiceWorker />
      </body>
    </html>
  );
}
