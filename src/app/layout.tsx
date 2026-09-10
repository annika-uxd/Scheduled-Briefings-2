import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";

import { ToastViewport } from "@/components/ui/toast";
import { StoreProvider } from "@/lib/store";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/**
 * Stands in for GT Super Text, the display serif used on generated briefings in
 * Figma. Source Serif shares its transitional proportions and holds up at the
 * sizes the briefing document uses.
 */
const serifDisplay = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif-display",
  display: "swap",
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Scheduled Briefings · Handraise",
  description:
    "Configure recurring intelligence products and refine them with Herald.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${serifDisplay.variable}`}>
      <body>
        <StoreProvider>
          {children}
          <ToastViewport />
        </StoreProvider>
      </body>
    </html>
  );
}
