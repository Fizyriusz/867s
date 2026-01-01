'use client'

import { useState } from 'react'
import { supabase } from '@/utils/supabase'
import { useRouter } from 'next/navigation'

type Snapshot = { alliance_id: number; total_power: number; recorded_at: string }
type Alliance = { id: number; tag: string; name: string }

export default function EventCard({ event, snapshots, alliances }: { event: any, snapshots: Snapshot[], alliances: Alliance[] }) {
  const router = useRouter()
  const [showReport, setShowReport] = useState(false)
  
  // Tryb edycji
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    title: event.title,
    opponent: event.opponent || '',
    start_date: event.start_date,
    end_date: event.end_date,
    description: event.description || '',
    prep_result: event.prep_result || '', // 'WIN', 'LOSS'
    war_result: event.war_result || ''    // 'VICTORY', 'DEFEAT'
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

  // --- OBLICZANIE BOOSTU ---
  const calculateReport = () => {
    const startWindow = [event.start_date, new Date(new Date(event.start_date).getTime() - 86400000).toISOString().split('T')[0]]
    const endWindow = [event.end_date, new Date(new Date(event.end_date).getTime() + 86400000).toISOString().split('T')[0]]
    return alliances.map(alliance => {
      const history = snapshots.filter(s => s.alliance_id === alliance.id)
      const startSnap = history.find(s => startWindow.includes(s.recorded_at)) || history.find(s => s.recorded_at >= event.start_date)
      const endSnap = history.find(s => endWindow.includes(s.recorded_at)) || history.find(s => s.recorded_at <= event.end_date)
      if (!startSnap || !endSnap) return null
      return { tag: alliance.tag, diff: endSnap.total_power - startSnap.total_power }
    }).filter(Boolean).sort((a: any, b: any) => b.diff - a.diff)
  }
  const report = showReport ? calculateReport() : []

  // --- LOGIKA EDYCJI I USUWANIA ---
  const handleUpdate = async () => {
    const { error } = await supabase.from('game_events').update(formData).eq('id', event.id)
    if (error) alert('Błąd zapisu!')
    else { setIsEditing(false); router.refresh(); }
  }

  const handleDelete = async () => {
    if (!confirm('Czy na pewno chcesz usunąć to wydarzenie?')) return
    const { error } = await supabase.from('game_events').delete().eq('id', event.id)
    if (error) alert('Błąd usuwania!')
    else router.refresh()
  }

  // Helpery do wyświetlania wyników
  const isWar = event.event_type === 'KVK_WAR'
  const isPrep = event.event_type === 'KVK' && event.title.includes('Prep')

  return (
    <div className="relative pl-8 md:pl-12 group">
      {/* Kropka na osi */}
      <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 bg-[#1a1a1a] z-10 ${isEditing ? 'border-yellow-500' : 'border-gray-600'}`} />

      {/* --- TRYB EDYCJI --- */}
      {isEditing ? (
        <div className="p-5 rounded-lg border-2 border-yellow-600 bg-[#222]">
          <input className="w-full bg-[#333] mb-2 p-1 text-white font-bold" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          
          <div className="flex gap-2 mb-2">
            <input type="date" className="bg-[#333] p-1 text-white text-xs" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
            <span className="text-gray-400">-</span>
            <input type="date" className="bg-[#333] p-1 text-white text-xs" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
          </div>

          {/* EDYCJA SZCZEGÓŁÓW WOJNY */}
          <div className="bg-black/30 p-2 rounded mb-2 space-y-2">
            <input placeholder="Nazwa Przeciwnika (np. [ABC])" className="w-full bg-[#333] p-1 text-white text-xs" value={formData.opponent} onChange={e => setFormData({...formData, opponent: e.target.value})} />
            
            {/* Wynik Prep Phase */}
            {isPrep && (
               <select className="w-full bg-[#333] p-1 text-white text-xs" value={formData.prep_result} onChange={e => setFormData({...formData, prep_result: e.target.value})}>
                 <option value="">-- Wynik Prep Phase --</option>
                 <option value="WIN">🏆 Wygrana (Atakujemy)</option>
                 <option value="LOSS">🛡️ Przegrana (Bronimy się)</option>
               </select>
            )}

            {/* Wynik Wojny */}
            {isWar && (
               <select className="w-full bg-[#333] p-1 text-white text-xs" value={formData.war_result} onChange={e => setFormData({...formData, war_result: e.target.value})}>
                 <option value="">-- Wynik Bitwy --</option>
                 <option value="VICTORY">✅ Zwycięstwo (Zamek zdobyty/obroniony)</option>
                 <option value="DEFEAT">❌ Porażka (Zamek stracony/niezdobyty)</option>
               </select>
            )}
            
            <textarea className="w-full bg-[#333] p-1 text-white text-xs" placeholder="Notatki..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>

          <div className="flex gap-2 justify-end">
            <button onClick={handleDelete} className="px-3 py-1 bg-red-900 text-red-200 text-xs rounded hover:bg-red-700">🗑️ Usuń</button>
            <button onClick={() => setIsEditing(false)} className="px-3 py-1 bg-gray-700 text-white text-xs rounded">Anuluj</button>
            <button onClick={handleUpdate} className="px-3 py-1 bg-green-700 text-white text-xs rounded hover:bg-green-600">💾 Zapisz</button>
          </div>
        </div>
      ) : (
        /* --- TRYB PODGLĄDU --- */
        <div className={`p-5 rounded-lg border-l-4 transition-all ${getEventColor(event.event_type)}`}>
          <div className="flex flex-col md:flex-row justify-between md:items-start mb-2">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                {event.title}
                {/* IKONY WYNIKÓW */}
                {event.prep_result === 'WIN' && <span className="text-xs bg-green-900 text-green-400 px-2 py-0.5 rounded border border-green-700">PREP: WIN</span>}
                {event.prep_result === 'LOSS' && <span className="text-xs bg-red-900 text-red-400 px-2 py-0.5 rounded border border-red-700">PREP: LOSS</span>}
                {event.war_result === 'VICTORY' && <span className="text-xs bg-yellow-900 text-yellow-400 px-2 py-0.5 rounded border border-yellow-700">👑 VICTORY</span>}
                {event.war_result === 'DEFEAT' && <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded border border-gray-500">💀 DEFEAT</span>}
              </h3>
              
              {/* Przeciwnik */}
              {event.opponent && (
                <p className="text-sm font-bold text-gray-300 mt-1">
                   VS <span className="text-red-400">{event.opponent}</span>
                   {/* Logika Opisu Sytuacji */}
                   {event.prep_result === 'WIN' && <span className="text-gray-500 text-xs ml-2 font-normal">(Atakowaliśmy)</span>}
                   {event.prep_result === 'LOSS' && <span className="text-gray-500 text-xs ml-2 font-normal">(Broniliśmy się)</span>}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 mt-2 md:mt-0">
               <button onClick={() => setIsEditing(true)} className="text-gray-500 hover:text-white transition-colors" title="Edytuj">✏️</button>
            </div>
          </div>
          
          <div className="text-sm font-mono opacity-80 mb-2">
            {new Date(event.start_date).toLocaleDateString('pl-PL', {day:'numeric', month:'short'})} — {new Date(event.end_date).toLocaleDateString('pl-PL', {day:'numeric', month:'short'})}
          </div>

          <p className="text-sm opacity-90 mb-4 italic">{event.description}</p>

          <button 
              onClick={() => setShowReport(!showReport)}
              className="text-xs font-bold uppercase tracking-wider border border-white/20 px-3 py-1 rounded hover:bg-white/10 transition-colors"
          >
              {showReport ? 'ukryj wynik' : '📊 Pokaż wynik (boost)'}
          </button>

          {showReport && (
              <div className="mt-4 bg-black/40 rounded p-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Ranking przyrostu mocy:</h4>
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
                  ) : <p className="text-xs text-gray-500">Brak danych w tym okresie.</p>}
              </div>
          )}
        </div>
      )}
    </div>
  )
}