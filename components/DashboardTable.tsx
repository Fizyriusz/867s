'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/app/context/LanguageContext'
import { useAdmin } from '@/app/context/AdminContext'
import { supabase } from '@/utils/supabase'

type Alliance = {
  id: number; tag: string; name: string; status: string; notes: string | null
}
type Snapshot = {
  alliance_id: number; total_power: number; recorded_at: string
}

// --- HELPERY FORMATOWANIA ---
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

const getStatusColor = (status: string) => {
    switch (status) {
        case 'TARGET': return 'bg-green-900/30 text-green-400 border-green-800 hover:bg-green-900/50'
        case 'SKIP': return 'bg-red-900/30 text-red-400 border-red-800 hover:bg-red-900/50'
        case 'ALLY': return 'bg-blue-900/30 text-blue-400 border-blue-800 hover:bg-blue-900/50'
        case 'FARM': return 'bg-yellow-900/30 text-yellow-400 border-yellow-800 hover:bg-yellow-900/50'
        default: return 'bg-gray-800 text-gray-500 border-gray-700 hover:bg-gray-700'
    }
}

export default function DashboardTable({ alliances, snapshots }: { alliances: Alliance[], snapshots: Snapshot[] }) {
  const { t } = useLanguage()
  const { isAdmin } = useAdmin() // Sprawdzamy uprawnienia z Contextu
  
  // Lokalny stan sojuszy (dla płynnej edycji bez odświeżania strony)
  const [localAlliances, setLocalAlliances] = useState(alliances)

  // --- LOGIKA DAT ---
  const availableDates = Array.from(new Set(snapshots.map(s => s.recorded_at)))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
  
  const [viewDate, setViewDate] = useState(availableDates[0] || new Date().toISOString().split('T')[0])

  // --- LOGIKA DROPOUTÓW (Kto wypadł?) ---
  const currentDateIndex = availableDates.indexOf(viewDate)
  const prevDate = availableDates[currentDateIndex + 1]

  const currentSnapshots = snapshots.filter(s => s.recorded_at === viewDate)
  const prevSnapshots = prevDate ? snapshots.filter(s => s.recorded_at === prevDate) : []

  const currentAllianceIds = currentSnapshots.map(s => s.alliance_id)
  const prevAllianceIds = prevSnapshots.map(s => s.alliance_id)

  const dropoutIds = prevAllianceIds.filter(id => !currentAllianceIds.includes(id))
  const dropoutAlliances = alliances.filter(a => dropoutIds.includes(a.id))


  // --- HANDLERY ZMIAN (STATUS / NOTATKI) ---
  const handleStatusChange = async (id: number, newStatus: string) => {
    setLocalAlliances(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a))
    await supabase.from('alliances').update({ status: newStatus }).eq('id', id)
  }

  const handleNoteSave = async (id: number, newNote: string) => {
    setLocalAlliances(prev => prev.map(a => a.id === id ? { ...a, notes: newNote } : a))
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

      {/* TABELA GŁÓWNA */}
      <div className="bg-[#252525] rounded-xl shadow-lg overflow-hidden border border-gray-800 mb-8">
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
                
                {/* KOLUMNY WIDOCZNE TYLKO DLA ADMINA */}
                {isAdmin && <th className="p-4 text-center">{t('dash.col.status')}</th>}
                {isAdmin && <th className="p-4 text-gray-500 w-64">{t('dash.col.notes')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 text-sm">
              {localAlliances.map((alliance) => {
                const history = snapshots.filter(s => s.alliance_id === alliance.id).sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
                const currentEntry = history.find(s => s.recorded_at === viewDate)
                
                // Jeśli sojuszu nie ma w tym dniu, w ogóle go nie wyświetlamy w głównej tabeli
                if (!currentEntry) return null 

                const currentIndex = history.indexOf(currentEntry)
                const prevEntry = history[currentIndex - 1] 
                const entry7d = findPastSnapshot(history, viewDate, 7)
                const entry30d = findPastSnapshot(history, viewDate, 30)
                const diffPrev = prevEntry ? currentEntry.total_power - prevEntry.total_power : 0
                const diff7d = entry7d ? currentEntry.total_power - entry7d.total_power : 0
                const diff30d = entry30d ? currentEntry.total_power - entry30d.total_power : 0

                // CZY JEST NOWY? (Ma wpis dziś, nie miał w poprzednim imporcie)
                const isNewEntry = prevDate && !prevAllianceIds.includes(alliance.id)

                return (
                  <tr key={alliance.id} className={`transition-colors group ${isNewEntry ? 'bg-blue-900/10 hover:bg-blue-900/20' : 'hover:bg-[#2a2a2a]'}`}>
                    <td className="p-4 font-mono text-blue-400 font-bold text-center">{alliance.tag}</td>
                    <td className="p-4 font-medium text-white">
                      <div className="flex items-center gap-2">
                          <Link href={`/alliance/${alliance.id}`} className="hover:text-blue-400 hover:underline">{alliance.name}</Link>
                          {/* BADGE NOWOŚCI */}
                          {isNewEntry && (
                              <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold animate-pulse">
                                  {t('dash.badge.new')}
                              </span>
                          )}
                      </div>
                    </td>
                    <td className="p-4 text-right font-mono text-gray-200 font-bold">{formatPower(currentEntry.total_power)}</td>
                    <td className={`p-4 text-right font-mono font-bold ${diffPrev > 0 ? 'text-green-400' : diffPrev < 0 ? 'text-red-400' : 'text-gray-600'}`}>{prevEntry ? formatDiff(diffPrev) : <span className="text-gray-700 text-xs">n/a</span>}</td>
                    <td className={`p-4 text-right font-mono font-bold ${diff7d > 0 ? 'text-green-400' : diff7d < 0 ? 'text-red-400' : 'text-gray-600'}`}>{entry7d ? formatDiff(diff7d) : <span className="text-gray-700 text-xs">n/a</span>}</td>
                    <td className={`p-4 text-right font-mono font-bold ${diff30d > 0 ? 'text-green-400' : diff30d < 0 ? 'text-red-400' : 'text-gray-600'}`}>{entry30d ? formatDiff(diff30d) : <span className="text-gray-700 text-xs">n/a</span>}</td>
                    
                    {/* ZMIANA STATUSU (TYLKO ADMIN) */}
                    {isAdmin && (
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
                    )}

                    {/* EDYTOWALNE NOTATKI (TYLKO ADMIN) */}
                    {isAdmin && (
                        <td className="p-4">
                            <input 
                                type="text"
                                defaultValue={alliance.notes || ''}
                                placeholder="..."
                                onBlur={(e) => handleNoteSave(alliance.id, e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                                className="bg-transparent border-b border-transparent hover:border-gray-600 focus:border-blue-500 focus:bg-[#222] outline-none w-full text-xs text-gray-400 placeholder-gray-700 transition-all px-1 py-1 rounded"
                            />
                        </td>
                    )}
                  </tr>
                )
              })}
              
              {/* EMPTY STATE */}
              {snapshots.filter(s => s.recorded_at === viewDate).length === 0 && (
                 <tr>
                    <td colSpan={isAdmin ? 8 : 6} className="p-8 text-center text-gray-500">
                        {t('dash.no_data')} ({viewDate}).
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- SEKCJA SPADKÓW (DROPOUTS) --- */}
      {prevDate && (
          <div className="bg-red-900/10 border border-red-900/30 rounded-xl p-6 mb-10">
              <h3 className="text-red-400 font-bold text-sm uppercase mb-4 flex items-center gap-2">
                  {t('dash.dropouts.title')}
                  <span className="text-xs text-gray-500 normal-case font-normal">(Byli: {new Date(prevDate).toLocaleDateString('pl-PL')}, Nie ma: {new Date(viewDate).toLocaleDateString('pl-PL')})</span>
              </h3>
              
              {dropoutAlliances.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {dropoutAlliances.map(alliance => {
                          const lastKnownPower = snapshots.find(s => s.alliance_id === alliance.id && s.recorded_at === prevDate)?.total_power || 0
                          
                          return (
                              <div key={alliance.id} className="bg-[#252525] p-3 rounded flex justify-between items-center border border-gray-700 opacity-75 hover:opacity-100 transition-opacity">
                                  <div className="flex items-center gap-3">
                                      <span className="text-gray-500 font-mono font-bold">{alliance.tag}</span>
                                      <Link href={`/alliance/${alliance.id}`} className="text-gray-300 hover:text-white text-sm font-medium hover:underline">
                                          {alliance.name}
                                      </Link>
                                  </div>
                                  <div className="text-right">
                                      <div className="text-xs text-gray-500">Ostatnia moc:</div>
                                      <div className="text-sm font-mono font-bold text-red-400">{formatPower(lastKnownPower)}</div>
                                  </div>
                              </div>
                          )
                      })}
                  </div>
              ) : (
                  <p className="text-sm text-gray-500 italic">{t('dash.dropouts.empty')}</p>
              )}
          </div>
      )}

    </div>
  )
}