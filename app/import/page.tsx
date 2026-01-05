'use client'

import { useState } from 'react'
import { supabase } from '@/utils/supabase'
import Header from '@/components/Header'
import { useLanguage } from '@/app/context/LanguageContext'
import { parsePower, parseLevel } from '@/utils/parsers'

export default function ImportPage() {
  const { t } = useLanguage()

  // --- ZAKŁADKI (TERAZ TRZY) ---
  const [activeTab, setActiveTab] = useState<'alliances' | 'players' | 'events'>('alliances')

  // --- STAN: IMPORT SOJUSZY ---
  const [jsonInput, setJsonInput] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  
  // --- STAN: GENERATOR EVENTÓW ---
  const [template, setTemplate] = useState('MANUAL')
  const [startDate, setStartDate] = useState('')
  const [kvkNumber, setKvkNumber] = useState('3')
  const [manualEvent, setManualEvent] = useState({ title: '', event_type: 'OTHER', end_date: '', description: '' })

  // --- STAN: IMPORT GRACZY ---
  const [playerJson, setPlayerJson] = useState('')
  const [defaultTag, setDefaultTag] = useState('') 
  
  // --- WSPÓLNE ---
  const [logs, setLogs] = useState<string[]>([])
  const [deleteDate, setDeleteDate] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const addLog = (msg: string) => setLogs(prev => [msg, ...prev])

// --- STAN: MERGE TOOL ---
  const [mergeOldId, setMergeOldId] = useState('')
  const [mergeNewId, setMergeNewId] = useState('')

  // ==========================================
  // LOGIKA 1: IMPORT SOJUSZY
  // ==========================================
  const handleImportAlliances = async () => {
    setIsProcessing(true); setLogs([]);
    try {
      const data = JSON.parse(jsonInput)
      if (!Array.isArray(data)) throw new Error('Format Error: Not an array')
      addLog(`🏢 Import Sojuszy: ${selectedDate}`)
      
      for (const item of data) {
        if (!item.tag || !item.power) continue
        let allianceId = null
        const { data: existing } = await supabase.from('alliances').select('id').eq('tag', item.tag).single()
        
        if (existing) {
            allianceId = existing.id
        } else {
            const { data: created } = await supabase.from('alliances').insert({ tag: item.tag, name: item.name || 'Unknown', status: 'NEUTRAL' }).select().single()
            if (created) allianceId = created.id
        }

        if (allianceId) {
          const powerVal = parsePower(item.power)
          const { data: existingSnap } = await supabase.from('alliance_snapshots').select('id').eq('alliance_id', allianceId).eq('recorded_at', selectedDate).single()
          
          if (existingSnap) {
            await supabase.from('alliance_snapshots').update({ total_power: powerVal }).eq('id', existingSnap.id)
            addLog(`🔄 Zaktualizowano: [${item.tag}]`)
          } else {
            await supabase.from('alliance_snapshots').insert({ alliance_id: allianceId, total_power: powerVal, recorded_at: selectedDate })
            addLog(`📈 Dodano: [${item.tag}]`)
          }
        }
      }
      addLog('✅ Zakończono import sojuszy!')
    } catch (e: any) { addLog(`🔥 BŁĄD: ${e.message}`) } finally { setIsProcessing(false) }
  }


  // ==========================================
  // LOGIKA 2: IMPORT GRACZY
  // ==========================================
  const handleImportPlayers = async () => {
    setIsProcessing(true); setLogs([]);
    try {
      const data = JSON.parse(playerJson)
      if (!Array.isArray(data)) throw new Error('To nie jest lista (JSON Array)!')
      addLog(`👤 Import Graczy: ${selectedDate}`)

      for (const item of data) {
        const name = item.name || item.Name
        const rawPower = item.power || item.Power
        const rawLevel = item.level || item.Level || item.town_hall_level
        // --- POPRAWKA: CZYSZCZENIE TAGU ---
        // Pobieramy tag, usuwamy spacje I NAWIASY [], żeby zawsze szukał czystego "ITA"
        let rawTag = item.alliance_tag || item.tag || defaultTag || ''
        const tag = rawTag.replace(/[\[\]]/g, '').trim().toUpperCase() // np. "[ITA]" -> "ITA"

        if (!name || !rawPower) continue

        const powerVal = parsePower(rawPower)
        const levelVal = parseLevel(rawLevel)

        // A. ID Sojuszu
        let allianceId = null
        if (tag) {
            const { data: existingAll } = await supabase.from('alliances').select('id').eq('tag', tag).single()
            if (existingAll) {
                allianceId = existingAll.id
            } else {
                const { data: newAll } = await supabase.from('alliances').insert({ tag: tag, name: 'Unknown (Auto)', status: 'NEUTRAL' }).select().single()
                if (newAll) {
                    allianceId = newAll.id
                    addLog(`🆕 Utworzono nowy sojusz: [${tag}]`)
                }
            }
        }

        // B. Upsert Gracza
        let playerId = null
        const { data: existingPlayer } = await supabase.from('players').select('id, alliance_id').eq('name', name).single()

        if (existingPlayer) {
            playerId = existingPlayer.id
            if (allianceId && existingPlayer.alliance_id !== allianceId) {
                await supabase.from('players').update({ alliance_id: allianceId }).eq('id', playerId)
                addLog(`🔀 ${name} zmienił sojusz -> [${tag}]`)
            }
        } else {
            const { data: newPlayer } = await supabase.from('players').insert({ name: name, alliance_id: allianceId, status: 'ACTIVE' }).select().single()
            if (newPlayer) {
                playerId = newPlayer.id
                addLog(`✨ Nowy gracz: ${name}`)
            }
        }

        // C. Snapshot Historii
        if (playerId) {
            const { data: existingSnap } = await supabase.from('player_snapshots').select('id').eq('player_id', playerId).eq('recorded_at', selectedDate).single()

            if (existingSnap) {
                await supabase.from('player_snapshots').update({ power: powerVal, town_hall_level: levelVal, alliance_id: allianceId }).eq('id', existingSnap.id)
            } else {
                await supabase.from('player_snapshots').insert({ player_id: playerId, power: powerVal, town_hall_level: levelVal, alliance_id: allianceId, recorded_at: selectedDate })
            }
        }
      }
      addLog('🏁 Zakończono import graczy!')
    } catch (e: any) { addLog(`🔥 BŁĄD: ${e.message}`) } finally { setIsProcessing(false) }
  }


  // ==========================================
  // LOGIKA 3: GENERATOR EVENTÓW
  // ==========================================
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

// ==========================================
  // LOGIKA 4: MERGE TOOL (FUZJA SOJUSZY)
  // ==========================================
  const handleMergeAlliances = async () => {
    if (!mergeOldId || !mergeNewId) {
        alert('Podaj oba ID sojuszy!')
        return
    }
    if (mergeOldId === mergeNewId) {
        alert('ID muszą być różne!')
        return
    }

    if (!confirm(`⚠️ UWAGA! \nCzy na pewno chcesz scalić sojusz ID #${mergeNewId} (Nowy) do sojuszu ID #${mergeOldId} (Stary)?\n\nTo usunie sojusz #${mergeNewId} i przeniesie jego historię do #${mergeOldId}. Tej operacji nie da się cofnąć.`)) {
        return
    }

    setIsProcessing(true)
    try {
        const { error } = await supabase.rpc('merge_alliances', {
            old_id: parseInt(mergeOldId),
            new_id: parseInt(mergeNewId)
        })

        if (error) throw error

        addLog(`✅ Sukces! Sojusz #${mergeNewId} został wchłonięty przez #${mergeOldId}.`)
        setMergeOldId('')
        setMergeNewId('')
        alert('Fuzja zakończona sukcesem! Stary sojusz ma teraz nową nazwę i historię obu.')
    } catch (e: any) {
        addLog(`🔥 Błąd Fuzji: ${e.message}`)
        alert(`Błąd: ${e.message}`)
    } finally {
        setIsProcessing(false)
    }
  }
  // ==========================================
  // RENDER (UI)
  // ==========================================
  return (
    <main className="min-h-screen bg-[#1a1a1a] text-[#e0e0e0] p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <Header />

        <div className="flex justify-between items-center mb-4">
             <h1 className="text-3xl font-bold text-white">{t('import.title')}</h1>
             <a href="/" className="text-blue-400 hover:underline">← {t('import.back')}</a>
        </div>

        {/* --- PRZEŁĄCZNIK ZAKŁADEK (3 OPCJE) --- */}
        <div className="flex border-b border-gray-700 mb-6 overflow-x-auto">
            <button onClick={() => setActiveTab('alliances')}
                className={`px-6 py-3 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === 'alliances' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                {t('import.tab.alliances')}
            </button>
            <button onClick={() => setActiveTab('players')}
                className={`px-6 py-3 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === 'players' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                {t('import.tab.players')}
            </button>
            <button onClick={() => setActiveTab('events')}
                className={`px-6 py-3 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === 'events' ? 'border-orange-500 text-orange-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                📅 EVENTS
            </button>
        </div>


        {/* =======================
            ZAKŁADKA 1: SOJUSZE
           ======================= */}
        {activeTab === 'alliances' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-left-4 duration-300">
                <section>
                    <h2 className="text-blue-400 font-bold text-xl mb-4">📥 {t('import.json.title')}</h2>
                    <div className="bg-[#252525] p-6 rounded border border-gray-700 space-y-4">
                        <div className="flex gap-4 items-center">
                            <label className="text-sm font-bold text-gray-400">{t('import.json.date')}</label>
                            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-[#333] text-white p-2 rounded border border-gray-600"/>
                        </div>
                        <textarea className="w-full h-32 bg-[#333] border border-gray-600 rounded p-4 font-mono text-sm text-green-400"
                        value={jsonInput} onChange={e => setJsonInput(e.target.value)} placeholder={t('import.json.placeholder')} />
                        <button onClick={handleImportAlliances} disabled={isProcessing} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded">
                        🚀 {t('import.json.btn')}
                        </button>
                    </div>
                </section>
{/* Narzędzie Fuzji (Rebrand Fixer) */}
                <section className="bg-yellow-900/10 border border-yellow-600/30 p-6 rounded-xl">
                    <h2 className="text-yellow-500 font-bold text-xl mb-4">🧬 Narzędzie Fuzji / Rebrandingu</h2>
                    <p className="text-xs text-gray-400 mb-4">
                        Użyj tego, gdy sojusz zmienił nazwę i system stworzył nowy zamiast zaktualizować stary. 
                        Wszystkie dane z <strong>Nowego ID</strong> zostaną przeniesione do <strong>Starego ID</strong>.
                    </p>
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Stary ID (Ten z historią)</label>
                            <input 
                                type="number" 
                                placeholder="np. 15"
                                value={mergeOldId} 
                                onChange={e => setMergeOldId(e.target.value)} 
                                className="bg-[#333] text-white p-2 rounded border border-gray-600 w-full font-mono text-green-400 font-bold"
                            />
                        </div>
                        <div className="text-2xl text-gray-600 mb-1">←</div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Nowy ID (Ten zły/nowy)</label>
                            <input 
                                type="number" 
                                placeholder="np. 28"
                                value={mergeNewId} 
                                onChange={e => setMergeNewId(e.target.value)} 
                                className="bg-[#333] text-white p-2 rounded border border-gray-600 w-full font-mono text-red-400 font-bold"
                            />
                        </div>
                        <button 
                            onClick={handleMergeAlliances} 
                            disabled={isProcessing}
                            className="py-2 px-6 bg-yellow-700 hover:bg-yellow-600 text-white font-bold rounded shadow-lg transition-colors"
                        >
                            🔗 SCAL SOJUSZE
                        </button>
                    </div>
                </section>

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
        )}


        {/* =======================
            ZAKŁADKA 2: GRACZE
           ======================= */}
        {activeTab === 'players' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <section>
                    <div className="bg-[#252525] p-6 rounded border border-gray-700 space-y-4 shadow-xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold block mb-1">{t('import.json.date')}</label>
                                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} 
                                    className="w-full bg-[#333] text-white p-2 rounded border border-gray-600"/>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold block mb-1">{t('import.players.default_tag')}</label>
                                <input type="text" value={defaultTag} onChange={e => setDefaultTag(e.target.value)} 
                                    placeholder="np. LMN (jeśli JSON nie ma tagu)"
                                    className="w-full bg-[#333] text-white p-2 rounded border border-gray-600 font-mono text-purple-400 placeholder-gray-600"/>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold block mb-1">{t('import.players.json_label')}</label>
                            <textarea className="w-full h-48 bg-[#333] border border-gray-600 rounded p-4 font-mono text-sm text-purple-300"
                                value={playerJson} onChange={e => setPlayerJson(e.target.value)} 
                                placeholder='[ { "name": "L E M O N", "power": "66.9M", "level": "Gold 1", "alliance_tag": "ITA" }, ... ]' 
                            />
                            <p className="text-xs text-gray-500 mt-1">{t('import.players.info')}</p>
                        </div>

                        <button onClick={handleImportPlayers} disabled={isProcessing} 
                            className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded shadow-lg shadow-purple-900/50 transition-all">
                             {t('import.players.btn')} 🚀
                        </button>
                    </div>
                </section>
            </div>
        )}


        {/* =======================
            ZAKŁADKA 3: EVENTY
           ======================= */}
        {activeTab === 'events' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <section className="bg-orange-900/10 border border-orange-500/30 p-6 rounded-xl">
                    <h2 className="text-orange-400 font-bold text-xl mb-4">📅 {t('import.gen.title')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                        <label className="text-xs text-gray-400 uppercase font-bold block mb-2">{t('import.gen.type')}</label>
                        <select className="w-full bg-[#333] p-3 rounded border border-gray-600 focus:border-orange-500 text-white font-bold"
                            value={template} onChange={e => setTemplate(e.target.value)}>
                            <option value="MANUAL">Manual</option>
                            <option value="KVK">⚔️ KvK</option>
                            <option value="BRAWL">🏆 Alliance Brawl</option>
                        </select>
                        {template === 'KVK' && (
                            <div className="mt-2">
                            <label className="text-xs text-orange-400 uppercase font-bold">{t('import.gen.kvk_num')}</label>
                            <input type="number" value={kvkNumber} onChange={e => setKvkNumber(e.target.value)}
                                className="w-20 ml-2 bg-[#222] border border-orange-500 rounded p-1 text-white text-center font-bold" />
                            </div>
                        )}
                        </div>
                        <div>
                        <label className="text-xs text-gray-400 uppercase font-bold block mb-2">{t('import.gen.date')}</label>
                        <input type="date" className="w-full bg-[#333] p-3 rounded border border-gray-600 text-white"
                            value={startDate} onChange={e => setStartDate(e.target.value)} />
                        </div>
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
                        className="col-span-1 md:col-span-2 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded transition-colors shadow-lg shadow-orange-900/50">
                        ⚡ {t('import.gen.btn')}
                        </button>
                    </div>
                </section>
            </div>
        )}

        {/* --- KONSOLA LOGÓW --- */}
        {logs.length > 0 && (
            <div className="bg-black/80 p-4 rounded border-t-4 border-gray-600 max-h-60 overflow-y-auto font-mono text-xs">
                {logs.map((l,i) => (
                    <div key={i} className={`mb-1 ${l.includes('BŁĄD') ? 'text-red-400' : l.includes('Nowy') || l.includes('Dodano') ? 'text-green-400' : 'text-gray-400'}`}>
                        {l}
                    </div>
                ))}
            </div>
        )}

      </div>
    </main>
  )
}