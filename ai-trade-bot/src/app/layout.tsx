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
  title: "AI Trade Bot - Soroswap Integration",
  description: "Trading automatizado con swaps reales usando Soroswap API en Stellar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
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
