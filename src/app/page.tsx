import { HeroSection, IntroSection, MissionSection } from "@/components/HomeSections";
import { CelebrationSection } from "@/components/CelebrationSection";
import { SponsorsSection } from "@/components/Sponsors";
import { JourneySection } from "@/components/JourneySection";

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
