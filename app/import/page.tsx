'use client'

import { useState } from 'react'
import { supabase } from '@/utils/supabase'

export default function ImportPage() {
  const [jsonInput, setJsonInput] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [deleteDate, setDeleteDate] = useState('') // Data do usunięcia
  const [logs, setLogs] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  // --- LOGIKA IMPORTU (Bez zmian) ---
  const handleImport = async () => {
    setIsProcessing(true)
    setLogs([]) 
    try {
      const data = JSON.parse(jsonInput)
      if (!Array.isArray(data)) throw new Error('To nie jest lista (tablica)!')

      addLog(`📅 Data importu: ${selectedDate}`)
      addLog(`🔍 Przetwarzam ${data.length} sojuszy...`)

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

  // --- NOWA LOGIKA: GLOBALNE USUWANIE ---
  const handleGlobalDelete = async () => {
    if (!deleteDate) return
    if (!confirm(`UWAGA! Czy na pewno chcesz usunąć WSZYSTKIE dane wszystkich sojuszy z dnia ${deleteDate}? Tej operacji nie da się cofnąć.`)) return

    setIsProcessing(true)
    try {
      const { error, count } = await supabase
        .from('alliance_snapshots')
        .delete({ count: 'exact' })
        .eq('recorded_at', deleteDate)

      if (error) throw error
      alert(`Sukces! Usunięto ${count} wpisów z dnia ${deleteDate}.`)
      addLog(`🗑️ Usunięto globalnie historię z dnia ${deleteDate}`)
    } catch (e: any) {
      alert('Błąd usuwania: ' + e.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const addLog = (msg: string) => setLogs(prev => [...prev, msg])

  return (
    <main className="min-h-screen bg-[#1a1a1a] text-[#e0e0e0] p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* SEKCJA IMPORTU */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-6">Import Danych</h1>
          <div className="space-y-4">
            <div className="bg-[#252525] p-4 rounded border border-gray-700">
              <label className="block text-sm text-gray-400 mb-2 font-bold uppercase">1. Data Danych</label>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-[#333] text-white p-2 rounded border border-gray-600 w-full md:w-auto" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2 font-bold uppercase">2. JSON z AI</label>
              <textarea className="w-full h-48 bg-[#252525] border border-gray-700 rounded p-4 text-sm font-mono text-green-400"
                value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} />
            </div>
            <button onClick={handleImport} disabled={isProcessing || !jsonInput}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold">
              {isProcessing ? 'Przetwarzanie...' : '🚀 IMPORTUJ'}
            </button>
            <div className="bg-black/50 rounded border border-gray-800 p-4 h-32 overflow-y-auto font-mono text-xs text-gray-300">
              {logs.map((log, i) => <div key={i}>{log}</div>)}
            </div>
          </div>
        </div>

        <hr className="border-gray-800" />

        {/* NOWA SEKCJA: GLOBALNE USUWANIE */}
        <div className="bg-red-900/10 border border-red-900/50 p-6 rounded-xl">
          <h2 className="text-red-500 font-bold text-xl mb-2">Strefa Niebezpieczna</h2>
          <p className="text-gray-400 text-sm mb-4">Tutaj możesz usunąć cały, błędnie wgrany dzień dla wszystkich sojuszy naraz.</p>
          
          <div className="flex gap-4 items-end">
            <div>
              <label className="block text-xs text-red-400 mb-1 font-bold uppercase">Wybierz dzień do skasowania</label>
              <input type="date" value={deleteDate} onChange={(e) => setDeleteDate(e.target.value)}
                className="bg-[#333] text-white p-2 rounded border border-gray-600" />
            </div>
            <button onClick={handleGlobalDelete} disabled={isProcessing || !deleteDate}
              className="px-6 py-2 bg-red-700 hover:bg-red-600 text-white rounded font-bold transition-colors">
              🗑️ USUŃ CAŁY DZIEŃ
            </button>
          </div>
        </div>

        <div className="text-center">
            <a href="/" className="text-blue-400 hover:underline">← Wróć do listy głównej</a>
        </div>
      </div>
    </main>
  )
}