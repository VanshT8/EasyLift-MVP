import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EasyLift — Less waiting. More lifting.",
  description:
    "See gym equipment availability and find the best time to train for your workout. Demo with simulated data.",
};

export const viewport: Viewport = {
  themeColor: "#070c18",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      {/* Extensions like Grammarly add attributes to <body> before hydration. */}
      <body className="font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
