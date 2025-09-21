'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Home, 
  ArrowUpDown, 
  BarChart3, 
  Wallet
} from 'lucide-react';

const menuItems = [
  {
    name: 'Home',
    href: '/',
    icon: Home
  },
  {
    name: 'Swaps',
    href: '/swaps',
    icon: ArrowUpDown
  },
  {
    name: 'Trading',
    href: '/trading',
    icon: BarChart3
  },
  {
    name: 'Wallet',
    href: '/wallet',
    icon: Wallet
  }
];

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-lg border-t border-gray-700/50">
      <div className="max-w-md mx-auto px-4 py-2">
        <div className="flex justify-around">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex-1"
              >
                <motion.div
                  className={`flex flex-col items-center space-y-1 p-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{item.name}</span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
