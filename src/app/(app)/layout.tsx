import { Inter } from "next/font/google";
import { Analytics } from "@/components/Analytics";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { ServiceWorker } from "@/components/ServiceWorker";
import { rootMetadata, rootViewport } from "@/lib/rootMetadata";
import { LOCALE_HREFLANG, getSessionLocale } from "@/lib/i18n";
import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = rootMetadata;
export const viewport = rootViewport;

import { Header } from "@/components/Header";
import { SiteNotice } from "@/components/SiteNotice";
import { getCurrentUser } from "@/lib/auth/dal";
import { getSettings } from "@/lib/settings";
import { getDictionary } from "@/lib/i18n";

export default async function AppRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getSessionLocale();
  const [user, settings] = await Promise.all([
    getCurrentUser(),
    getSettings(),
  ]);
  const t = getDictionary(locale);

  return (
    <html
      lang={LOCALE_HREFLANG[locale]}
      data-scroll-behavior="smooth"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {settings["site.noticeEnabled"] && (
          <SiteNotice
            locale={locale}
            type={String(settings["site.noticeType"] || "topbar")}
            title={String(settings["site.noticeTitle"] || "Announcement")}
            text={String(settings["site.notice"] || "")}
            url={String(settings["site.noticeUrl"] || "")}
          />
        )}
        <Header locale={locale} t={t} user={user} />
        <div className="flex-1">{children}</div>
        <Analytics />
        <GoogleAnalytics gaId="G-BG29QCBED1" />
        <ServiceWorker />
      </body>
    </html>
  );
}
