import type { Metadata } from "next";
import { HeroSection, IntroSection, MissionSection } from "@/components/HomeSections";
import { CelebrationSection } from "@/components/CelebrationSection";
import { SponsorsSection } from "@/components/Sponsors";
import { JourneySection } from "@/components/JourneySection";
import { SITE_TITLE, pageMetadata } from "@/lib/seo";
import { DESCRIPTION } from "@/lib/rootMetadata";
import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/lib/i18n";

import { getSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    locale: "en",
    path: "/",
    title: SITE_TITLE,
    description: DESCRIPTION,
  });
}

export default async function HomePage() {
  const locale = "en";
  const [settings, t] = await Promise.all([
    getSettings(),
    getDictionary(locale).pages.home,
  ]);

  return (
    <>
      <HeroSection t={t} />
      <CelebrationSection t={t} enabled={Boolean(settings["site.confettiEnabled"])} />
      <IntroSection t={t} />
      <MissionSection t={t} />
      <JourneySection t={t} />
      <SponsorsSection locale={locale} />
    </>
  );
}
