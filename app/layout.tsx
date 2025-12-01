import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { SoundProvider } from "./context/SoundContext";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EUPHORIA | Tech Intelligence System",
  description: "Advanced Tech News Intelligence Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistMono.variable} antialiased hex-pattern`}>
        <SoundProvider>
          {children}
        </SoundProvider>
      </body>
    </html>
  );
}
