'use client';

// Forzar rendering dinámico para evitar static generation
export const dynamic = 'force-dynamic';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-emerald-400 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-white mb-4">Página no encontrada</h2>
          <p className="text-gray-300 mb-8">
            Lo sentimos, la página que buscas no existe.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/"
            className="inline-block bg-gradient-to-r from-emerald-500 to-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-emerald-500/25"
          >
            Volver al inicio
          </Link>
          
          <div className="mt-4">
            <Link 
              href="/trading"
              className="inline-block mx-2 text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Trading
            </Link>
            <span className="text-gray-500">|</span>
            <Link 
              href="/swaps"
              className="inline-block mx-2 text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Swaps
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
