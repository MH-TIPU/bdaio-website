import type { Metadata } from "next";
import { HeroSection, IntroSection, MissionSection } from "@/components/HomeSections";
import { CelebrationSection } from "@/components/CelebrationSection";
import { SponsorsSection } from "@/components/Sponsors";
import { JourneySection } from "@/components/JourneySection";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  // Title and description come from the root layout; the canonical URL is set
  // here so the home page has exactly one address in search results.
  alternates: { canonical: absoluteUrl("/") },
};

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
