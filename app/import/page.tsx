'use client'

import { useState } from 'react'
import { supabase } from '@/utils/supabase'

export default function ImportPage() {
  const [jsonInput, setJsonInput] = useState('')
  // Domyślnie ustawiamy dzisiejszą datę w formacie YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [logs, setLogs] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleImport = async () => {
    setIsProcessing(true)
    setLogs([]) 
    
    try {
      const data = JSON.parse(jsonInput)
      if (!Array.isArray(data)) throw new Error('To nie jest lista (tablica)!')

      addLog(`📅 Data importu ustawiona na: ${selectedDate}`)
      addLog(`🔍 Znaleziono ${data.length} sojuszy do przetworzenia...`)

      for (const item of data) {
        if (!item.tag || !item.power) {
          addLog(`⚠️ Pomijam błędny wpis: ${JSON.stringify(item)}`)
          continue
        }

        // 1. Znajdź lub stwórz sojusz
        let allianceId = null
        
        const { data: existing } = await supabase
          .from('alliances')
          .select('id')
          .eq('tag', item.tag)
          .single()

        if (existing) {
          allianceId = existing.id
        } else {
          const { data: created, error: createError } = await supabase
            .from('alliances')
            .insert({ 
              tag: item.tag, 
              name: item.name || 'Unknown', 
              status: 'TARGET' 
            })
            .select()
            .single()
          
          if (createError) {
            addLog(`❌ Błąd tworzenia sojuszu ${item.tag}: ${createError.message}`)
            continue
          }
          allianceId = created.id
          addLog(`🆕 Utworzono nowy sojusz: ${item.tag}`)
        }

        // 2. Dodaj Snapshot z WYBRANĄ DATĄ
        if (allianceId) {
          // Najpierw sprawdzamy, czy nie ma już wpisu dla tego sojuszu z tą datą (żeby nie dublować)
          const { data: existingSnap } = await supabase
            .from('alliance_snapshots')
            .select('id')
            .eq('alliance_id', allianceId)
            .eq('recorded_at', selectedDate)
            .single()

          if (existingSnap) {
            // Jeśli jest wpis z tą datą -> aktualizujemy go (nadpisujemy)
            const { error: updateError } = await supabase
              .from('alliance_snapshots')
              .update({ total_power: item.power })
              .eq('id', existingSnap.id)

            if (updateError) addLog(`❌ Błąd aktualizacji ${item.tag}: ${updateError.message}`)
            else addLog(`🔄 Zaktualizowano wpis z dnia ${selectedDate} dla ${item.tag}`)
            
          } else {
            // Jeśli nie ma -> tworzymy nowy
            const { error: insertError } = await supabase
              .from('alliance_snapshots')
              .insert({
                alliance_id: allianceId,
                total_power: item.power,
                recorded_at: selectedDate // <--- TU JEST KLUCZOWA ZMIANA
              })

            if (insertError) addLog(`❌ Błąd zapisu mocy dla ${item.tag}: ${insertError.message}`)
            else addLog(`📈 Dodano historię z dnia ${selectedDate} dla ${item.tag}`)
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

  const addLog = (msg: string) => setLogs(prev => [...prev, msg])

  return (
    <main className="min-h-screen bg-[#1a1a1a] text-[#e0e0e0] p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Import Danych Historycznych</h1>
        
        <div className="space-y-4">
          
          {/* NOWE POLE: WYBÓR DATY */}
          <div className="bg-[#252525] p-4 rounded border border-gray-700">
            <label className="block text-sm text-gray-400 mb-2 font-bold uppercase tracking-wider">
              1. Wybierz datę zrzutu ekranu
            </label>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-[#333] text-white p-2 rounded border border-gray-600 focus:outline-none focus:border-blue-500 w-full md:w-auto"
            />
            <p className="text-xs text-gray-500 mt-2">
              Jeśli importujesz stare zdjęcia, ustaw datę wykonania zrzutu ekranu.
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2 font-bold uppercase tracking-wider">
              2. Wklej JSON z AI
            </label>
            <textarea
              className="w-full h-64 bg-[#252525] border border-gray-700 rounded p-4 text-sm font-mono text-green-400 focus:outline-none focus:border-blue-500"
              placeholder='[{"tag": "[KON]", "name": "KingdomofNoobs", "power": 123456}, ...]'
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
            />
          </div>

          <button
            onClick={handleImport}
            disabled={isProcessing || !jsonInput}
            className={`w-full py-3 rounded font-bold transition-colors ${
              isProcessing 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {isProcessing ? 'Przetwarzanie...' : '🚀 IMPORTUJ DANE'}
          </button>

          <div className="bg-black/50 rounded border border-gray-800 p-4 h-64 overflow-y-auto font-mono text-xs">
            {logs.map((log, i) => (
              <div key={i} className="mb-1 border-b border-gray-900/50 pb-1 last:border-0 text-gray-300">
                {log}
              </div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <a href="/" className="text-blue-400 hover:underline">← Wróć do listy głównej</a>
          </div>
        </div>
      </div>
    </main>
  )
}