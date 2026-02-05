'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase'
import Header from '@/components/Header'
import { useLanguage } from '@/app/context/LanguageContext'
import { parsePower, parseLevel } from '@/utils/parsers'
import { createClient } from '@supabase/supabase-js'

// --- OLD DB CONFIG (MIGRATION SOURCE) ---
const OLD_SUPABASE_URL = 'https://tkpadqrbkknrscxjtatr.supabase.co'
const OLD_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrcGFkcXJia2tucnNjeGp0YXRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzAxMDEsImV4cCI6MjA3NjY0NjEwMX0._KoZoOjLVW_2JxM8FBVLXuPQkJ5lP3tgCMPrgTj9q0A'

export default function ImportPage() {
    const { t } = useLanguage()

    // --- ZAKŁADKI ---
    const [activeTab, setActiveTab] = useState<'alliances' | 'players' | 'events' | 'migration'>('alliances')

    // --- DATA FETCHING (Current DB) ---
    const [alliancesList, setAlliancesList] = useState<{ id: number, tag: string, name: string }[]>([])

    // --- STATE ---
    const [logs, setLogs] = useState<string[]>([])
    const [isProcessing, setIsProcessing] = useState(false)

    // Tab: Alliances
    const [jsonInput, setJsonInput] = useState('')
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [mergeOldId, setMergeOldId] = useState('')
    const [mergeNewId, setMergeNewId] = useState('')

    // Tab: Players
    const [playerJson, setPlayerJson] = useState('')
    const [selectedAllianceId, setSelectedAllianceId] = useState<string>('') // Selected from dropdown

    // Tab: Events
    const [template, setTemplate] = useState('MANUAL')
    const [startDate, setStartDate] = useState('')
    const [kvkNumber, setKvkNumber] = useState('3')
    const [manualEvent, setManualEvent] = useState({ title: '', event_type: 'OTHER', end_date: '', description: '' })
    const [deleteDate, setDeleteDate] = useState('')

    const addLog = (msg: string) => setLogs(prev => [msg, ...prev])

    useEffect(() => {
        fetchAlliances()
    }, [])

    const fetchAlliances = async () => {
        const { data } = await supabase.from('alliances').select('id, tag, name').order('tag', { ascending: true })
        if (data) setAlliancesList(data)
    }

    // ==========================================
    // 1. IMPORT SOJUSZY
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
                // Find by TAG
                const { data: existing } = await supabase.from('alliances').select('id').eq('tag', item.tag).single()

                if (existing) {
                    allianceId = existing.id
                } else {
                    const { data: created } = await supabase.from('alliances').insert({ tag: item.tag, name: item.name || 'Unknown', status: 'NEUTRAL' }).select().single()
                    if (created) allianceId = created.id
                }

                if (allianceId) {
                    const powerVal = parsePower(item.power)
                    // Upsert Snapshot
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
            fetchAlliances() // Refresh list
        } catch (e: any) { addLog(`🔥 BŁĄD: ${e.message}`) } finally { setIsProcessing(false) }
    }

    // ==========================================
    // 2. IMPORT GRACZY (With Alliance Selector)
    // ==========================================
    const handleImportPlayers = async () => {
        setIsProcessing(true); setLogs([]);
        try {
            const data = JSON.parse(playerJson)
            if (!Array.isArray(data)) throw new Error('To nie jest lista (JSON Array)!')

            // Determine Alliance Logic
            let forcedAllianceId: number | null = null
            let forcedAllianceTag: string = ''

            if (selectedAllianceId) {
                const found = alliancesList.find(a => a.id === parseInt(selectedAllianceId))
                if (found) {
                    forcedAllianceId = found.id
                    forcedAllianceTag = found.tag
                    addLog(`🔒 Wymuszono sojusz: [${found.tag}] dla wszystkich importowanych graczy.`)
                }
            }

            addLog(`👤 Import Graczy: ${selectedDate}`)

            for (const item of data) {
                const name = item.name || item.Name
                const rawPower = item.power || item.Power
                const rawLevel = item.level || item.Level || item.town_hall_level

                if (!name || !rawPower) continue

                const powerVal = parsePower(rawPower)
                const levelVal = parseLevel(rawLevel)

                // A. ID Sojuszu
                let allianceId = forcedAllianceId // Default to selection

                // If NO selection, try to infer from JSON tag
                if (!allianceId) {
                    let rawTag = item.alliance_tag || item.tag || ''
                    const tag = rawTag.replace(/[\[\]]/g, '').trim().toUpperCase() // "[ITA]" -> "ITA"

                    if (tag) {
                        const { data: existingAll } = await supabase.from('alliances').select('id').eq('tag', tag).single()
                        if (existingAll) {
                            allianceId = existingAll.id
                        } else {
                            const { data: newAll } = await supabase.from('alliances').insert({ tag: tag, name: 'Unknown (Auto)', status: 'NEUTRAL' }).select().single()
                            if (newAll) {
                                allianceId = newAll.id
                                addLog(`🆕 Utworzono nowy sojusz z JSON: [${tag}]`)
                            }
                        }
                    }
                }

                // B. Upsert Gracza (By Name)
                let playerId = null
                const { data: existingPlayer } = await supabase.from('players').select('id, alliance_id, town_hall_level, power').eq('name', name).single()

                if (existingPlayer) {
                    playerId = existingPlayer.id
                    const updatePayload: any = {}

                    // Check changes to update LIVE table (Current Status)
                    if (allianceId && existingPlayer.alliance_id !== allianceId) updatePayload.alliance_id = allianceId
                    if (levelVal > (existingPlayer.town_hall_level || 0)) updatePayload.town_hall_level = levelVal
                    if (powerVal !== existingPlayer.power) updatePayload.power = powerVal

                    if (Object.keys(updatePayload).length > 0) {
                        await supabase.from('players').update(updatePayload).eq('id', playerId)
                        addLog(`📝 Aktualizacja gracza: ${name}`)
                    }
                } else {
                    const { data: newPlayer } = await supabase.from('players').insert({
                        name: name,
                        alliance_id: allianceId,
                        town_hall_level: levelVal,
                        power: powerVal,
                        status: 'ACTIVE',
                        is_active: true
                    }).select().single()
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
            fetchAlliances()
        } catch (e: any) { addLog(`🔥 BŁĄD: ${e.message}`) } finally { setIsProcessing(false) }
    }


    // ==========================================
    // 3. GENERATOR EVENTÓW
    // ==========================================
    const handleGenerateEvents = async () => { /* ... (Same as before) ... */
        // Skrócone dla czytelności pliku w tym requeście, ale w praktyce kod musi tu być. 
        // Przywracam pełny kod, żeby nie nadpisać "..."
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


    // ==========================================
    // 4. MIGRATION TOOL (From Old DB)
    // ==========================================
    const handleMigration = async () => {
        if (!confirm('Czy na pewno chcesz pobrać dane ze STAREJ bazy i wrzucić do NOWEJ?')) return

        setIsProcessing(true); setLogs([]);
        addLog('🚀 Rozpoczynam migrację...')

        try {
            // Init Old Client
            const oldClient = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_KEY)

            // --- 1. GRACZE ---
            addLog('📥 Pobieram starych graczy...')
            const { data: oldPlayers, error: oldErr } = await oldClient.from('players').select('*')

            if (oldErr) throw oldErr
            if (!oldPlayers) throw new Error('No players found in old DB')

            addLog(`Znaleziono ${oldPlayers.length} graczy. Przetwarzam...`)

            // Prepare Payload
            // Map tags from old DB? Old DB didn't seem to have alliance_id foreign key, it had 'alliance_tag' maybe? 
            // Image 1 shows 'id', 'name', 'is_active', 'notes', 'th_level', 'marches', 'power_level'. No alliance_id column visible in screenshot.
            // Assuming user wants to keep them 'Unassigned' or we need to look for tags in names/notes?
            // Let's assume they are imported without alliance for now, OR we check if 'tag' exists in some other table.
            // Wait, 'kingshot-hq' code might hint.
            // In Image 0, there is NO 'alliances' table.

            for (const p of oldPlayers) {
                const powerVal = parsePower(p.power_level)

                // Upsert to new DB
                // We match by NAME.
                const { error: upsertErr } = await supabase.from('players').upsert({
                    name: p.name,
                    is_active: p.is_active,
                    notes: p.notes,
                    town_hall_level: p.th_level,
                    marches: p.marches,
                    power: powerVal,
                    // Alliance ID unknown, leaving null
                    status: p.is_active ? 'ACTIVE' : 'INACTIVE'
                }, { onConflict: 'name' })

                if (upsertErr) console.error('Upsert err:', upsertErr)
            }
            addLog('✅ Gracze zmigrowani!')

            // --- 2. EVENTS ---
            // TODO if needed

        } catch (e: any) {
            addLog(`🔥 BŁĄD MIGRACJI: ${e.message}`)
        } finally {
            setIsProcessing(false)
        }
    }

    const handleGlobalDelete = async () => {
        if (!deleteDate || !confirm(`Delete data for ${deleteDate}?`)) return
        setIsProcessing(true)
        await supabase.from('alliance_snapshots').delete({ count: 'exact' }).eq('recorded_at', deleteDate)
        setIsProcessing(false)
        alert('Deleted.')
    }

    const handleMergeAlliances = async () => {
        if (!mergeOldId || !mergeNewId) { alert('Podaj oba ID!'); return }
        if (mergeOldId === mergeNewId) return
        if (!confirm('Scalić?')) return
        setIsProcessing(true)
        try {
            const { error } = await supabase.rpc('merge_alliances', { old_id: parseInt(mergeOldId), new_id: parseInt(mergeNewId) })
            if (error) throw error
            addLog('✅ Sukces fuzji.')
            setMergeOldId(''); setMergeNewId('')
        } catch (e: any) { addLog(`🔥 Błąd: ${e.message}`) } finally { setIsProcessing(false) }
    }


    return (
        <main className="min-h-screen bg-[#1a1a1a] text-[#e0e0e0] p-4 md:p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">

                <Header />

                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-3xl font-bold text-white">{t('import.title')}</h1>
                    <a href="/" className="text-blue-400 hover:underline">← {t('import.back')}</a>
                </div>

                {/* --- TABS --- */}
                <div className="flex border-b border-gray-700 mb-6 overflow-x-auto gap-4">
                    <button onClick={() => setActiveTab('alliances')} className={`pb-2 border-b-2 font-bold ${activeTab === 'alliances' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500'}`}>
                        {t('import.tab.alliances')}
                    </button>
                    <button onClick={() => setActiveTab('players')} className={`pb-2 border-b-2 font-bold ${activeTab === 'players' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-500'}`}>
                        {t('import.tab.players')}
                    </button>
                    <button onClick={() => setActiveTab('events')} className={`pb-2 border-b-2 font-bold ${activeTab === 'events' ? 'border-orange-500 text-orange-400' : 'border-transparent text-gray-500'}`}>
                        Events
                    </button>
                    <button onClick={() => setActiveTab('migration')} className={`pb-2 border-b-2 font-bold ${activeTab === 'migration' ? 'border-green-500 text-green-400' : 'border-transparent text-gray-500'}`}>
                        ♻️ Migracja
                    </button>
                </div>


                {/* --- 1. SOJUSZE --- */}
                {activeTab === 'alliances' && (
                    <div className="space-y-8 animate-in fade-in">
                        <div className="bg-[#252525] p-6 rounded border border-gray-700 space-y-4">
                            <label className="text-sm font-bold text-gray-400">Data & JSON</label>
                            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-[#333] text-white p-2 rounded" />
                            <textarea className="w-full h-32 bg-[#333] border border-gray-600 rounded p-4 font-mono text-sm text-green-400"
                                value={jsonInput} onChange={e => setJsonInput(e.target.value)} placeholder='[{"tag":"ABC", "power":"50M"}, ...]' />
                            <button onClick={handleImportAlliances} disabled={isProcessing} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded">Importuj Sojusze</button>
                        </div>

                        {/* Rebrand Tool */}
                        <div className="bg-yellow-900/10 border border-yellow-600/30 p-6 rounded space-y-4">
                            <h3 className="text-yellow-500 font-bold">Narzędzie Fuzji</h3>
                            <div className="flex gap-4">
                                <input type="number" placeholder="Old ID" value={mergeOldId} onChange={e => setMergeOldId(e.target.value)} className="bg-[#333] p-2 rounded border border-gray-600 w-20" />
                                <span>←</span>
                                <input type="number" placeholder="New ID" value={mergeNewId} onChange={e => setMergeNewId(e.target.value)} className="bg-[#333] p-2 rounded border border-gray-600 w-20" />
                                <button onClick={handleMergeAlliances} className="bg-yellow-700 px-4 rounded text-white font-bold">Scal</button>
                            </div>
                        </div>

                        {/* Delete Tool */}
                        <div className="bg-red-900/10 border border-red-900/50 p-6 rounded flex gap-4 items-center">
                            <h3 className="text-red-500 font-bold">Usuwanie Dnia</h3>
                            <input type="date" value={deleteDate} onChange={e => setDeleteDate(e.target.value)} className="bg-[#333] p-1 rounded border border-gray-600" />
                            <button onClick={handleGlobalDelete} className="bg-red-700 px-4 py-1 rounded text-white">Usuń</button>
                        </div>
                    </div>
                )}

                {/* --- 2. GRACZE --- */}
                {activeTab === 'players' && (
                    <div className="space-y-8 animate-in fade-in">
                        <div className="bg-[#252525] p-6 rounded border border-gray-700 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Data</label>
                                    <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full bg-[#333] text-white p-2 rounded border border-gray-600" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Przypisz do Sojuszu (Opcjonalne)</label>
                                    <select
                                        value={selectedAllianceId}
                                        onChange={e => setSelectedAllianceId(e.target.value)}
                                        className="w-full bg-[#333] text-white p-2 rounded border border-gray-600 text-purple-400 font-bold"
                                    >
                                        <option value="">-- Pobierz z JSON (Auto) --</option>
                                        {alliancesList.map(a => (
                                            <option key={a.id} value={a.id}>[{a.tag}] {a.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">Jeśli wybierzesz sojusz tutaj, pole "tag" w JSON zostanie zignorowane.</p>
                                </div>
                            </div>

                            <textarea className="w-full h-48 bg-[#333] border border-gray-600 rounded p-4 font-mono text-sm text-purple-300"
                                value={playerJson} onChange={e => setPlayerJson(e.target.value)}
                                placeholder='[ { "name": "Player 1", "power": "66.9M", "level": "Gold 1" }, ... ]' />

                            <button onClick={handleImportPlayers} disabled={isProcessing} className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded">
                                Importuj Graczy
                            </button>
                        </div>
                    </div>
                )}

                {/* --- 3. EVENTS --- */}
                {activeTab === 'events' && (
                    <div className="space-y-8 animate-in fade-in">
                        <div className="bg-orange-900/10 border border-orange-500/30 p-6 rounded-xl space-y-4">
                            <h2 className="text-orange-400 font-bold">Generator Eventów</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <select className="bg-[#333] p-2 rounded text-white" value={template} onChange={e => setTemplate(e.target.value)}>
                                    <option value="MANUAL">Manual</option>
                                    <option value="KVK">KvK</option>
                                    <option value="BRAWL">Brawl</option>
                                </select>
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-[#333] p-2 rounded text-white" />
                            </div>
                            {template === 'MANUAL' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" placeholder="Tytuł" value={manualEvent.title} onChange={e => setManualEvent({ ...manualEvent, title: e.target.value })} className="bg-[#333] p-2 rounded text-white" />
                                    <input type="date" value={manualEvent.end_date} onChange={e => setManualEvent({ ...manualEvent, end_date: e.target.value })} className="bg-[#333] p-2 rounded text-white" />
                                </div>
                            )}
                            <button onClick={handleGenerateEvents} className="w-full bg-orange-600 py-2 rounded text-white font-bold">Generuj</button>
                        </div>
                    </div>
                )}

                {/* --- 4. MIGRACJA --- */}
                {activeTab === 'migration' && (
                    <div className="space-y-8 animate-in fade-in">
                        <div className="bg-green-900/10 border border-green-500/30 p-6 rounded-xl">
                            <h2 className="text-green-400 font-bold text-xl mb-4">♻️ Migracja ze Starej Bazy</h2>
                            <p className="text-gray-400 mb-6">
                                To narzędzie połączy się z Twoją starą bazą (kingshot-hq) i pobierze listę wszystkich graczy,
                                przepisując ich moc, TH level oraz notatki do nowej bazy.
                                <br /><br />
                                <strong>Uwaga:</strong> Gracze zostaną zmigrowani bez przypisania do sojuszu (chyba że dodasz logikę mapowania po nazwach).
                            </p>

                            <button
                                onClick={handleMigration}
                                disabled={isProcessing}
                                className="w-full py-4 bg-green-700 hover:bg-green-600 text-white font-bold rounded shadow-lg shadow-green-900/50 text-xl"
                            >
                                {isProcessing ? 'Pracuję...' : 'START MIGRACJI'}
                            </button>

                            <div className="mt-4 p-4 bg-black/30 rounded text-xs text-gray-500 font-mono text-center">
                                Source: {OLD_SUPABASE_URL}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- ERROR LOGS --- */}
                {logs.length > 0 && (
                    <div className="bg-black/80 p-4 rounded border-t-4 border-gray-600 max-h-60 overflow-y-auto font-mono text-xs">
                        {logs.map((l, i) => <div key={i} className={`mb-1 ${l.includes('BŁĄD') ? 'text-red-400' : 'text-gray-400'}`}>{l}</div>)}
                    </div>
                )}

            </div>
        </main>
    )
}