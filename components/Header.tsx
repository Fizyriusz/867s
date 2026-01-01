'use client'

import Link from 'next/link'
import { useLanguage } from '@/app/context/LanguageContext'

export default function Header() {
  const { t, lang, setLang } = useLanguage()

  return (
    <header className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-gray-700 pb-6 gap-4">
      <div>
        <h1 className="text-4xl font-bold text-white mb-1">{t('app.title')}</h1>
        <p className="text-gray-400 text-sm">{t('app.subtitle')}</p>
      </div>
      
      <div className="flex gap-3 items-center">
        {/* Przełącznik Języka */}
        <button 
          onClick={() => setLang(lang === 'pl' ? 'en' : 'pl')}
          className="bg-[#333] hover:bg-[#444] text-white px-3 py-2 rounded font-mono text-sm border border-gray-600 transition-colors"
        >
          {lang === 'pl' ? '🇬🇧 EN' : '🇵🇱 PL'}
        </button>

        <Link 
          href="/timeline" 
          className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded font-bold text-sm transition-colors flex items-center gap-2"
        >
          <span>📅</span> {t('nav.timeline')}
        </Link>

        <Link 
          href="/import" 
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold text-sm transition-colors flex items-center gap-2"
        >
          <span>📥</span> {t('nav.import')}
        </Link>
      </div>
    </header>
  )
}