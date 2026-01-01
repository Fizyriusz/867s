'use client'

import { useState } from 'react'
import Link from 'next/link'

type Alliance = {
  id: number; tag: string; name: string; status: string; notes: string | null
}
type Snapshot = {
  alliance_id: number; total_power: number; recorded_at: string
}

// Funkcja formatująca zmiany (np. +1.5M)
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

// Helper: Znajdź snapshot sprzed X dni (z tolerancją +/- 1 dzień)
const findPastSnapshot = (history: Snapshot[], currentDateStr: string, daysBack: number) => {
  const targetDate = new Date(currentDateStr)
  targetDate.setDate(targetDate.getDate() - daysBack)
  
  // Zakres szukania: od (target - 1 dzień) do (target + 1 dzień)
  const minDate = new Date(targetDate); minDate.setDate(minDate.getDate() - 1);
  const maxDate = new Date(targetDate); maxDate.setDate(maxDate.getDate() + 1);

  return history.find(snap => {
    const snapDate = new Date(snap.recorded_at)
    return snapDate >= minDate && snapDate <= maxDate
  })
}

export default function DashboardTable({ alliances, snapshots }: { alliances: Alliance[], snapshots: Snapshot[] }) {
  // 1. Wyciągamy unikalne daty, w których mamy jakiekolwiek dane
  const availableDates = Array.from(new Set(snapshots.map(s => s.recorded_at)))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()) // Sortowanie od najnowszej

  // Domyślna data to najnowsza dostępna
  const [viewDate, setViewDate] = useState(availableDates[0] || new Date().toISOString().split('T')[0])

  return (
    <div>
      {/* --- PANEL KONTROLNY --- */}
      <div className="bg-[#252525] p-4 rounded-lg border border-gray-800 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div className="flex items-center gap-4">
              <span className="text-gray-400 text-sm font-bold uppercase tracking-wider">Data Raportu:</span>
              <input 
                type="date" 
                value={viewDate} 
                onChange={(e) => setViewDate(e.target.value)}
                className="bg-[#333] text-white p-2 rounded border border-gray-600 focus:border-blue-500 font-mono"
              />
          </div>
          <div className="text-xs text-gray-500">
            Wybierz datę, aby zobaczyć stan mocy z przeszłości.
          </div>
        </div>

        {/* Lista dostępnych snapshotów (Szybki wybór) */}
        <div>
          <p className="text-xs text-gray-500 uppercase font-bold mb-2">Dostępne dni w bazie:</p>
          <div className="flex flex-wrap gap-2">
            {availableDates.map(date => (
              <button
                key={date}
                onClick={() => setViewDate(date)}
                className={`px-3 py-1 rounded text-xs font-mono transition-all border ${
                  viewDate === date 
                    ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
                    : 'bg-[#333] text-gray-400 border-gray-600 hover:bg-[#444] hover:text-gray-200'
                }`}
              >
                {new Date(date).toLocaleDateString('pl-PL')}
              </button>
            ))}
            {availableDates.length === 0 && <span className="text-gray-600 text-xs italic">Brak danych. Zaimportuj coś!</span>}
          </div>
        </div>
      </div>

      {/* --- TABELA GŁÓWNA --- */}
      <div className="bg-[#252525] rounded-xl shadow-lg overflow-hidden border border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#303030] text-gray-300 uppercase text-xs tracking-wider">
              <tr>
                <th className="p-4 w-16 text-center">Tag</th>
                <th className="p-4">Nazwa Sojuszu</th>
                <th className="p-4 text-right">Moc ({new Date(viewDate).toLocaleDateString('pl-PL')})</th>
                <th className="p-4 text-right text-gray-400" title="Zmiana względem poprzedniego wpisu (często 24h)">Δ Ost.</th>
                <th className="p-4 text-right text-gray-400" title="Zmiana z 7 dni (+/- 1 dzień)">Δ 7D</th>
                <th className="p-4 text-right text-gray-400" title="Zmiana z 30 dni (+/- 1 dzień)">Δ 30D</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 text-sm">
              {alliances.map((alliance) => {
                // Filtrujemy historię tylko dla tego sojuszu
                const history = snapshots
                  .filter(s => s.alliance_id === alliance.id)
                  .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())

                // 1. Wpis AKTUALNY (dla wybranej daty)
                const currentEntry = history.find(s => s.recorded_at === viewDate)
                
                // Jeśli sojusz nie istniał w wybranym dniu -> pomijamy go (lub pokazujemy pusty)
                if (!currentEntry) return null 

                // 2. Wpis POPRZEDNI (bezpośrednio przed wybraną datą - zazwyczaj 24h)
                const currentIndex = history.indexOf(currentEntry)
                const prevEntry = history[currentIndex - 1] 

                // 3. Wpis 7 DNI TEMU (tolerancja +/- 1 dzień)
                const entry7d = findPastSnapshot(history, viewDate, 7)

                // 4. Wpis 30 DNI TEMU (tolerancja +/- 1 dzień)
                const entry30d = findPastSnapshot(history, viewDate, 30)

                // Obliczenia różnic
                const diffPrev = prevEntry ? currentEntry.total_power - prevEntry.total_power : 0
                const diff7d = entry7d ? currentEntry.total_power - entry7d.total_power : 0
                const diff30d = entry30d ? currentEntry.total_power - entry30d.total_power : 0

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

                    {/* ZMIANA OSTATNIA (np. 24h) */}
                    <td className={`p-4 text-right font-mono font-bold ${diffPrev > 0 ? 'text-green-400' : diffPrev < 0 ? 'text-red-400' : 'text-gray-600'}`}>
                      {prevEntry ? formatDiff(diffPrev) : <span className="text-gray-700 text-xs">n/a</span>}
                    </td>

                    {/* ZMIANA 7D */}
                    <td className={`p-4 text-right font-mono font-bold ${diff7d > 0 ? 'text-green-400' : diff7d < 0 ? 'text-red-400' : 'text-gray-600'}`}>
                      {entry7d ? formatDiff(diff7d) : <span className="text-gray-700 text-xs">n/a</span>}
                    </td>

                    {/* ZMIANA 30D */}
                    <td className={`p-4 text-right font-mono font-bold ${diff30d > 0 ? 'text-green-400' : diff30d < 0 ? 'text-red-400' : 'text-gray-600'}`}>
                      {entry30d ? formatDiff(diff30d) : <span className="text-gray-700 text-xs">n/a</span>}
                    </td>

                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold border ${
                        alliance.status === 'TARGET' ? 'bg-green-900/20 text-green-400 border-green-900' : 
                        alliance.status === 'SKIP' ? 'bg-red-900/20 text-red-400 border-red-900' : 
                        'bg-gray-800 text-gray-400 border-gray-700'
                      }`}>{alliance.status}</span>
                    </td>
                  </tr>
                )
              })}
              
              {snapshots.filter(s => s.recorded_at === viewDate).length === 0 && (
                 <tr><td colSpan={7} className="p-8 text-center text-gray-500">Brak danych dla wybranej daty ({viewDate}). Wybierz inną datę z listy powyżej.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}