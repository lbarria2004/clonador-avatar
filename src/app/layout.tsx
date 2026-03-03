import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Avatar Studio - Create AI-Powered Avatar Videos",
  description: "Create stunning AI-powered avatar videos with customizable voices, scenarios, and styles. Upload your photo, write your script, and generate professional videos instantly.",
  keywords: ["AI Avatar", "Video Generator", "AI Video", "Avatar Creator", "TTS", "Text to Speech", "Video Production"],
  authors: [{ name: "AI Avatar Studio" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "AI Avatar Studio",
    description: "Create stunning AI-powered avatar videos",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Avatar Studio",
    description: "Create stunning AI-powered avatar videos",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
