'use client'

import { useState } from 'react'
import { supabase } from '@/utils/supabase'

export default function ImportPage() {
  // --- STANY DLA IMPORTU ---
  const [jsonInput, setJsonInput] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [deleteDate, setDeleteDate] = useState('')
  const [logs, setLogs] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  // --- STANY DLA NOWEGO EVENTU ---
  const [newEvent, setNewEvent] = useState({
    title: '',
    event_type: 'KVK', // Domyślny typ
    start_date: '',
    end_date: '',
    description: ''
  })

  // --- LOGIKA 1: IMPORT JSON (Bez zmian) ---
  const handleImport = async () => {
    setIsProcessing(true)
    setLogs([]) 
    try {
      const data = JSON.parse(jsonInput)
      if (!Array.isArray(data)) throw new Error('To nie jest lista (tablica)!')
      addLog(`📅 Data importu: ${selectedDate}`)
      for (const item of data) {
        if (!item.tag || !item.power) continue
        let allianceId = null
        const { data: existing } = await supabase.from('alliances').select('id').eq('tag', item.tag).single()
        if (existing) {
          allianceId = existing.id
        } else {
          const { data: created } = await supabase.from('alliances').insert({ 
              tag: item.tag, name: item.name || 'Unknown', status: 'TARGET' 
          }).select().single()
          if (created) allianceId = created.id
        }
        if (allianceId) {
          const { data: existingSnap } = await supabase.from('alliance_snapshots')
            .select('id').eq('alliance_id', allianceId).eq('recorded_at', selectedDate).single()
          if (existingSnap) {
            await supabase.from('alliance_snapshots').update({ total_power: item.power }).eq('id', existingSnap.id)
            addLog(`🔄 Zaktualizowano: ${item.tag}`)
          } else {
            await supabase.from('alliance_snapshots').insert({
                alliance_id: allianceId, total_power: item.power, recorded_at: selectedDate
            })
            addLog(`📈 Dodano: ${item.tag}`)
          }
        }
      }
      addLog('🏁 Zakończono import!')
    } catch (e: any) {
      addLog(`🔥 BŁĄD: ${e.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // --- LOGIKA 2: DODAWANIE EVENTU (NOWA) ---
  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.start_date || !newEvent.end_date) {
      alert('Wypełnij tytuł i daty!')
      return
    }
    setIsProcessing(true)
    try {
      const { error } = await supabase.from('game_events').insert([newEvent])
      if (error) throw error
      
      alert('Wydarzenie dodane pomyślnie!')
      // Reset formularza
      setNewEvent({ title: '', event_type: 'KVK', start_date: '', end_date: '', description: '' })
    } catch (e: any) {
      alert('Błąd dodawania eventu: ' + e.message)
    } finally {
      setIsProcessing(false)
    }
  }

  // --- LOGIKA 3: GLOBALNE USUWANIE (Bez zmian) ---
  const handleGlobalDelete = async () => {
    if (!deleteDate) return
    if (!confirm(`UWAGA! Usunąć WSZYSTKIE dane z dnia ${deleteDate}?`)) return
    setIsProcessing(true)
    try {
      const { error, count } = await supabase.from('alliance_snapshots').delete({ count: 'exact' }).eq('recorded_at', deleteDate)
      if (error) throw error
      alert(`Usunięto ${count} wpisów.`)
    } catch (e: any) { alert(e.message) } finally { setIsProcessing(false) }
  }

  const addLog = (msg: string) => setLogs(prev => [...prev, msg])

  return (
    <main className="min-h-screen bg-[#1a1a1a] text-[#e0e0e0] p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-12">
        
        <div className="flex justify-between items-center">
             <h1 className="text-3xl font-bold text-white">Panel Zarządzania</h1>
             <a href="/" className="text-blue-400 hover:underline">← Wróć do Dashboardu</a>
        </div>

        {/* --- SEKCJA 1: DODAWANIE WYDARZEŃ (NOWOŚĆ) --- */}
        <section className="bg-purple-900/10 border border-purple-500/30 p-6 rounded-xl">
          <h2 className="text-purple-400 font-bold text-xl mb-4 flex items-center gap-2">
            📅 Dodaj Wydarzenie (Timeline)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1 md:col-span-2">
              <label className="text-xs text-gray-400 uppercase font-bold">Tytuł Wydarzenia</label>
              <input type="text" placeholder="np. KvK #4: Prep Phase" 
                className="w-full bg-[#333] p-2 rounded border border-gray-600 focus:border-purple-500 text-white"
                value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} />
            </div>
            
            <div>
              <label className="text-xs text-gray-400 uppercase font-bold">Typ</label>
              <select className="w-full bg-[#333] p-2 rounded border border-gray-600 focus:border-purple-500 text-white"
                value={newEvent.event_type} onChange={e => setNewEvent({...newEvent, event_type: e.target.value})}>
                <option value="KVK">KvK (Ogólne / Prep)</option>
                <option value="KVK_WAR">KvK WAR (Bitwa)</option>
                <option value="BRAWL">Alliance Brawl</option>
                <option value="OTHER">Inne</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 uppercase font-bold">Daty (Start - Koniec)</label>
              <div className="flex gap-2">
                <input type="date" className="w-1/2 bg-[#333] p-2 rounded border border-gray-600 text-white"
                  value={newEvent.start_date} onChange={e => setNewEvent({...newEvent, start_date: e.target.value})} />
                <input type="date" className="w-1/2 bg-[#333] p-2 rounded border border-gray-600 text-white"
                  value={newEvent.end_date} onChange={e => setNewEvent({...newEvent, end_date: e.target.value})} />
              </div>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="text-xs text-gray-400 uppercase font-bold">Opis (Opcjonalnie)</label>
              <textarea placeholder="Co się wtedy dzieje? Np. Zbieranie punktów." 
                className="w-full bg-[#333] p-2 rounded border border-gray-600 text-white h-20"
                value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} />
            </div>

            <button onClick={handleAddEvent} disabled={isProcessing}
              className="col-span-1 md:col-span-2 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded transition-colors">
              ➕ DODAJ DO OSI CZASU
            </button>
          </div>
        </section>

        <hr className="border-gray-800" />

        {/* --- SEKCJA 2: IMPORT DANYCH (STARA) --- */}
        <section>
          <h2 className="text-blue-400 font-bold text-xl mb-4">📥 Import Danych (JSON)</h2>
          <div className="space-y-4">
            <div className="flex gap-4 items-center bg-[#252525] p-3 rounded border border-gray-700">
              <label className="text-sm text-gray-400 font-bold uppercase">Data Danych:</label>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-[#333] text-white p-2 rounded border border-gray-600" />
            </div>
            <textarea className="w-full h-32 bg-[#252525] border border-gray-700 rounded p-4 text-sm font-mono text-green-400"
              placeholder='[{"tag": "[KON]", ...}]' value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} />
            <button onClick={handleImport} disabled={isProcessing || !jsonInput}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold">
              🚀 IMPORTUJ DANE
            </button>
            <div className="bg-black/50 rounded border border-gray-800 p-4 h-24 overflow-y-auto font-mono text-xs text-gray-300">
              {logs.map((log, i) => <div key={i}>{log}</div>)}
            </div>
          </div>
        </section>

        {/* --- SEKCJA 3: STREFA NIEBEZPIECZNA --- */}
        <section className="bg-red-900/10 border border-red-900/50 p-6 rounded-xl opacity-80 hover:opacity-100 transition-opacity">
          <h2 className="text-red-500 font-bold text-lg mb-2">⚠️ Strefa Usuwania</h2>
          <div className="flex gap-4 items-end">
            <div>
              <label className="block text-xs text-red-400 mb-1 font-bold uppercase">Data do usunięcia</label>
              <input type="date" value={deleteDate} onChange={(e) => setDeleteDate(e.target.value)}
                className="bg-[#333] text-white p-2 rounded border border-gray-600" />
            </div>
            <button onClick={handleGlobalDelete} disabled={isProcessing || !deleteDate}
              className="px-6 py-2 bg-red-700 hover:bg-red-600 text-white rounded font-bold">
              🗑️ USUŃ DZIEŃ
            </button>
          </div>
        </section>

      </div>
    </main>
  )
}