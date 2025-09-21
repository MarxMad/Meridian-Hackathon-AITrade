'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';
import { useWallet } from '@/contexts/WalletContext';

const MobileNavigation = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isConnected, publicKey, walletName, connect, disconnect } = useWallet();

  const navItems = [
    { href: '/', label: 'Inicio', icon: '🏠' },
    { href: '/swaps', label: 'Swaps', icon: '🔄' },
    { href: '/trading', label: 'Trading', icon: '📊' },
    { href: '/prices', label: 'Precios', icon: '💰' },
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 relative">
              <Image
                src="/LOGOZZ.png"
                alt="ZENTRADE Logo"
                fill
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">ZENTRADE</h1>
              <p className="text-xs text-gray-500">AI Trading Bot</p>
            </div>
          </div>

          {/* Wallet Status & Menu Button */}
          <div className="flex items-center space-x-3">
            {/* Wallet Connection Status */}
            <div className="hidden sm:block">
              {isConnected ? (
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-700 font-medium">
                    {publicKey?.slice(0, 6)}...{publicKey?.slice(-4)}
                  </span>
                </div>
              ) : (
                <button
                  onClick={connect}
                  className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  Conectar
                </button>
              )}
            </div>

            {/* Menu Button */}
            <button
              onClick={toggleMenu}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <div className="w-6 h-6 flex flex-col justify-center space-y-1">
                <div className={`h-0.5 bg-gray-600 transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></div>
                <div className={`h-0.5 bg-gray-600 transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></div>
                <div className={`h-0.5 bg-gray-600 transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            onClick={toggleMenu}
          ></div>

          {/* Menu Panel */}
          <div className="fixed top-0 right-0 w-80 h-full bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out">
            <div className="flex flex-col h-full">
              {/* Menu Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 relative">
                      <Image
                        src="/LOGOZZ.png"
                        alt="ZENTRADE Logo"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">ZENTRADE</h2>
                      <p className="text-sm text-gray-500">Menú de Navegación</p>
                    </div>
                  </div>
                  <button
                    onClick={toggleMenu}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-2xl text-gray-500">×</span>
                  </button>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 p-6">
                <ul className="space-y-3">
                  {navItems.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={toggleMenu}
                        className={`flex items-center space-x-4 p-4 rounded-xl font-medium transition-all duration-200 ${
                          pathname === item.href
                            ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <span className="text-2xl">{item.icon}</span>
                        <span className="text-lg">{item.label}</span>
                        {pathname === item.href && (
                          <span className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Wallet Section */}
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                {isConnected ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-bold">✓</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{walletName}</p>
                        <p className="text-xs text-gray-500 font-mono">
                          {publicKey?.slice(0, 12)}...{publicKey?.slice(-12)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        disconnect();
                        toggleMenu();
                      }}
                      className="w-full bg-red-500 text-white py-2.5 rounded-lg font-medium hover:bg-red-600 transition-colors"
                    >
                      🔌 Desconectar Wallet
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-gray-500 text-xl">👛</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-1">Wallet Desconectada</p>
                      <p className="text-xs text-gray-500">Conecta para comenzar</p>
                    </div>
                    <button
                      onClick={() => {
                        connect();
                        toggleMenu();
                      }}
                      className="w-full bg-blue-500 text-white py-2.5 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                    >
                      🚀 Conectar Wallet
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Bottom Tab Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 md:hidden">
        <div className="flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-3 px-2 transition-colors ${
                pathname === item.href
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
              {pathname === item.href && (
                <div className="w-1 h-1 bg-blue-600 rounded-full mt-1"></div>
              )}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
};

export default MobileNavigation;
