import type { Metadata } from "next";
import {
  Frank_Ruhl_Libre,
  Geist,
  Geist_Mono,
  Heebo,
  Instrument_Serif,
} from "next/font/google";
import { Grain } from "@/components/grain";
import { KillOverlays } from "@/components/kill-overlays";
import { SpatialHome } from "@/components/spatial-home";
import { buildStations } from "@/lib/stations";
import { getWorks } from "@/lib/works";
import { getWriting } from "@/lib/writing";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument",
  display: "swap",
});

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
});

const frankRuhl = Frank_Ruhl_Libre({
  subsets: ["hebrew", "latin"],
  weight: ["400", "700"],
  variable: "--font-frank",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Dor Ingber",
    template: "%s · Dor Ingber",
  },
  description: "AI films and notes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const stations = buildStations(getWorks(), getWriting());

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrument.variable} ${heebo.variable} ${frankRuhl.variable}`}
    >
      <body>
        <Grain />
        <KillOverlays />
        <SpatialHome stations={stations} />
        {children}
      </body>
    </html>
  );
}
