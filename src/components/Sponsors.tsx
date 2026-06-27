import Image from "next/image";
import { brandMedia } from "@/data/media";

type SponsorItem = {
  label: string;
  name: string;
  logo: string;
};

export const sponsorBarItems: SponsorItem[] = [
  { label: "Organizer", name: "BDOSN", logo: brandMedia.bdosnLogo },
  { label: "Platinum Sponsor", name: "BUBT", logo: brandMedia.bubtLogo },
  { label: "Powered By", name: "REVE Chat", logo: brandMedia.reveChat },
  { label: "Gold Sponsor", name: "Brain Station 23", logo: brandMedia.brainStation23 },
  { label: "Silver Sponsor", name: "MillionX", logo: brandMedia.millionx },
  { label: "Silver Sponsor", name: "Creative IT", logo: brandMedia.creativeIt },
  { label: "Bronze Sponsor", name: "BITNA", logo: brandMedia.bitna },
  { label: "Knowledge Partner", name: "IIT, DU", logo: brandMedia.iitDhaka },
];

function SponsorLogo({ src, alt, name }: { src?: string; alt: string; name: string }) {
  if (!src) {
    return (
      <div className="flex h-16 w-full items-center justify-center rounded-xl border border-slate-100 bg-white px-4 text-center text-xs font-bold text-slate-500 shadow-sm">
        {name}
      </div>
    );
  }

  return (
    <div className="group relative flex h-20 w-full items-center justify-center rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-400 hover:shadow-md">
      <div className="relative h-full w-full">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </div>
    </div>
  );
}

export function SponsorBar() {
  return (
    <section className="border-y border-slate-150 bg-slate-50/50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="mb-6 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
          Partnered & Supported By
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8 items-center">
          {sponsorBarItems.map((item) => (
            <div key={item.name} className="flex flex-col items-center">
              <span className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {item.label}
              </span>
              <div className="relative flex h-14 w-full items-center justify-center rounded-lg border border-slate-200/60 bg-white p-2 shadow-xs transition hover:scale-105">
                <Image
                  src={item.logo}
                  alt={`${item.name} Logo`}
                  fill
                  className="object-contain p-1"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SponsorsSection() {
  return (
    <section className="bg-slate-50/70 py-20 border-t border-slate-100">
      <div className="mx-auto max-w-7xl space-y-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-black text-[#1e5a8a]">Official Sponsors & Partners</h2>
          <p className="mt-2 text-slate-500">Supporting the AI talent of Bangladesh</p>
        </div>

        {/* Organizer */}
        <div className="mx-auto max-w-xs text-center">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-blue-500">Organizer</h3>
          <SponsorLogo name="BDOSN" alt="BDOSN logo" src={brandMedia.bdosnLogo} />
        </div>

        {/* Platinum + Powered By */}
        <div className="grid gap-8 sm:grid-cols-2 max-w-2xl mx-auto">
          <div className="text-center">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-blue-500">
              Platinum Sponsor & National Host
            </h3>
            <SponsorLogo name="BUBT" alt="BUBT logo" src={brandMedia.bubtLogo} />
          </div>
          <div className="text-center">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-blue-500">
              Powered By Sponsor
            </h3>
            <SponsorLogo name="REVE Chat" alt="REVE Chat logo" src={brandMedia.reveChat} />
          </div>
        </div>

        {/* Gold / Silver / Bronze */}
        <div className="grid gap-8 sm:grid-cols-3 max-w-4xl mx-auto">
          <div className="text-center">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-blue-500">Gold Sponsor</h3>
            <SponsorLogo name="BRAIN STATION 23" alt="Brain Station 23 logo" src={brandMedia.brainStation23} />
          </div>
          <div className="text-center">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-blue-500">Silver Sponsors</h3>
            <div className="grid grid-cols-2 gap-4">
              <SponsorLogo name="MillionX Bangladesh" alt="MillionX logo" src={brandMedia.millionx} />
              <SponsorLogo name="Creative IT Institute" alt="Creative IT logo" src={brandMedia.creativeIt} />
            </div>
          </div>
          <div className="text-center">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-blue-500">Bronze Sponsor</h3>
            <SponsorLogo name="BITNA" alt="BITNA logo" src={brandMedia.bitna} />
          </div>
        </div>

        {/* Partners */}
        <div className="grid gap-8 sm:grid-cols-3 max-w-4xl mx-auto">
          <div className="text-center">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-blue-500">Knowledge Partner</h3>
            <SponsorLogo name="IIT University of Dhaka" alt="IIT DU logo" src={brandMedia.iitDhaka} />
          </div>
          <div className="text-center">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-blue-500">TV Partner</h3>
            <SponsorLogo name="DEEPTO TV" alt="Deepto TV logo" src={brandMedia.deeptoTv} />
          </div>
          <div className="text-center">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-blue-500">Partners</h3>
            <div className="grid grid-cols-3 gap-2">
              <SponsorLogo name="SPSB" alt="SPSB logo" src={brandMedia.spsb} />
              <SponsorLogo name="Rokomari.com" alt="Rokomari logo" src={brandMedia.rokomari} />
              <SponsorLogo name="JaduPC" alt="JaduPC logo" src={brandMedia.jadupc} />
            </div>
          </div>
        </div>

        {/* Magazine Partners */}
        <div className="text-center">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-blue-500">
            Magazine Partners
          </h3>
          <div className="flex justify-center gap-4 max-w-4xl mx-auto">
            <div className="w-32">
              <SponsorLogo name="Kishor Alo" alt="Kishor Alo logo" src={brandMedia.kishorAlo} />
            </div>
            <div className="w-32">
              <SponsorLogo name="Biggan Chinta" alt="Biggan Chinta logo" src={brandMedia.bigganChinta} />
            </div>
          </div>
        </div>

        {/* Regional Venue Partners */}
        <div className="text-center">
          <h3 className="mb-6 text-xs font-bold uppercase tracking-widest text-blue-500">
            Regional Venue Partners
          </h3>
          <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
            <div className="w-32"><SponsorLogo name="BUBT" alt="BUBT logo" src={brandMedia.bubtLogo} /></div>
            <div className="w-32"><SponsorLogo name="CIU" alt="CIU logo" src={brandMedia.ciu} /></div>
            <div className="w-32"><SponsorLogo name="IIT DU" alt="IIT DU logo" src={brandMedia.iitDhaka} /></div>
            <div className="w-32"><SponsorLogo name="KUET" alt="KUET logo" src={brandMedia.kuet} /></div>
            <div className="w-32"><SponsorLogo name="Rajshahi College" alt="Rajshahi College logo" src={brandMedia.rajshahiCollege} /></div>
          </div>
        </div>
      </div>
    </section>
  );
}
