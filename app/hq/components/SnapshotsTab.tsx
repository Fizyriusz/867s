'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase'

export default function SnapshotsTab() {
    const [lastSnapshot, setLastSnapshot] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [history, setHistory] = useState<any[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        fetchHistory()
    }, [])

    const fetchHistory = async () => {
        // Fetch distinct dates from alliance_snapshots to show history log
        // Note: Supabase doesn't support SELECT DISTINCT ON easily via JS client without RPC or raw SQL sometimes, 
        // but let's try a grouped approach or just fetch all and process client side for now (if not too big).
        // Actually, we can just list the last 5 days.

        const { data, error } = await supabase
            .from('alliance_snapshots')
            .select('recorded_at')
            .order('recorded_at', { ascending: false })
            .limit(100)

        if (data) {
            // Unikalne daty
            const uniqueDates = Array.from(new Set(data.map(d => d.recorded_at)))
            setHistory(uniqueDates)
            setLastSnapshot(uniqueDates[0] || null)
        }
    }

    const handleCreateSnapshot = async () => {
        const today = new Date().toISOString().split('T')[0]

        // Check if exists
        if (history.includes(today)) {
            if (!confirm(`Snapshot z dnia ${today} już istnieje. Chcesz go nadpisać/zaktualizować?`)) return
        }

        setIsProcessing(true)
        try {
            // 1. Snapshot Sojuszy
            // Pobieramy obecny stan sojuszy z tabeli alliances (power trzeba by mieć w tabeli alliances? 
            // W obecnym modelu power jest TYLKO w snapshotach? Nie, dashboard wyświetla current power.
            // Sprawdźmy DashboardTable.tsx... on bierze power z 'snapshots'.
            // Czekaj, 'alliances' ma tylko tag/name. Power jest w 'alliance_snapshots'.
            // WIĘC: Snapshot tworzy się przy IMPORCIE (ImportPage).
            // Tutaj "Ręczny Snapshot" to raczej kopia obecnego stanu graczy -> player_snapshots?

            // W kingshot-hq snapshot sojuszy robił się przy imporcie.
            // Snapshot graczy robił się przy imporcie graczy.

            // Więc co ma robić ten przycisk?
            // Może "Zamknij dzień"? Albo po prostu wyświetlać logi.
            // W starym HQ była opcja "Create Snapshot from Current State" - to kopiowało dane LIVE do tabeli historycznej.
            // Ale my nie mamy danych LIVE w tabeli 'players' (mamy, kolumny th/power dodaliśmy!).

            // Zatem: Kopiujemy power/th z tabeli 'players' do 'player_snapshots' dla dzisiaj.

            const { data: players } = await supabase.from('players').select('id, alliance_id, power, town_hall_level').not('power', 'is', null)

            if (!players || players.length === 0) throw new Error('Brak graczy do zapisania.')

            const payload = players.map(p => ({
                player_id: p.id,
                alliance_id: p.alliance_id,
                power: p.power,
                town_hall_level: p.town_hall_level,
                recorded_at: today
            }))

            // Upsert
            const { error } = await supabase.from('player_snapshots').upsert(payload, { onConflict: 'player_id, recorded_at' })

            if (error) throw error

            alert(`Zapisano stan ${players.length} graczy na dzień ${today}.`)
            fetchHistory()

        } catch (e: any) {
            alert('Błąd: ' + e.message)
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="space-y-8">
            <section className="bg-blue-900/10 border border-blue-500/30 p-6 rounded-xl">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-blue-400 font-bold text-xl">📸 Snapshot Managera</h2>
                        <p className="text-sm text-gray-400 mt-1">
                            Zapisuje obecny stan tabeli <strong>Players</strong> (Power, TH) do historii.
                            Używaj tego raz dziennie lub po dużej aktualizacji danych (np. ręcznej edycji).
                        </p>
                    </div>
                    <button
                        onClick={handleCreateSnapshot}
                        disabled={isProcessing}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded font-bold shadow-lg shadow-blue-900/50"
                    >
                        {isProcessing ? 'Zapisywanie...' : 'Zapisz Snapshot (Dziś)'}
                    </button>
                </div>
            </section>

            <section>
                <h3 className="text-white font-bold mb-4">Ostatnie Snapshoty (Gracze/Sojusze)</h3>
                <div className="bg-[#252525] rounded border border-gray-700 p-4">
                    {history.length === 0 ? <p className="text-gray-500">Brak historii.</p> : (
                        <ul className="space-y-2">
                            {history.map(date => (
                                <li key={date} className="flex items-center gap-2 text-sm font-mono text-gray-300">
                                    <span className="text-blue-400">●</span> {date}
                                    {date === new Date().toISOString().split('T')[0] && <span className="text-xs bg-blue-900/50 text-blue-300 px-1 rounded">DZIŚ</span>}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>
        </div>
    )
}
