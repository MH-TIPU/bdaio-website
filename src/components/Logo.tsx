import Link from "next/link";
import Image from "next/image";
import { brandMedia } from "@/data/media";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center ${className}`}>
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
