import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/contexts/WalletContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZENTRADE - AI Trading Bot | Meridian Hackathon 2025",
  description: "Plataforma de trading automatizado con swaps reales e integración multi-protocolo en Stellar. Soroswap + Soroban + AI para el Composability Track.",
  keywords: ["ZENTRADE", "AI Trading", "Stellar", "Soroswap", "Soroban", "DeFi", "Meridian Hackathon", "Crypto Trading", "Blockchain"],
  authors: [{ name: "ZENTRADE Team" }],
  creator: "ZENTRADE",
  publisher: "ZENTRADE",
  robots: "index, follow",
  icons: {
    icon: [
      { url: "/LOGOZZ.png", sizes: "32x32", type: "image/png" },
      { url: "/LOGOZZ.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/LOGOZZ.png",
    shortcut: "/LOGOZZ.png",
  },
  openGraph: {
    title: "ZENTRADE - AI Trading Bot",
    description: "Plataforma de trading automatizado con integración multi-protocolo en Stellar",
    url: "https://zentrade.io",
    siteName: "ZENTRADE",
    images: [
      {
        url: "/LOGOZZ.png",
        width: 1200,
        height: 630,
        alt: "ZENTRADE AI Trading Bot",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZENTRADE - AI Trading Bot",
    description: "Plataforma de trading automatizado con integración multi-protocolo en Stellar",
    images: ["/LOGOZZ.png"],
    creator: "@zentrade_ai",
  },
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#10B981",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/LOGOZZ.png" />
        <link rel="apple-touch-icon" href="/LOGOZZ.png" />
        <meta name="theme-color" content="#10B981" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ZENTRADE" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-brazil-black text-brazil-white min-h-screen`}
      >
        <WalletProvider>
          <div className="min-h-screen bg-gradient-to-br from-brazil-black via-brazil-gray to-brazil-green">
            {children}
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}
