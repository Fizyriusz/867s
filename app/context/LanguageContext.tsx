'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { translations, Lang } from '@/utils/translations'

type LanguageContextType = {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Domyślnie PL
  const [lang, setLangState] = useState<Lang>('pl')

  // Zapamiętywanie wyboru w przeglądarce
  useEffect(() => {
    const saved = localStorage.getItem('app-lang') as Lang
    if (saved) setLangState(saved)
  }, [])

  const setLang = (newLang: Lang) => {
    setLangState(newLang)
    localStorage.setItem('app-lang', newLang)
  }

  // Funkcja tłumacząca: t('app.title') -> "867's HQ"
  const t = (key: string) => {
    // @ts-ignore
    return translations[lang][key] || key 
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider')
  return context
}