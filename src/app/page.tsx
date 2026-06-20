import { HeroSection, IntroSection, MissionSection } from "@/components/HomeSections";
import { SponsorsSection } from "@/components/Sponsors";
import { JourneySection } from "@/components/JourneySection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <IntroSection />
      <MissionSection />
      <JourneySection />
      <SponsorsSection />
    </>
  );
}
