'use client';

// Forzar rendering dinámico para evitar static generation
export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-red-400 mb-4">Error</h1>
          <h2 className="text-2xl font-semibold text-white mb-4">Algo salió mal</h2>
          <p className="text-gray-300 mb-8">
            Ha ocurrido un error inesperado. Por favor, intenta de nuevo.
          </p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={reset}
            className="inline-block bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-red-500/25 mr-4"
          >
            Intentar de nuevo
          </button>
          
          <Link 
            href="/"
            className="inline-block bg-gradient-to-r from-emerald-500 to-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-emerald-500/25"
          >
            Volver al inicio
          </Link>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 text-left bg-gray-800 p-4 rounded-lg max-w-2xl mx-auto">
            <h3 className="text-red-400 font-semibold mb-2">Error Details:</h3>
            <pre className="text-sm text-gray-300 whitespace-pre-wrap">
              {error.message}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
