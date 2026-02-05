'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase'

type GameEvent = {
    id: number
    title: string
    event_type: 'KVK' | 'KVK_WAR' | 'BRAWL' | 'OTHER'
    start_date: string
    end_date: string
    description: string | null
    created_at: string
}

export default function EventsTab() {
    const [events, setEvents] = useState<GameEvent[]>([])
    const [loading, setLoading] = useState(true)

    // Form State
    const [template, setTemplate] = useState('MANUAL')
    const [startDate, setStartDate] = useState('')
    const [kvkNumber, setKvkNumber] = useState('3')
    const [manualEvent, setManualEvent] = useState({ title: '', event_type: 'OTHER', end_date: '', description: '' })
    const [isProcessing, setIsProcessing] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        fetchEvents()
    }, [])

    const fetchEvents = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('game_events')
            .select('*')
            .order('start_date', { ascending: true }) // Najbliższe najpierw

        if (error) console.error('Error fetching events:', error)
        else setEvents(data as GameEvent[] || [])
        setLoading(false)
    }

    const handleGenerateEvents = async () => {
        if (!startDate) { alert('Wybierz datę początkową!'); return }
        setIsProcessing(true)

        const eventsToCreate: any[] = []
        const start = new Date(startDate)
        const addDays = (date: Date, days: number) => {
            const r = new Date(date); r.setDate(r.getDate() + days); return r.toISOString().split('T')[0]
        }
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
                if (!manualEvent.title || !manualEvent.end_date) throw new Error('Wypełnij wszystkie pola dla manualnego eventu!')
                eventsToCreate.push({ title: manualEvent.title, event_type: manualEvent.event_type, start_date: startDate, end_date: manualEvent.end_date, description: manualEvent.description })
            }

            const { error } = await supabase.from('game_events').insert(eventsToCreate)
            if (error) throw error

            alert(`Sukces! Utworzono eventy.`)
            setManualEvent({ title: '', event_type: 'OTHER', end_date: '', description: '' })
            fetchEvents()
        } catch (e: any) {
            alert('Error: ' + e.message)
        } finally {
            setIsProcessing(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Usunąć ten event?')) return
        const { error } = await supabase.from('game_events').delete().eq('id', id)
        if (error) alert('Błąd usuwania')
        else fetchEvents()
    }

    const getEventTypeColor = (type: string) => {
        switch (type) {
            case 'KVK': return 'text-orange-400 border-orange-900/50 bg-orange-900/10'
            case 'KVK_WAR': return 'text-red-500 border-red-900/50 bg-red-900/10 animate-pulse'
            case 'BRAWL': return 'text-purple-400 border-purple-900/50 bg-purple-900/10'
            default: return 'text-gray-400 border-gray-700 bg-gray-800'
        }
    }

    return (
        <div className="space-y-8">
            {/* GENERATOR */}
            <section className="bg-orange-900/10 border border-orange-500/30 p-6 rounded-xl">
                <h2 className="text-orange-400 font-bold text-xl mb-4">📅 Kreator Eventów</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold block mb-2">Szablon</label>
                        <select className="w-full bg-[#333] p-3 rounded border border-gray-600 focus:border-orange-500 text-white font-bold"
                            value={template} onChange={e => setTemplate(e.target.value)}>
                            <option value="MANUAL">Manualny (Pojedynczy)</option>
                            <option value="KVK">⚔️ KvK (Cały cykl)</option>
                            <option value="BRAWL">🏆 Alliance Brawl</option>
                        </select>
                        {template === 'KVK' && (
                            <div className="mt-2 flex items-center gap-2">
                                <label className="text-xs text-orange-400 uppercase font-bold">Numer KvK:</label>
                                <input type="number" value={kvkNumber} onChange={e => setKvkNumber(e.target.value)}
                                    className="w-20 bg-[#222] border border-orange-500 rounded p-1 text-white text-center font-bold" />
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold block mb-2">Data Startu</label>
                        <input type="date" className="w-full bg-[#333] p-3 rounded border border-gray-600 text-white"
                            value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>

                    {template === 'MANUAL' && (
                        <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-700 pt-4 mt-2">
                            <input type="text" placeholder="Tytuł" className="bg-[#333] p-2 rounded border border-gray-600 text-white"
                                value={manualEvent.title} onChange={e => setManualEvent({ ...manualEvent, title: e.target.value })} />
                            <input type="date" className="bg-[#333] p-2 rounded border border-gray-600 text-white"
                                value={manualEvent.end_date} onChange={e => setManualEvent({ ...manualEvent, end_date: e.target.value })} />
                            <select className="bg-[#333] p-2 rounded border border-gray-600 text-white"
                                value={manualEvent.event_type} onChange={e => setManualEvent({ ...manualEvent, event_type: e.target.value as any })}>
                                <option value="OTHER">Inne</option><option value="KVK">KvK</option><option value="BRAWL">Brawl</option>
                            </select>
                        </div>
                    )}

                    <button onClick={handleGenerateEvents} disabled={isProcessing}
                        className="col-span-1 md:col-span-2 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded transition-colors shadow-lg shadow-orange-900/50 disabled:opacity-50">
                        {isProcessing ? 'Przetwarzanie...' : '⚡ Generuj Eventy'}
                    </button>
                </div>
            </section>

            {/* LISTA EVENTÓW */}
            <section>
                <h3 className="text-xl font-bold text-white mb-4">Nadchodzące Wydarzenia</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loading && <p className="text-gray-500">Ładowanie...</p>}
                    {events.map(event => (
                        <div key={event.id} className={`p-4 rounded border flex flex-col justify-between h-full ${getEventTypeColor(event.event_type)}`}>
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold uppercase tracking-wider opacity-75">{event.event_type}</span>
                                    <button onClick={() => handleDelete(event.id)} className="text-red-400 hover:text-red-200 text-xs font-bold px-2 py-1 bg-black/20 rounded">USUŃ</button>
                                </div>
                                <h4 className="font-bold text-lg mb-1">{event.title}</h4>
                                <p className="text-sm opacity-80 mb-4">{event.description}</p>
                            </div>
                            <div className="pt-4 border-t border-white/10 mt-auto">
                                <div className="flex justify-between text-xs font-mono">
                                    <span>START: {new Date(event.start_date).toLocaleDateString()}</span>
                                    <span>KONIEC: {new Date(event.end_date).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {!loading && events.length === 0 && <p className="text-gray-500 italic">Brak zaplanowanych wydarzeń.</p>}
                </div>
            </section>
        </div>
    )
}
