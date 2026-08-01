import type { Metadata } from "next";
import { HeroSection, IntroSection, MissionSection } from "@/components/HomeSections";
import { CelebrationSection } from "@/components/CelebrationSection";
import { SponsorsSection } from "@/components/Sponsors";
import { JourneySection } from "@/components/JourneySection";
import { SITE_TITLE, pageMetadata } from "@/lib/seo";
import { DESCRIPTION } from "@/lib/rootMetadata";

export async function generateMetadata(
  { params }: PageProps<"/[locale]">,
): Promise<Metadata> {
  const { locale } = await params;
  // Title and description match the site defaults; this exists so the home page
  // has exactly one canonical address per language, with hreflang pairs.
  return pageMetadata({
    locale,
    path: "/",
    title: SITE_TITLE,
    description: DESCRIPTION,
  });
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CelebrationSection />
      <IntroSection />
      <MissionSection />
      <JourneySection />
      <SponsorsSection />
    </>
  );
}
