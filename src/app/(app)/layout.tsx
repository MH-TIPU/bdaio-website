import { Inter, Hind_Siliguri } from "next/font/google";
import { Analytics } from "@/components/Analytics";
import { ServiceWorker } from "@/components/ServiceWorker";
import { rootMetadata, rootViewport } from "@/lib/rootMetadata";
import { LOCALE_HREFLANG, getSessionLocale } from "@/lib/i18n";
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
 * Root layout for the authenticated tree — the dashboard and the admin console.
 *
 * Separate from the public root because the locale comes from the cookie here,
 * not the URL. These pages read the session, so they are already `ƒ (Dynamic)`
 * and a cookie read costs nothing; and a link to one's own dashboard in a
 * particular language is not a thing anyone shares. Localizing by cookie avoids
 * doubling the authenticated route surface for no benefit (§13.2).
 *
 * No Header or Footer: `(dashboard)` and `(admin)` each supply their own
 * navigation chrome.
 */
export default async function AppRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getSessionLocale();

  return (
    <html
      lang={LOCALE_HREFLANG[locale]}
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${hindSiliguri.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <Analytics />
        <ServiceWorker />
      </body>
    </html>
  );
}
