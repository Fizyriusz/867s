'use client'

import Link from 'next/link'
import { useLanguage } from '@/app/context/LanguageContext'
import { usePathname } from 'next/navigation'

export default function Header() {
  const { t, lang, setLang } = useLanguage()
  const pathname = usePathname() // Sprawdzamy, na jakiej jesteśmy stronie

  return (
    <header className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-gray-700 pb-6 gap-4">
      <Link href="/" className="group">
        <h1 className="text-4xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{t('app.title')}</h1>
        <p className="text-gray-400 text-sm">{t('app.subtitle')}</p>
      </Link>
      
      <div className="flex flex-wrap gap-2 items-center justify-center">
        {/* Przełącznik Języka */}
        <button 
          onClick={() => setLang(lang === 'pl' ? 'en' : 'pl')}
          className="bg-[#333] hover:bg-[#444] text-white px-3 py-2 rounded font-mono text-sm border border-gray-600 transition-colors mr-2"
        >
          {lang === 'pl' ? '🇬🇧 EN' : '🇵🇱 PL'}
        </button>

        {/* Przycisk DASHBOARD (Pokaż tylko jeśli NIE jesteśmy na głównej) */}
        {pathname !== '/' && (
          <Link 
            href="/" 
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded font-bold text-sm transition-colors flex items-center gap-2"
          >
            <span>🏠</span> Dashboard
          </Link>
        )}

        {/* Przycisk TIMELINE (Ukryj jeśli jesteśmy na timeline) */}
        {pathname !== '/timeline' && (
            <Link 
            href="/timeline" 
            className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded font-bold text-sm transition-colors flex items-center gap-2"
            >
            <span>📅</span> {t('nav.timeline')}
            </Link>
        )}

        {/* Przycisk IMPORT (Ukryj jeśli jesteśmy na imporcie) */}
        {pathname !== '/import' && (
            <Link 
            href="/import" 
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold text-sm transition-colors flex items-center gap-2"
            >
            <span>📥</span> {t('nav.import')}
            </Link>
        )}
      </div>
    </header>
  )
}