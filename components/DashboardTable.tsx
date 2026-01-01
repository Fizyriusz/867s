'use client'

import { useState } from 'react'
import Link from 'next/link'

type Alliance = {
  id: number; tag: string; name: string; status: string; notes: string | null
}
type Snapshot = {
  alliance_id: number; total_power: number; recorded_at: string
}

const formatDiff = (val: number) => {
  if (val === 0) return '-'
  const sign = val > 0 ? '+' : ''
  const absVal = Math.abs(val)
  if (absVal >= 1000000) return `${sign}${(val / 1000000).toFixed(1)}M`
  if (absVal >= 1000) return `${sign}${(val / 1000).toFixed(1)}k`
  return `${sign}${val.toLocaleString()}`
}

const formatPower = (val: number) => {
  if (val >= 1000000000) return `${(val / 1000000000).toFixed(2)}B`
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`
  return val.toLocaleString()
}

export default function DashboardTable({ alliances, snapshots }: { alliances: Alliance[], snapshots: Snapshot[] }) {
  // Domyślnie ustawiamy datę na najnowszą znalezioną w bazie (lub dzisiejszą)
  const availableDates = Array.from(new Set(snapshots.map(s => s.recorded_at))).sort().reverse()
  const [viewDate, setViewDate] = useState(availableDates[0] || new Date().toISOString().split('T')[0])

  return (
    <div>
      {/* Pasek Kontrolny */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-[#252525] p-4 rounded-lg border border-gray-800">
        <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm font-bold uppercase tracking-wider">Podgląd z dnia:</span>
            <input 
              type="date" 
              value={viewDate} 
              onChange={(e) => setViewDate(e.target.value)}
              className="bg-[#333] text-white p-2 rounded border border-gray-600 focus:border-blue-500 font-mono"
            />
        </div>
        <div className="text-xs text-gray-500">
          Zmieniając datę, zobaczysz stan mocy sojuszy w tamtym momencie.
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-[#252525] rounded-xl shadow-lg overflow-hidden border border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#303030] text-gray-300 uppercase text-xs tracking-wider">
              <tr>
                <th className="p-4 w-16 text-center">Tag</th>
                <th className="p-4">Nazwa Sojuszu</th>
                <th className="p-4 text-right">Moc ({new Date(viewDate).toLocaleDateString('pl-PL')})</th>
                <th className="p-4 text-right text-gray-400">24h Δ</th>
                <th className="p-4 text-right text-gray-400">7d Δ</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-gray-500">Uwagi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 text-sm">
              {alliances.map((alliance) => {
                // Pobieramy historię tylko dla tego sojuszu
                const history = snapshots
                  .filter(s => s.alliance_id === alliance.id)
                  .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())

                // Szukamy wpisu dla WYBRANEJ daty
                const currentEntry = history.find(s => s.recorded_at === viewDate)
                
                // Jeśli nie ma wpisu z tego dnia, sojusz nie istnieje w widoku
                if (!currentEntry) return null 

                // Szukamy wpisów do porównania (poprzedni dostępny przed wybraną datą)
                const currentIndex = history.indexOf(currentEntry)
                const prevEntry = history[currentIndex - 1] // Dzień wcześniej (lub poprzedni wpis)
                
                // Szukamy wpisu sprzed ok 7 dni
                const weekAgoDate = new Date(viewDate)
                weekAgoDate.setDate(weekAgoDate.getDate() - 7)
                const weekAgoString = weekAgoDate.toISOString().split('T')[0]
                // Znajdź wpis najbliższy dacie tydzień temu (ale nie nowszy niż viewDate)
                const weekAgoEntry = history.find(s => s.recorded_at === weekAgoString) || history[currentIndex - 7]

                const diff24h = prevEntry ? currentEntry.total_power - prevEntry.total_power : 0
                const diff7d = weekAgoEntry ? currentEntry.total_power - weekAgoEntry.total_power : 0

                return (
                  <tr key={alliance.id} className="hover:bg-[#2a2a2a] transition-colors">
                    <td className="p-4 font-mono text-blue-400 font-bold text-center">{alliance.tag}</td>
                    <td className="p-4 font-medium text-white">
                      <Link href={`/alliance/${alliance.id}`} className="hover:text-blue-400 hover:underline">
                        {alliance.name}
                      </Link>
                    </td>
                    <td className="p-4 text-right font-mono text-gray-200 font-bold">
                      {formatPower(currentEntry.total_power)}
                    </td>
                    <td className={`p-4 text-right font-mono font-bold ${diff24h > 0 ? 'text-green-400' : diff24h < 0 ? 'text-red-400' : 'text-gray-600'}`}>
                      {prevEntry ? formatDiff(diff24h) : <span className="text-gray-700 text-xs">n/a</span>}
                    </td>
                    <td className={`p-4 text-right font-mono font-bold ${diff7d > 0 ? 'text-green-400' : diff7d < 0 ? 'text-red-400' : 'text-gray-600'}`}>
                      {weekAgoEntry ? formatDiff(diff7d) : <span className="text-gray-700 text-xs">n/a</span>}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold border ${
                        alliance.status === 'TARGET' ? 'bg-green-900/20 text-green-400 border-green-900' : 
                        alliance.status === 'SKIP' ? 'bg-red-900/20 text-red-400 border-red-900' : 
                        'bg-gray-800 text-gray-400 border-gray-700'
                      }`}>{alliance.status}</span>
                    </td>
                    <td className="p-4 text-xs text-gray-500 italic truncate max-w-[150px]">{alliance.notes}</td>
                  </tr>
                )
              })}
              {/* Jeśli wybrana data nie ma żadnych danych */}
              {snapshots.filter(s => s.recorded_at === viewDate).length === 0 && (
                 <tr><td colSpan={7} className="p-8 text-center text-gray-500">Brak danych dla wybranej daty ({viewDate}).</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}