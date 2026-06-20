import type { Metadata } from "next";
import { Inter, Hind_Siliguri } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const hindSiliguri = Hind_Siliguri({
  variable: "--font-hind-siliguri",
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Bangladesh Artificial Intelligence Olympiad (BdAIO)",
    template: "%s | BdAIO",
  },
  description:
    "BdAIO is the national AI Olympiad for Bangladeshi students — a pathway to international competitions like IOAI and IAIO.",
  keywords: ["BdAIO", "AI Olympiad", "Bangladesh", "Artificial Intelligence", "IOAI", "IAIO"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${hindSiliguri.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
