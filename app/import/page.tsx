'use client'

import { useState } from 'react'
import { supabase } from '@/utils/supabase'

export default function ImportPage() {
  const [jsonInput, setJsonInput] = useState('')
  const [logs, setLogs] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleImport = async () => {
    setIsProcessing(true)
    setLogs([]) // Czyść logi
    
    try {
      // 1. Próba odczytania JSON-a
      const data = JSON.parse(jsonInput)
      if (!Array.isArray(data)) throw new Error('To nie jest lista (tablica)!')

      addLog(`🔍 Znaleziono ${data.length} sojuszy do przetworzenia...`)

      for (const item of data) {
        // Walidacja danych
        if (!item.tag || !item.power) {
          addLog(`⚠️ Pomijam błędny wpis: ${JSON.stringify(item)}`)
          continue
        }

        // 2. Sprawdź czy sojusz już jest w bazie (szukamy po TAGu)
        let allianceId = null
        
        const { data: existing } = await supabase
          .from('alliances')
          .select('id')
          .eq('tag', item.tag)
          .single()

        if (existing) {
          allianceId = existing.id
          addLog(`✅ Sojusz ${item.tag} istnieje (ID: ${allianceId}).`)
        } else {
          // 3. Jak nie ma, to tworzymy nowy
          const { data: created, error: createError } = await supabase
            .from('alliances')
            .insert({ 
              tag: item.tag, 
              name: item.name || 'Unknown', 
              status: 'TARGET' // Domyślny status dla nowych
            })
            .select()
            .single()
          
          if (createError) {
            addLog(`❌ Błąd tworzenia sojuszu ${item.tag}: ${createError.message}`)
            continue
          }
          
          allianceId = created.id
          addLog(`🆕 Utworzono nowy sojusz: ${item.tag} (ID: ${allianceId})`)
        }

        // 4. Dodajemy wpis do historii mocy (Snapshot)
        if (allianceId) {
          const { error: snapError } = await supabase
            .from('alliance_snapshots')
            .insert({
              alliance_id: allianceId,
              total_power: item.power
              // recorded_at wstawi się sam jako dzisiejsza data (z bazy)
            })

          if (snapError) {
            addLog(`❌ Błąd zapisu mocy dla ${item.tag}: ${snapError.message}`)
          } else {
            addLog(`📈 Zapisano moc dla ${item.tag}: ${item.power.toLocaleString()}`)
          }
        }
      }
      
      addLog('🏁 Zakończono import!')

    } catch (e: any) {
      addLog(`🔥 BŁĄD KRYTYCZNY: ${e.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const addLog = (msg: string) => setLogs(prev => [...prev, msg])

  return (
    <main className="min-h-screen bg-[#1a1a1a] text-[#e0e0e0] p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Import Danych (JSON)</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Wklej tutaj JSON wygenerowany przez AI:
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

          {/* Konsola Logów */}
          <div className="bg-black/50 rounded border border-gray-800 p-4 h-64 overflow-y-auto font-mono text-xs">
            {logs.length === 0 && <span className="text-gray-600">Oczekiwanie na działania...</span>}
            {logs.map((log, i) => (
              <div key={i} className="mb-1 border-b border-gray-900/50 pb-1 last:border-0">
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