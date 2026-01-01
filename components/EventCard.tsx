'use client'

import { useState } from 'react'

type Snapshot = {
  alliance_id: number; total_power: number; recorded_at: string
}
type Alliance = {
  id: number; tag: string; name: string
}

export default function EventCard({ event, snapshots, alliances }: { event: any, snapshots: Snapshot[], alliances: Alliance[] }) {
  const [showReport, setShowReport] = useState(false)

  // Style w zależności od typu
  const getEventColor = (type: string) => {
    switch (type) {
      case 'KVK': return 'border-orange-500 text-orange-400 bg-orange-900/10'
      case 'KVK_WAR': return 'border-red-600 text-red-500 bg-red-900/20'
      case 'BRAWL': return 'border-blue-500 text-blue-400 bg-blue-900/10'
      default: return 'border-gray-600 text-gray-400 bg-gray-800'
    }
  }

  // --- MATEMATYKA RAPORTU ---
  const calculateReport = () => {
    // 1. Znajdź snapshoty najbliższe dacie STARTU
    // (Szukamy: data startu lub 1 dzień przed/po)
    const startWindow = [event.start_date, new Date(new Date(event.start_date).getTime() - 86400000).toISOString().split('T')[0]]
    
    // 2. Znajdź snapshoty najbliższe dacie KOŃCA
    const endWindow = [event.end_date, new Date(new Date(event.end_date).getTime() + 86400000).toISOString().split('T')[0]]

    const reportData = alliances.map(alliance => {
      // Pobierz historię sojuszu
      const history = snapshots.filter(s => s.alliance_id === alliance.id)
      
      // Znajdź wpis początkowy (najbliższy dacie startu)
      const startSnap = history.find(s => startWindow.includes(s.recorded_at)) || 
                        history.sort((a,b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
                               .find(s => s.recorded_at >= event.start_date)

      // Znajdź wpis końcowy (najbliższy dacie końca)
      const endSnap = history.find(s => endWindow.includes(s.recorded_at)) ||
                      history.sort((a,b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
                             .find(s => s.recorded_at <= event.end_date)

      if (!startSnap || !endSnap) return null

      const diff = endSnap.total_power - startSnap.total_power
      return { tag: alliance.tag, diff, startPower: startSnap.total_power }
    })
    .filter(Boolean) // Usuń puste (brak danych)
    .sort((a: any, b: any) => b.diff - a.diff) // Sortuj od największego wzrostu

    return reportData
  }

  const report = showReport ? calculateReport() : []

  // Sprawdzanie czasu
  const today = new Date().toISOString().split('T')[0]
  const isPast = today > event.end_date
  const isCurrent = today >= event.start_date && today <= event.end_date

  return (
    <div className="relative pl-8 md:pl-12 group">
      {/* Kropka */}
      <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 bg-[#1a1a1a] transition-all 
        ${isCurrent ? 'border-green-500 bg-green-500 scale-125 shadow-[0_0_10px_#22c55e]' : 
          isPast ? 'border-gray-600 bg-gray-600' : 'border-blue-500'}`} 
      />

      {/* Karta */}
      <div className={`p-5 rounded-lg border-l-4 transition-all ${getEventColor(event.event_type)} ${isPast && !showReport ? 'opacity-60 grayscale hover:grayscale-0' : ''}`}>
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-2">
          <h3 className="text-xl font-bold text-white">{event.title}</h3>
          <span className="text-sm font-mono opacity-80 bg-black/30 px-2 py-1 rounded">
            {new Date(event.start_date).toLocaleDateString('pl-PL', {day:'numeric', month:'short'})} — {new Date(event.end_date).toLocaleDateString('pl-PL', {day:'numeric', month:'short'})}
          </span>
        </div>
        <p className="text-sm opacity-90 mb-4">{event.description}</p>

        {/* Przycisk Raportu */}
        <button 
            onClick={() => setShowReport(!showReport)}
            className="text-xs font-bold uppercase tracking-wider border border-white/20 px-3 py-1 rounded hover:bg-white/10 transition-colors flex items-center gap-2"
        >
            {showReport ? 'ukryj wynik' : '📊 Pokaż wynik (boost)'}
        </button>

        {/* Sekcja Raportu */}
        {showReport && (
            <div className="mt-4 bg-black/40 rounded p-4 animate-in fade-in slide-in-from-top-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Ranking przyrostu mocy w tym okresie:</h4>
                {report && report.length > 0 ? (
                    <table className="w-full text-sm">
                        <tbody>
                            {report.map((row: any, i: number) => (
                                <tr key={row.tag} className="border-b border-white/5 last:border-0">
                                    <td className="py-1 text-gray-400 w-6">{i+1}.</td>
                                    <td className="py-1 font-bold text-blue-300">{row.tag}</td>
                                    <td className={`py-1 text-right font-mono font-bold ${row.diff > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {row.diff > 0 ? '+' : ''}{(row.diff / 1000000).toFixed(1)}M
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-xs text-gray-500 italic">Brak wystarczających danych z tego okresu (wymagany snapshot na start i koniec).</p>
                )}
            </div>
        )}
      </div>
    </div>
  )
}