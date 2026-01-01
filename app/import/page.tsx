'use client'

import { useState } from 'react'
import { supabase } from '@/utils/supabase'
import Header from '@/components/Header'
// 👇 Dodajemy hook tłumaczeń
import { useLanguage } from '@/app/context/LanguageContext'

export default function ImportPage() {
  const { t } = useLanguage() // <--- Używamy hooka

  const [jsonInput, setJsonInput] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [deleteDate, setDeleteDate] = useState('')
  const [logs, setLogs] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  // --- CONFIG GENERATORA EVENTÓW ---
  const [template, setTemplate] = useState('MANUAL')
  const [startDate, setStartDate] = useState('')
  const [kvkNumber, setKvkNumber] = useState('3') 
  
  const [manualEvent, setManualEvent] = useState({
    title: '', event_type: 'OTHER', end_date: '', description: ''
  })

  // --- IMPORT LOGIKA (Skrócona dla czytelności, logika bez zmian) ---
  const handleImport = async () => {
    setIsProcessing(true); setLogs([]);
    try {
      const data = JSON.parse(jsonInput)
      if (!Array.isArray(data)) throw new Error('Format Error: Not an array')
      addLog(`📅 Date: ${selectedDate}`)
      for (const item of data) {
        if (!item.tag || !item.power) continue
        let allianceId = null
        const { data: existing } = await supabase.from('alliances').select('id').eq('tag', item.tag).single()
        if (existing) allianceId = existing.id
        else {
          const { data: created } = await supabase.from('alliances').insert({ tag: item.tag, name: item.name || 'Unknown' }).select().single()
          if (created) allianceId = created.id
        }
        if (allianceId) {
          const { data: existingSnap } = await supabase.from('alliance_snapshots').select('id').eq('alliance_id', allianceId).eq('recorded_at', selectedDate).single()
          if (existingSnap) {
            await supabase.from('alliance_snapshots').update({ total_power: item.power }).eq('id', existingSnap.id)
            addLog(`🔄 Updated: ${item.tag}`)
          } else {
            await supabase.from('alliance_snapshots').insert({ alliance_id: allianceId, total_power: item.power, recorded_at: selectedDate })
            addLog(`📈 Added: ${item.tag}`)
          }
        }
      }
      addLog('🏁 Import Finished!')
    } catch (e: any) { addLog(`🔥 ERROR: ${e.message}`) } finally { setIsProcessing(false) }
  }

  // --- GENERATOR LOGIKA ---
  const handleGenerateEvents = async () => {
    if (!startDate) { alert('Select start date!'); return }
    setIsProcessing(true)

    const eventsToCreate = []
    const start = new Date(startDate)
    const addDays = (date: Date, days: number) => { const r = new Date(date); r.setDate(r.getDate() + days); return r.toISOString().split('T')[0] }
    const dateStr = (date: Date) => date.toISOString().split('T')[0]

    try {
      if (template === 'KVK') {
        const prefix = `KvK #${kvkNumber}`
        eventsToCreate.push({ title: `${prefix}: Matchmaking`, event_type: 'KVK', start_date: dateStr(start), end_date: addDays(start, 1), description: 'System matching.' })
        eventsToCreate.push({ title: `${prefix}: Prep Phase`, event_type: 'KVK', start_date: addDays(start, 2), end_date: addDays(start, 6), description: 'Points collection.' })
        eventsToCreate.push({ title: `${prefix}: WAR`, event_type: 'KVK_WAR', start_date: addDays(start, 7), end_date: addDays(start, 7), description: 'Battle for Castle.' })
      } 
      else if (template === 'BRAWL') {
        eventsToCreate.push({ title: 'Alliance Brawl', event_type: 'BRAWL', start_date: dateStr(start), end_date: addDays(start, 6), description: 'Alliance competition.' })
      } 
      else {
        if (!manualEvent.title || !manualEvent.end_date) throw new Error('Fill all fields!')
        eventsToCreate.push({ title: manualEvent.title, event_type: manualEvent.event_type, start_date: startDate, end_date: manualEvent.end_date, description: manualEvent.description })
      }

      const { error } = await supabase.from('game_events').insert(eventsToCreate)
      if (error) throw error
      alert(`Success! Created ${eventsToCreate.length} events.`)
    } catch (e: any) { alert('Error: ' + e.message) } finally { setIsProcessing(false) }
  }

  const handleGlobalDelete = async () => {
    if (!deleteDate || !confirm(`Delete data for ${deleteDate}?`)) return
    setIsProcessing(true)
    await supabase.from('alliance_snapshots').delete({ count: 'exact' }).eq('recorded_at', deleteDate)
    setIsProcessing(false)
    alert('Deleted.')
  }

  const addLog = (msg: string) => setLogs(prev => [...prev, msg])

  return (
    <main className="min-h-screen bg-[#1a1a1a] text-[#e0e0e0] p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-12">
        
        <Header />

        <div className="flex justify-between items-center">
             <h1 className="text-3xl font-bold text-white">{t('import.title')}</h1>
             <a href="/" className="text-blue-400 hover:underline">← {t('import.back')}</a>
        </div>

        {/* --- GENERATOR --- */}
        <section className="bg-purple-900/10 border border-purple-500/30 p-6 rounded-xl">
          <h2 className="text-purple-400 font-bold text-xl mb-4">📅 {t('import.gen.title')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs text-gray-400 uppercase font-bold block mb-2">{t('import.gen.type')}</label>
              <select className="w-full bg-[#333] p-3 rounded border border-gray-600 focus:border-purple-500 text-white font-bold"
                value={template} onChange={e => setTemplate(e.target.value)}>
                <option value="MANUAL">Manual</option>
                <option value="KVK">⚔️ KvK</option>
                <option value="BRAWL">🏆 Alliance Brawl</option>
              </select>
              
              {template === 'KVK' && (
                <div className="mt-2">
                  <label className="text-xs text-purple-400 uppercase font-bold">{t('import.gen.kvk_num')}</label>
                  <input type="number" value={kvkNumber} onChange={e => setKvkNumber(e.target.value)}
                    className="w-20 ml-2 bg-[#222] border border-purple-500 rounded p-1 text-white text-center font-bold" />
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-gray-400 uppercase font-bold block mb-2">{t('import.gen.date')}</label>
              <input type="date" className="w-full bg-[#333] p-3 rounded border border-gray-600 text-white"
                value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>

            {/* MANUAL - zostawiamy po angielsku/uniwersalnie w kodzie, bo to tryb zaawansowany */}
            {template === 'MANUAL' && (
              <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-700 pt-4 mt-2">
                 <input type="text" placeholder="Title" className="bg-[#333] p-2 rounded border border-gray-600 text-white"
                   value={manualEvent.title} onChange={e => setManualEvent({...manualEvent, title: e.target.value})} />
                 <input type="date" className="bg-[#333] p-2 rounded border border-gray-600 text-white"
                   value={manualEvent.end_date} onChange={e => setManualEvent({...manualEvent, end_date: e.target.value})} />
                 <select className="bg-[#333] p-2 rounded border border-gray-600 text-white"
                   value={manualEvent.event_type} onChange={e => setManualEvent({...manualEvent, event_type: e.target.value})}>
                   <option value="OTHER">Other</option><option value="KVK">KvK</option><option value="BRAWL">Brawl</option>
                 </select>
              </div>
            )}

            <button onClick={handleGenerateEvents} disabled={isProcessing}
              className="col-span-1 md:col-span-2 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded transition-colors shadow-lg shadow-purple-900/50">
              ⚡ {t('import.gen.btn')}
            </button>
          </div>
        </section>

        {/* --- IMPORT --- */}
        <section>
          <h2 className="text-blue-400 font-bold text-xl mb-4">📥 {t('import.json.title')}</h2>
          <div className="bg-[#252525] p-6 rounded border border-gray-700 space-y-4">
             <div className="flex gap-4 items-center">
                <label className="text-sm font-bold text-gray-400">{t('import.json.date')}</label>
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-[#333] text-white p-2 rounded border border-gray-600"/>
             </div>
             <textarea className="w-full h-32 bg-[#333] border border-gray-600 rounded p-4 font-mono text-sm text-green-400"
               value={jsonInput} onChange={e => setJsonInput(e.target.value)} placeholder={t('import.json.placeholder')} />
             <button onClick={handleImport} disabled={isProcessing} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded">
               🚀 {t('import.json.btn')}
             </button>
             {logs.length > 0 && <div className="bg-black/50 p-2 text-xs text-gray-400 font-mono h-20 overflow-y-auto">{logs.map((l,i)=><div key={i}>{l}</div>)}</div>}
          </div>
        </section>

        {/* --- USUWANIE --- */}
        <section className="bg-red-900/10 border border-red-900/50 p-6 rounded-xl">
           <div className="flex justify-between items-center">
             <h2 className="text-red-500 font-bold">{t('import.delete.title')}</h2>
             <div className="flex gap-2">
                <input type="date" value={deleteDate} onChange={e => setDeleteDate(e.target.value)} className="bg-[#333] text-white p-1 rounded border border-gray-600 text-sm"/>
                <button onClick={handleGlobalDelete} className="bg-red-700 px-4 py-1 rounded text-white text-sm font-bold">{t('import.delete.btn')}</button>
             </div>
           </div>
        </section>
      </div>
    </main>
  )
}