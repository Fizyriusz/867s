'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase'
import { parsePower, parseLevel } from '@/utils/parsers'

type Player = {
    id: number
    name: string
    town_hall_level: number | null
    power: number | null
    marches: number | null
    notes: string | null
    is_active: boolean
    alliance_id: number | null
}

const TARGET_ALLIANCE_TAG = 'VIP' // Hardcoded for now as requested

export default function MembersTab() {
    const [players, setPlayers] = useState<Player[]>([])
    const [loading, setLoading] = useState(true)
    const [targetAllianceId, setTargetAllianceId] = useState<number | null>(null)
    const [filterName, setFilterName] = useState('')
    const [showInactive, setShowInactive] = useState(false)
    const [newPlayer, setNewPlayer] = useState({ name: '', th: '', power: '', marches: '' })

    const supabase = createClient()

    useEffect(() => {
        fetchAllianceAndPlayers()
    }, [])

    const fetchAllianceAndPlayers = async () => {
        setLoading(true)

        // 1. Get Target Alliance ID
        const { data: allianceData } = await supabase
            .from('alliances')
            .select('id')
            .ilike('tag', TARGET_ALLIANCE_TAG) // Case insensitive
            .single()

        if (!allianceData) {
            alert(`Nie znaleziono sojuszu o tagu: ${TARGET_ALLIANCE_TAG}`)
            setLoading(false)
            return
        }

        const allianceId = allianceData.id
        setTargetAllianceId(allianceId)

        // 2. Fetch Players for this Alliance
        const { data, error } = await supabase
            .from('players')
            .select('*')
            .eq('alliance_id', allianceId)
            .order('name', { ascending: true })

        if (error) {
            console.error('Error fetching players:', error)
            alert('Błąd pobierania graczy!')
        } else {
            setPlayers(data as Player[] || [])
        }
        setLoading(false)
    }

    const handleAddPlayer = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newPlayer.name || !targetAllianceId) return

        const payload = {
            name: newPlayer.name,
            alliance_id: targetAllianceId, // Auto-assign to VIP
            town_hall_level: newPlayer.th ? parseInt(newPlayer.th) : null,
            power: newPlayer.power ? parsePower(newPlayer.power) : null,
            marches: newPlayer.marches ? parseInt(newPlayer.marches) : null,
            is_active: true
        }

        const { error } = await supabase.from('players').insert(payload)

        if (error) {
            alert('Błąd dodawania: ' + error.message)
        } else {
            setNewPlayer({ name: '', th: '', power: '', marches: '' })
            fetchAllianceAndPlayers()
        }
    }

    const handleUpdate = async (id: number, field: string, value: any) => {
        // Optimistic update
        setPlayers(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))

        const { error } = await supabase.from('players').update({ [field]: value }).eq('id', id)
        if (error) {
            console.error('Update failed:', error)
            fetchAllianceAndPlayers() // Revert on error
        }
    }

    const toggleActive = async (id: number, currentStatus: boolean) => {
        if (!confirm(`Czy na pewno chcesz zmienić status aktywności gracza?`)) return
        await handleUpdate(id, 'is_active', !currentStatus)
    }

    // Filter logic
    const filteredPlayers = players.filter(p => {
        if (!showInactive && !p.is_active) return false
        if (filterName && !p.name.toLowerCase().includes(filterName.toLowerCase())) return false
        return true
    })

    const formatPower = (val: number | null) => {
        if (!val) return '-'
        if (val >= 1000000000) return `${(val / 1000000000).toFixed(2)}B`
        if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`
        if (val >= 1000) return `${(val / 1000).toFixed(0)}k`
        return val.toLocaleString()
    }

    return (
        <div className="space-y-6">

            {/* ADD PLAYER FORM */}
            <div className="bg-[#333] p-4 rounded border border-gray-600">
                <h3 className="font-bold text-gray-300 mb-4 text-sm uppercase">Dodaj nowego członka</h3>
                <form onSubmit={handleAddPlayer} className="flex flex-col md:flex-row gap-2">
                    <input
                        type="text" placeholder="Nick"
                        value={newPlayer.name} onChange={e => setNewPlayer({ ...newPlayer, name: e.target.value })}
                        className="bg-[#222] border border-gray-600 rounded p-2 text-white flex-grow" required
                    />
                    <input
                        type="number" placeholder="TH (np. 25)"
                        value={newPlayer.th} onChange={e => setNewPlayer({ ...newPlayer, th: e.target.value })}
                        className="bg-[#222] border border-gray-600 rounded p-2 text-white w-24"
                    />
                    <input
                        type="text" placeholder="Moc (np. 45M)"
                        value={newPlayer.power} onChange={e => setNewPlayer({ ...newPlayer, power: e.target.value })}
                        className="bg-[#222] border border-gray-600 rounded p-2 text-white w-32"
                    />
                    <select
                        value={newPlayer.marches} onChange={e => setNewPlayer({ ...newPlayer, marches: e.target.value })}
                        className="bg-[#222] border border-gray-600 rounded p-2 text-white w-24"
                    >
                        <option value="">Marsze</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                        <option value="6">6</option>
                        <option value="7">7</option>
                    </select>
                    <button type="submit" className="bg-green-700 hover:bg-green-600 text-white px-6 py-2 rounded font-bold">
                        Dodaj
                    </button>
                </form>
            </div>

            {/* FILTERS */}
            <div className="flex justify-between items-center text-sm text-gray-400">
                <div className="flex items-center gap-2">
                    <span>Szukaj:</span>
                    <input
                        type="text" value={filterName} onChange={e => setFilterName(e.target.value)}
                        className="bg-[#222] border border-gray-600 rounded px-2 py-1 text-white"
                        placeholder="..."
                    />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} />
                    Pokaż nieaktywnych
                </label>
            </div>

            {/* TABLE */}
            <div className="bg-[#252525] rounded border border-gray-700 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-[#1f1f1f] text-gray-500 uppercase font-mono text-xs">
                        <tr>
                            <th className="p-3">Nick</th>
                            <th className="p-3 w-20 text-center">TH</th>
                            <th className="p-3 w-32 text-right">Power</th>
                            <th className="p-3 w-20 text-center">Marsze</th>
                            <th className="p-3 w-20 text-center">Status</th>
                            <th className="p-3 w-12 text-center">X</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {loading && <tr><td colSpan={6} className="p-4 text-center">Ładowanie...</td></tr>}
                        {!loading && filteredPlayers.map(player => (
                            <tr key={player.id} className={`hover:bg-[#303030] group ${!player.is_active ? 'opacity-50 grayscale' : ''}`}>
                                <td className="p-3 font-bold text-white">
                                    <input
                                        type="text" value={player.name}
                                        onChange={(e) => handleUpdate(player.id, 'name', e.target.value)} // Live edit name might be risky, but handy
                                        className="bg-transparent border-none outline-none w-full text-white font-bold placeholder-gray-600 focus:bg-[#444] rounded px-1"
                                    />
                                </td>
                                <td className="p-3 text-center">
                                    <input
                                        type="number" value={player.town_hall_level || ''}
                                        placeholder="-"
                                        onChange={(e) => handleUpdate(player.id, 'town_hall_level', e.target.value ? parseInt(e.target.value) : null)}
                                        className="bg-transparent text-center border-none outline-none w-full text-blue-400 font-mono focus:bg-[#444] rounded px-1"
                                    />
                                </td>
                                <td className="p-3 text-right font-mono text-yellow-500">
                                    {/* Power is tricky to edit as raw number vs formatted string. 
                                        For now, simplifed: just display formatted, no inline edit directly here 
                                        OR allow string input and auto-parse on blur. Let's do string input on blur.
                                    */}
                                    <input
                                        type="text"
                                        defaultValue={formatPower(player.power)}
                                        onBlur={(e) => {
                                            const val = parsePower(e.target.value)
                                            if (val !== player.power) handleUpdate(player.id, 'power', val)
                                            e.target.value = formatPower(val) // reformat
                                        }}
                                        className="bg-transparent text-right border-none outline-none w-full focus:bg-[#444] rounded px-1"
                                    />
                                </td>
                                <td className="p-3 text-center">
                                    <select
                                        value={player.marches || ''}
                                        onChange={(e) => handleUpdate(player.id, 'marches', e.target.value ? parseInt(e.target.value) : null)}
                                        className="bg-transparent text-center text-gray-300 outline-none cursor-pointer hover:text-white"
                                    >
                                        <option value="">?</option>
                                        <option value="4">4</option>
                                        <option value="5">5</option>
                                        <option value="6">6</option>
                                        <option value="7">7</option>
                                    </select>
                                </td>
                                <td className="p-3 text-center">
                                    <button
                                        onClick={() => toggleActive(player.id, player.is_active)}
                                        className={`px-2 py-0.5 rounded textxs font-bold ${player.is_active ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-500'}`}
                                    >
                                        {player.is_active ? 'ACTIVE' : 'INACTIVE'}
                                    </button>
                                </td>
                                <td className="p-3 text-center">
                                    {/* Delete Button (Logic in HQ was soft-delete via inactive, but maybe we want hard delete?) 
                                        Let's stick to inactive for now, this slot is just placeholder
                                    */}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="text-right text-xs text-gray-500">Wszystkie zmiany zapisują się automatycznie (po wyjściu z pola).</div>
        </div>
    )
}
