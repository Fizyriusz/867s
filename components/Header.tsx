'use client'

import Link from 'next/link'
import { useLanguage } from '@/app/context/LanguageContext'
import { useAdmin } from '@/app/context/AdminContext' // <--- IMPORT
import { usePathname } from 'next/navigation'

export default function Header() {
  const { t, lang, setLang } = useLanguage()
  const { isAdmin, login, logout } = useAdmin() // <--- UŻYCIE
  const pathname = usePathname()

  const SERVER_START_DATE = new Date('2025-08-21')
  const today = new Date()
  const diffTime = Math.abs(today.getTime() - SERVER_START_DATE.getTime())
  const serverDay = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) 

  const handleLogin = () => {
    if (isAdmin) {
      if(confirm('Wylogować?')) logout()
    } else {
      const pass = prompt('Podaj hasło administratora:')
      if (pass) {
        if (!login(pass)) alert('Błędne hasło!')
      }
    }
  }

  return (
    <header className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-gray-700 pb-6 gap-4">
      <Link href="/" className="group">
        <h1 className="text-4xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{t('app.title')}</h1>
        <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-400">{t('app.subtitle')}</span>
            <span className="bg-yellow-900/30 text-yellow-500 border border-yellow-800 px-2 py-0.5 rounded text-xs font-mono font-bold">
                📅 {t('server.age')} #{serverDay}
            </span>
        </div>
      </Link>
      
      <div className="flex flex-wrap gap-2 items-center justify-center">
        {/* Przełącznik Admina (Kłódka) */}
        <button 
          onClick={handleLogin}
          className={`px-3 py-2 rounded font-mono text-sm border transition-colors mr-2 ${
            isAdmin 
            ? 'bg-green-900/30 text-green-400 border-green-800 hover:bg-green-900/50' 
            : 'bg-red-900/10 text-red-500/50 border-red-900/30 hover:bg-red-900/30'
          }`}
          title={isAdmin ? "Jesteś Adminem (Kliknij by wylogować)" : "Zaloguj się"}
        >
          {isAdmin ? '🔓' : '🔒'}
        </button>

        <button 
          onClick={() => setLang(lang === 'pl' ? 'en' : 'pl')}
          className="bg-[#333] hover:bg-[#444] text-white px-3 py-2 rounded font-mono text-sm border border-gray-600 transition-colors mr-2"
        >
          {lang === 'pl' ? '🇬🇧 EN' : '🇵🇱 PL'}
        </button>

        {pathname !== '/' && (
          <Link href="/" className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded font-bold text-sm transition-colors flex items-center gap-2">
            <span>🏠</span> Dashboard
          </Link>
        )}

        {pathname !== '/timeline' && (
            <Link href="/timeline" className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded font-bold text-sm transition-colors flex items-center gap-2">
            <span>📅</span> {t('nav.timeline')}
            </Link>
        )}

        {pathname !== '/roadmap' && (
            <Link href="/roadmap" className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded font-bold text-sm transition-colors flex items-center gap-2" title={t('nav.roadmap')}>
            <span>📜</span>
            </Link>
        )}

        {/* UKRYTE DLA NIE-ADMINA */}
        {isAdmin && pathname !== '/targets' && (
            <Link href="/targets" className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded font-bold text-sm transition-colors flex items-center gap-2">
              <span>🎯</span> {t('nav.targets')}
            </Link>
        )}

        {isAdmin && pathname !== '/import' && (
            <Link href="/import" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold text-sm transition-colors flex items-center gap-2">
            <span>📥</span> {t('nav.import')}
            </Link>
        )}
      </div>
    </header>
  )
}