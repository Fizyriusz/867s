'use client'

import { useState } from 'react'
import { supabase } from '@/utils/supabase'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/app/context/LanguageContext'

// 👇 TUTAJ BYŁ BRAKUJĄCY 'id'
type Snapshot = { id: number; alliance_id: number; total_power: number; recorded_at: string }
type Alliance = { id: number; tag: string; name: string }

export default function EventCard({ event, snapshots, alliances }: { event: any, snapshots: Snapshot[], alliances: Alliance[] }) {
  const router = useRouter()
  const { t } = useLanguage()

  const [showReport, setShowReport] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isMasterEditing, setIsMasterEditing] = useState(false)

  // Wykrywanie numeru KvK
  const kvkMatch = event.title.match(/KvK #(\d+)/)
  const isKvkEvent = !!kvkMatch
  const kvkNumber = kvkMatch ? kvkMatch[1] : null

  // Sprawdzanie czy event TRWA TERAZ
  const today = new Date().toISOString().split('T')[0]
  const isCurrent = today >= event.start_date && today <= event.end_date

  // --- STANY FORMULARZY ---
  const [formData, setFormData] = useState({
    title: event.title,
    start_date: event.start_date,
    end_date: event.end_date,
    description: event.description || '',
    opponent: event.opponent || '',
    prep_result: event.prep_result || '',
    war_result: event.war_result || ''
  })

  const [masterData, setMasterData] = useState({
    opponent: event.opponent || '',
    prep_result: event.prep_result || '',
    war_result: event.war_result || ''
  })

  // Style
  const getEventColor = (type: string) => {
    switch (type) {
      case 'KVK': return 'border-orange-500 text-orange-400 bg-orange-900/10'
      case 'KVK_WAR': return 'border-red-600 text-red-500 bg-red-900/20'
      case 'BRAWL': return 'border-blue-500 text-blue-400 bg-blue-900/10'
      default: return 'border-gray-600 text-gray-400 bg-gray-800'
    }
  }

  // --- ELASTYCZNA MATEMATYKA RAPORTU ---
  const calculateReport = () => {
    return alliances.map(alliance => {
      const history = snapshots
        .filter(s => s.alliance_id === alliance.id)
        .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())

      if (history.length === 0) return null

      // Start: pierwszy snapshot >= data startu
      const startSnap = history.find(s => s.recorded_at >= event.start_date)

      // Koniec: ostatni snapshot <= data końca
      const validEndSnaps = history.filter(s => s.recorded_at <= event.end_date)
      const endSnap = validEndSnaps[validEndSnaps.length - 1]

      // Walidacja (TERAZ ZADZIAŁA BO MAMY ID W TYPIE)
      if (!startSnap || !endSnap || startSnap.id === endSnap.id) return null
      
      if (startSnap.recorded_at >= endSnap.recorded_at) return null

      return { tag: alliance.tag, diff: endSnap.total_power - startSnap.total_power }
    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.diff - a.diff)
  }
  
  const report = showReport ? calculateReport() : []

  // --- UPDATE ---
  const handleUpdate = async () => {
    const { error } = await supabase.from('game_events').update(formData).eq('id', event.id)
    if (error) alert('Błąd zapisu!')
    else { setIsEditing(false); router.refresh(); }
  }

  const handleMasterUpdate = async () => {
    if (!kvkNumber) return
    const prefix = `KvK #${kvkNumber}`
    try {
      await supabase.from('game_events').update({ opponent: masterData.opponent }).ilike('title', `${prefix}%`)
      await supabase.from('game_events').update({ prep_result: masterData.prep_result }).eq('title', `${prefix}: Prep Phase`)
      await supabase.from('game_events').update({ war_result: masterData.war_result }).eq('title', `${prefix}: WAR`)
      setIsMasterEditing(false); router.refresh()
    } catch (e) { alert('Błąd aktualizacji zbiorczej') }
  }

  const handleDelete = async () => {
    if (!confirm('Usunąć?')) return
    const { error } = await supabase.from('game_events').delete().eq('id', event.id)
    if (error) alert('Błąd!')
    else router.refresh()
  }

  return (
    <div className="relative pl-8 md:pl-12 group">
      {/* Kropka na osi */}
      <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 bg-[#1a1a1a] z-10 
        ${isCurrent ? 'border-green-500 bg-green-500 shadow-[0_0_15px_#22c55e] animate-pulse' : 
          (isEditing || isMasterEditing) ? 'border-yellow-500' : 'border-gray-600'}`} 
      />

      {/* --- TRYB MASTER EDIT --- */}
      {isMasterEditing ? (
        <div className="p-5 rounded-lg border-2 border-purple-500 bg-[#222] shadow-[0_0_15px_rgba(168,85,247,0.3)]">
          <h3 className="text-purple-400 font-bold mb-4 uppercase text-sm tracking-wider">
            ⚙️ {t('event.manage')} KvK #{kvkNumber}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 uppercase font-bold">Przeciwnik</label>
              <input placeholder="np. Kingdom #1337" className="w-full bg-[#333] p-2 rounded border border-gray-600 text-white"
                value={masterData.opponent} onChange={e => setMasterData({...masterData, opponent: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-xs text-gray-500 uppercase font-bold">Wynik Prep</label>
                  <select className="w-full bg-[#333] p-2 rounded border border-gray-600 text-white text-sm"
                    value={masterData.prep_result} onChange={e => setMasterData({...masterData, prep_result: e.target.value})}>
                    <option value="">-- Wybierz --</option>
                    <option value="WIN">🏆 {t('status.win')}</option>
                    <option value="LOSS">🛡️ {t('status.loss')}</option>
                  </select>
               </div>
               <div>
                  <label className="text-xs text-gray-500 uppercase font-bold">Wynik Wojny</label>
                  <select className="w-full bg-[#333] p-2 rounded border border-gray-600 text-white text-sm"
                    value={masterData.war_result} onChange={e => setMasterData({...masterData, war_result: e.target.value})}>
                     <option value="">-- Wybierz --</option>
                     <option value="VICTORY">✅ {t('status.victory')}</option>
                     <option value="DEFEAT">❌ {t('status.defeat')}</option>
                  </select>
               </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-gray-700">
            <button onClick={() => setIsMasterEditing(false)} className="px-3 py-1 bg-gray-700 text-white text-xs rounded">Anuluj</button>
            <button onClick={handleMasterUpdate} className="px-4 py-1 bg-purple-600 text-white text-xs font-bold rounded">ZAPISZ</button>
          </div>
        </div>
      ) : isEditing ? (
        /* --- TRYB ZWYKŁEJ EDYCJI --- */
        <div className="p-5 rounded-lg border-2 border-yellow-600 bg-[#222]">
          <input className="w-full bg-[#333] mb-2 p-1 text-white font-bold" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          <div className="flex gap-2 mb-2">
            <input type="date" className="bg-[#333] p-1 text-white text-xs" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
            <input type="date" className="bg-[#333] p-1 text-white text-xs" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
          </div>
          <textarea className="w-full bg-[#333] p-1 text-white text-xs h-20" placeholder="Notatki..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          <div className="flex gap-2 justify-end mt-2">
            <button onClick={handleDelete} className="px-3 py-1 bg-red-900 text-red-200 text-xs rounded hover:bg-red-700">🗑️ Usuń</button>
            <button onClick={() => setIsEditing(false)} className="px-3 py-1 bg-gray-700 text-white text-xs rounded">Anuluj</button>
            <button onClick={handleUpdate} className="px-3 py-1 bg-green-700 text-white text-xs rounded hover:bg-green-600">💾 Zapisz</button>
          </div>
        </div>
      ) : (
        /* --- TRYB PODGLĄDU --- */
        <div className={`p-5 rounded-lg border-l-4 transition-all relative overflow-hidden ${getEventColor(event.event_type)} ${isCurrent ? 'ring-2 ring-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.1)]' : ''}`}>
          
          {isCurrent && (
            <div className="absolute top-0 right-0 bg-green-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg shadow-lg animate-pulse">
              🟢 {t('event.current')}
            </div>
          )}

          <div className="flex flex-col md:flex-row justify-between md:items-start mb-2">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center flex-wrap gap-2">
                {event.title}
                {/* WYNIKI */}
                {event.prep_result === 'WIN' && <span className="text-[10px] bg-green-900 text-green-400 px-1.5 py-0.5 rounded border border-green-700">{t('event.prep')}: {t('status.win')}</span>}
                {event.prep_result === 'LOSS' && <span className="text-[10px] bg-red-900 text-red-400 px-1.5 py-0.5 rounded border border-red-700">{t('event.prep')}: {t('status.loss')}</span>}
                {event.war_result === 'VICTORY' && <span className="text-[10px] bg-yellow-900 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-700">👑 {t('status.victory')}</span>}
                {event.war_result === 'DEFEAT' && <span className="text-[10px] bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded border border-gray-500">💀 {t('status.defeat')}</span>}
              </h3>
              
              {event.opponent && (
                <p className="text-sm font-bold text-gray-300 mt-1 flex items-center gap-2">
                   ⚔️ {t('event.vs')} <span className="text-red-400 font-mono text-base">{event.opponent}</span>
                   {event.prep_result === 'WIN' && <span className="text-gray-500 text-xs font-normal">({t('status.attack')})</span>}
                   {event.prep_result === 'LOSS' && <span className="text-gray-500 text-xs font-normal">({t('status.defense')})</span>}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 mt-2 md:mt-0">
               {isKvkEvent && (
                 <button onClick={() => setIsMasterEditing(true)} className="text-purple-400 hover:text-purple-300 bg-purple-900/20 px-2 py-1 rounded text-xs font-bold border border-purple-800">
                   ⚙️ KvK #{kvkNumber}
                 </button>
               )}
               <button onClick={() => setIsEditing(true)} className="text-gray-500 hover:text-white" title="Edytuj">✏️</button>
            </div>
          </div>
          
          <div className={`text-sm font-mono mb-4 ${isCurrent ? 'text-green-400 font-bold' : 'opacity-80'}`}>
            {new Date(event.start_date).toLocaleDateString('pl-PL', {day:'numeric', month:'short'})} — {new Date(event.end_date).toLocaleDateString('pl-PL', {day:'numeric', month:'short'})}
          </div>
          
          <button onClick={() => setShowReport(!showReport)} className="text-xs font-bold uppercase tracking-wider border border-white/20 px-3 py-1 rounded hover:bg-white/10 transition-colors">
              {showReport ? t('event.hide_report') : `📊 ${t('event.show_report')}`}
          </button>
          
          {showReport && (
              <div className="mt-4 bg-black/40 rounded p-4 animate-in fade-in zoom-in-95">
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">{t('event.ranking')}</h4>
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
                  ) : <p className="text-xs text-gray-500">Brak danych (wymagane min. 2 wpisy w okresie trwania eventu).</p>}
              </div>
          )}
        </div>
      )}
    </div>
  )
}