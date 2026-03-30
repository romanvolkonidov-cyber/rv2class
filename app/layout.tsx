import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@excalidraw/excalidraw/index.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RV2Class - Video Tutoring Platform",
  description: "Professional English tutoring with real-time video, screen sharing, and collaborative whiteboard",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icon-192.svg", type: "image/svg+xml" },
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,  // Allow pinch-to-zoom for better mobile experience
  userScalable: true,  // Enable user scaling
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
