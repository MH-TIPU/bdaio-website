/**
 * Paths to artwork that ships in `public/`.
 *
 * What is left here is design, not content: the hero art and the brand mark,
 * which change when the site is redesigned. The sponsor logos below are **seed
 * data** — the home page reads `Sponsor` rows and their `MediaAsset` logos, and
 * `prisma/seed.ts` imports these files into that library once. Changing who
 * sponsors us is `/admin/sponsors`, not this file.
 */
export const heroMedia = {
  heroBanner: "/media/2026/06/apoai-gold-2026.jpg",
  ioaiBronze: "/media/2026/08/ioai-bronze-2026.jpg",
  regionalRound: "/media/2026/05/WhatsApp-Image-2026-04-29-at-17.05.14.jpeg",
  campaignPoster: "/media/2026/04/popup_banner-02.jpg",
  brainBackground: "/media/2026/03/hero-bg.jpg",
};

/**
 * The hero carousel, in the order it rotates.
 *
 * **Add a banner by adding an entry here** — the file goes in `public/media/`
 * under the year and month it belongs to, and `alt` describes what the artwork
 * says, because that text is all a screen reader gets from it.
 *
 * Order matters twice over: the first entry is the one prerendered into the
 * page and the LCP element on the busiest page of the site, so it should be the
 * banner that matters most. A single entry is a valid list — the carousel drops
 * its timer and controls and renders a plain image, so removing banners never
 * leaves a one-slide carousel rotating against itself.
 */
export const heroSlides: readonly { src: string; alt: string }[] = [
  {
    src: heroMedia.heroBanner,
    alt: "Bangladesh won 3 gold medals at the Asia-Pacific Olympiad in Artificial Intelligence 2026: Shaidozzaman Araf, Labib Shahriar and Tridib Roy Arjo.",
  },
  {
    src: heroMedia.ioaiBronze,
    alt: "Bangladesh took bronze at the International Olympiad in Artificial Intelligence 2026.",
  },
];

export const brandMedia = {
  bdaioLogo: "/media/2026/03/bdaio-logo-.png",
  bdosnLogo: "/media/2026/04/bdosn_logo.jpg",
  bubtLogo: "/media/2026/03/partners-01.png",
  brainStation23: "/media/2026/03/partners-02.png",
  reveChat: "/media/2026/03/partners-03.png",
  millionx: "/media/2026/04/millionx-logo.png",
  creativeIt: "/media/2026/04/LOGOS_creative_it-02.png",
  bitna: "/media/2026/04/WhatsApp_Image_2026-04-16_at_18.46.00-removebg-preview.png",
  iitDhaka: "/media/2026/03/partners-04.png",
  deeptoTv: "/media/2026/04/Logo_of_Deepto_TV.png",
  rokomari: "/media/2026/04/logo_rokomari-01.png",
  jadupc: "/media/2026/04/jadupc-logo.png",
  spsb: "/media/2026/04/LOGOS-02.png",
  ciu: "/media/2026/04/CIU-Logo.png",
  kuet: "/media/2026/04/KUET-Logo.png",
  rajshahiCollege: "/media/2026/04/RC_logo.png",
  kishorAlo: "/media/2026/06/kishor-alo.png",
  bigganChinta: "/media/2026/06/biggan-chinta.png",
};

export const galleryMedia = [
  {
    src: "/media/2025/03/Blue-and-Purple-Modern-Artificial-Intelligence-Project-Presentation.jpg",
    alt: "AI project presentation poster",
  },
  {
    src: "/media/2025/03/6x3-Banner-For-workshop-3.png",
    alt: "Workshop banner",
  },
  {
    src: "/media/2025/03/WhatsApp-Image-2025-03-05-at-2.54.39-PM-1.jpeg",
    alt: "Workshop photo banner",
  },
  {
    src: "/media/2025/03/WhatsApp-Image-2025-03-16-at-1.28.04-PM-1.jpeg",
    alt: "AI session poster",
  },
  {
    src: "/media/2025/03/9459fcea-0b82-4a37-85a5-f14339344599-1.jpeg",
    alt: "AI class poster",
  },
  {
    src: "/media/2026/04/community_competition.jpg",
    alt: "Community designed competitions poster",
  },
];
