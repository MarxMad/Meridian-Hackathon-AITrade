'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@/contexts/WalletContext";
import { 
  Zap, 
  Settings,
  ChevronRight
} from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();
  const { isConnected, publicKey, disconnect, connect, isLoading } = useWallet();

  const navigationItems = [
    { href: "/", label: "Home" },
    { href: "/trading", label: "Trade" },
    { href: "/swaps", label: "Swaps" },
    { href: "/portfolio", label: "Portfolio" },
    { href: "/earn", label: "Earn" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/referral", label: "Referral" },
  ];

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-yellow-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-bold">ZenTrade</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors ${
                  pathname === item.href
                    ? 'text-white font-medium hover:text-purple-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="relative">
              <button className="text-gray-400 hover:text-white transition-colors flex items-center">
                More
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {isConnected ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-400">Fully Operational</span>
                </div>
                <div className="text-sm text-gray-300">
                  {publicKey?.slice(0, 8)}...{publicKey?.slice(-8)}
                </div>
                <button
                  onClick={disconnect}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connect}
                disabled={isLoading}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
              >
                {isLoading ? 'Conectando...' : 'Connect Wallet'}
              </button>
            )}
            
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
