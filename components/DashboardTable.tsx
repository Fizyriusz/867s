'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/app/context/LanguageContext'
import { supabase } from '@/utils/supabase'

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

const findPastSnapshot = (history: Snapshot[], currentDateStr: string, daysBack: number) => {
    const targetDate = new Date(currentDateStr)
    targetDate.setDate(targetDate.getDate() - daysBack)
    const minDate = new Date(targetDate); minDate.setDate(minDate.getDate() - 1);
    const maxDate = new Date(targetDate); maxDate.setDate(maxDate.getDate() + 1);
    return history.find(snap => {
      const snapDate = new Date(snap.recorded_at)
      return snapDate >= minDate && snapDate <= maxDate
    })
}

// Helper koloru statusu
const getStatusColor = (status: string) => {
    switch (status) {
        case 'TARGET': return 'bg-green-900/30 text-green-400 border-green-800 hover:bg-green-900/50'
        case 'SKIP': return 'bg-red-900/30 text-red-400 border-red-800 hover:bg-red-900/50'
        case 'ALLY': return 'bg-blue-900/30 text-blue-400 border-blue-800 hover:bg-blue-900/50'
        case 'FARM': return 'bg-yellow-900/30 text-yellow-400 border-yellow-800 hover:bg-yellow-900/50'
        default: return 'bg-gray-800 text-gray-500 border-gray-700 hover:bg-gray-700' // NEUTRAL (Szary)
    }
}

export default function DashboardTable({ alliances, snapshots }: { alliances: Alliance[], snapshots: Snapshot[] }) {
  const { t } = useLanguage()
  
  // Lokalny stan sojuszy (żeby UI odświeżyło się od razu)
  const [localAlliances, setLocalAlliances] = useState(alliances)

  const availableDates = Array.from(new Set(snapshots.map(s => s.recorded_at)))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
  const [viewDate, setViewDate] = useState(availableDates[0] || new Date().toISOString().split('T')[0])

  // --- ZMIANA STATUSU ---
  const handleStatusChange = async (id: number, newStatus: string) => {
    setLocalAlliances(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a))
    await supabase.from('alliances').update({ status: newStatus }).eq('id', id)
  }

  // --- ZMIANA NOTATKI (Zapisuje przy wyjściu z pola lub Enter) ---
  const handleNoteSave = async (id: number, newNote: string) => {
    // 1. Aktualizuj lokalnie (żeby nie skakało)
    setLocalAlliances(prev => prev.map(a => a.id === id ? { ...a, notes: newNote } : a))
    // 2. Wyślij do bazy
    await supabase.from('alliances').update({ notes: newNote }).eq('id', id)
  }

  return (
    <div>
      {/* PANEL KONTROLNY */}
      <div className="bg-[#252525] p-4 rounded-lg border border-gray-800 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div className="flex items-center gap-4">
              <span className="text-gray-400 text-sm font-bold uppercase tracking-wider">{t('dash.control.date')}</span>
              <input type="date" value={viewDate} onChange={(e) => setViewDate(e.target.value)}
                className="bg-[#333] text-white p-2 rounded border border-gray-600 focus:border-blue-500 font-mono"/>
          </div>
          <div className="text-xs text-gray-500">{t('dash.control.info')}</div>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase font-bold mb-2">{t('dash.control.available')}</p>
          <div className="flex flex-wrap gap-2">
            {availableDates.map(date => (
              <button key={date} onClick={() => setViewDate(date)}
                className={`px-3 py-1 rounded text-xs font-mono transition-all border ${
                  viewDate === date ? 'bg-blue-600 text-white border-blue-400' : 'bg-[#333] text-gray-400 border-gray-600 hover:bg-[#444]'
                }`}>
                {new Date(date).toLocaleDateString('pl-PL')}
              </button>
            ))}
            {availableDates.length === 0 && <span className="text-gray-600 text-xs italic">{t('dash.no_data')}</span>}
          </div>
        </div>
      </div>

      {/* TABELA */}
      <div className="bg-[#252525] rounded-xl shadow-lg overflow-hidden border border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#303030] text-gray-300 uppercase text-xs tracking-wider">
              <tr>
                <th className="p-4 w-16 text-center">{t('dash.col.tag')}</th>
                <th className="p-4">{t('dash.col.name')}</th>
                <th className="p-4 text-right">{t('dash.col.power')} ({new Date(viewDate).toLocaleDateString('pl-PL')})</th>
                <th className="p-4 text-right text-gray-400">{t('dash.col.diff_last')}</th>
                <th className="p-4 text-right text-gray-400">{t('dash.col.diff_7d')}</th>
                <th className="p-4 text-right text-gray-400">{t('dash.col.diff_30d')}</th>
                <th className="p-4 text-center">{t('dash.col.status')}</th>
                <th className="p-4 text-gray-500 w-64">{t('dash.col.notes')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 text-sm">
              {localAlliances.map((alliance) => {
                const history = snapshots.filter(s => s.alliance_id === alliance.id).sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
                const currentEntry = history.find(s => s.recorded_at === viewDate)
                if (!currentEntry) return null 
                const currentIndex = history.indexOf(currentEntry)
                const prevEntry = history[currentIndex - 1] 
                const entry7d = findPastSnapshot(history, viewDate, 7)
                const entry30d = findPastSnapshot(history, viewDate, 30)
                const diffPrev = prevEntry ? currentEntry.total_power - prevEntry.total_power : 0
                const diff7d = entry7d ? currentEntry.total_power - entry7d.total_power : 0
                const diff30d = entry30d ? currentEntry.total_power - entry30d.total_power : 0

                return (
                  <tr key={alliance.id} className="hover:bg-[#2a2a2a] transition-colors group">
                    <td className="p-4 font-mono text-blue-400 font-bold text-center">{alliance.tag}</td>
                    <td className="p-4 font-medium text-white">
                      <Link href={`/alliance/${alliance.id}`} className="hover:text-blue-400 hover:underline">{alliance.name}</Link>
                    </td>
                    <td className="p-4 text-right font-mono text-gray-200 font-bold">{formatPower(currentEntry.total_power)}</td>
                    <td className={`p-4 text-right font-mono font-bold ${diffPrev > 0 ? 'text-green-400' : diffPrev < 0 ? 'text-red-400' : 'text-gray-600'}`}>{prevEntry ? formatDiff(diffPrev) : <span className="text-gray-700 text-xs">n/a</span>}</td>
                    <td className={`p-4 text-right font-mono font-bold ${diff7d > 0 ? 'text-green-400' : diff7d < 0 ? 'text-red-400' : 'text-gray-600'}`}>{entry7d ? formatDiff(diff7d) : <span className="text-gray-700 text-xs">n/a</span>}</td>
                    <td className={`p-4 text-right font-mono font-bold ${diff30d > 0 ? 'text-green-400' : diff30d < 0 ? 'text-red-400' : 'text-gray-600'}`}>{entry30d ? formatDiff(diff30d) : <span className="text-gray-700 text-xs">n/a</span>}</td>
                    
                    {/* STATUS SELECT */}
                    <td className="p-4 text-center">
                        <select 
                            value={alliance.status || 'NEUTRAL'} 
                            onChange={(e) => handleStatusChange(alliance.id, e.target.value)}
                            className={`px-2 py-1 rounded text-xs font-bold border appearance-none cursor-pointer focus:outline-none text-center w-full transition-colors ${getStatusColor(alliance.status || 'NEUTRAL')}`}
                        >
                            <option value="NEUTRAL" className="bg-[#252525] text-gray-400">—</option>
                            <option value="TARGET" className="bg-[#252525] text-green-400">TARGET</option>
                            <option value="SKIP" className="bg-[#252525] text-red-400">SKIP</option>
                            <option value="ALLY" className="bg-[#252525] text-blue-400">ALLY</option>
                            <option value="FARM" className="bg-[#252525] text-yellow-400">FARM</option>
                        </select>
                    </td>

                    {/* EDYTOWALNE NOTATKI */}
                    <td className="p-4">
                        <input 
                            type="text"
                            defaultValue={alliance.notes || ''}
                            placeholder="..."
                            onBlur={(e) => handleNoteSave(alliance.id, e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.currentTarget.blur() // Powoduje zapis (onBlur) i chowa klawiaturę
                                }
                            }}
                            className="bg-transparent border-b border-transparent hover:border-gray-600 focus:border-blue-500 focus:bg-[#222] outline-none w-full text-xs text-gray-400 placeholder-gray-700 transition-all px-1 py-1 rounded"
                        />
                    </td>
                  </tr>
                )
              })}
              {snapshots.filter(s => s.recorded_at === viewDate).length === 0 && (
                 <tr><td colSpan={8} className="p-8 text-center text-gray-500">{t('dash.no_data')} ({viewDate}).</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}