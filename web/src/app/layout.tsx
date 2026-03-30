import type { Metadata } from "next";
import { Orbitron, Share_Tech_Mono } from "next/font/google";
import "./globals.css";
import { Web3Providers } from "@/components/Web3Providers";

const display = Orbitron({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const bodyMono = Share_Tech_Mono({
  variable: "--font-body-mono",
  subsets: ["latin"],
  weight: "400",
});

const baseAppId = process.env.NEXT_PUBLIC_BASE_APP_ID;

export const metadata: Metadata = {
  title: "Neon Stratego · Base",
  description: "Cyberpunk Stratego vs AI — Base check-in",
  other: baseAppId ? { "base:app_id": baseAppId } : {},
  icons: { icon: "/app-icon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${bodyMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--bg-deep)] font-[family-name:var(--font-body-mono)] text-white">
        <Web3Providers>{children}</Web3Providers>
      </body>
    </html>
  );
}
