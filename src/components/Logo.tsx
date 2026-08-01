import { Link } from "@/components/Link";
import Image from "next/image";
import { brandMedia } from "@/data/media";
import { DEFAULT_LOCALE, localePath, type Locale } from "@/lib/i18n/config";

export function Logo({
  className = "",
  locale = DEFAULT_LOCALE,
}: {
  className?: string;
  /** Keeps the home link in the reader's language. */
  locale?: Locale;
}) {
  return (
    <Link href={localePath(locale, "/")} className={`flex items-center ${className}`}>
      <div className="relative h-10 w-32 shrink-0 transition-transform hover:scale-102">
        <Image
          src={brandMedia.bdaioLogo}
          alt="BdAIO Logo"
          fill
          className="object-contain object-left"
          priority
        />
      </div>
    </Link>
  );
}
