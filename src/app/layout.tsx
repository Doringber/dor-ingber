import type { Metadata } from "next";
import { Geist, Geist_Mono, Heebo, Instrument_Serif } from "next/font/google";
import { Grain } from "@/components/grain";
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

export const metadata: Metadata = {
  title: {
    default: "Dor Ingber",
    template: "%s · Dor Ingber",
  },
  description: "AI films and notes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrument.variable} ${heebo.variable}`}
    >
      <body>
        <Grain />
        {children}
      </body>
    </html>
  );
}
