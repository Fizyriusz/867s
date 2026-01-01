'use client'

import Header from '@/components/Header'
import { useLanguage } from '@/app/context/LanguageContext'
// Importujemy dane z oddzielnego pliku
import { ROADMAP_DATA, CHANGELOG_DATA } from './content'

export default function RoadmapPage() {
  const { t, lang } = useLanguage()

  // Helper do mapowania statusu na etykietę z tłumaczeń
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'done': return t('roadmap.status.done')
      case 'in_progress': return t('roadmap.status.in_progress')
      default: return t('roadmap.status.planned')
    }
  }

  return (
    <main className="min-h-screen bg-[#1a1a1a] text-[#e0e0e0] p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <Header />

        <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-white mb-2">{t('roadmap.title')}</h2>
            <p className="text-gray-400">{t('roadmap.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            
            {/* SEKCJA 1: PLANY (ROADMAP) */}
            <div>
                <h3 className="text-xl font-bold text-purple-400 mb-6 border-b border-purple-900/50 pb-2">
                    {t('roadmap.section.planned')}
                </h3>
                <div className="space-y-4">
                    {ROADMAP_DATA.map((item, i) => (
                        <div key={i} className="bg-[#252525] p-5 rounded-xl border border-gray-700 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-2 opacity-10 text-6xl font-bold group-hover:opacity-20 transition-opacity">🚀</div>
                            <div className="flex justify-between items-start mb-2">
                                {/* Wybieramy język dynamicznie: item.title[lang] */}
                                <h4 className="font-bold text-white text-lg">{item.title[lang]}</h4>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase border ${
                                    item.status === 'in_progress' 
                                    ? 'bg-yellow-900/20 text-yellow-500 border-yellow-800' 
                                    : 'bg-gray-800 text-gray-500 border-gray-600'
                                }`}>
                                    {getStatusLabel(item.status)}
                                </span>
                            </div>
                            {/* Wybieramy opis dynamicznie */}
                            <p className="text-sm text-gray-400">{item.description[lang]}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* SEKCJA 2: CHANGELOG */}
            <div>
                <h3 className="text-xl font-bold text-blue-400 mb-6 border-b border-blue-900/50 pb-2">
                    {t('roadmap.section.history')}
                </h3>
                <div className="space-y-8 relative border-l border-gray-700 ml-3 pl-8 pb-4">
                    {CHANGELOG_DATA.map((release, i) => (
                        <div key={i} className="relative">
                            {/* Kropka na osi */}
                            <div className="absolute -left-[39px] top-1 w-5 h-5 bg-[#1a1a1a] border-2 border-blue-500 rounded-full"></div>
                            
                            <div className="mb-1 flex flex-col sm:flex-row sm:items-center gap-2">
                                <span className="text-white font-bold text-lg">{release.version}</span>
                                <span className="text-xs font-mono text-gray-500 bg-black/30 px-2 py-1 rounded">{release.date}</span>
                            </div>
                            
                            <ul className="list-disc list-inside space-y-1">
                                {/* Iterujemy po liście zmian w wybranym języku */}
                                {release.changes[lang].map((change, j) => (
                                    <li key={j} className="text-sm text-gray-400 hover:text-gray-300 transition-colors">
                                        {change}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

        </div>
      </div>
    </main>
  )
}