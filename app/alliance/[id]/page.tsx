'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/utils/supabase'
import Header from '@/components/Header'
import PowerChart from '@/components/PowerChart' // Wykorzystujemy Twój komponent wykresu!
import Link from 'next/link'

// --- TYPY DANYCH ---
type Player = {
  id: number
  name: string
  power: number
  town_hall_level: number
  diff: number
  prevPower: number
}

type AllianceDetails = {
  id: number
  tag: string
  name: string
  status: string
  notes: string
}

type ChartDataPoint = {
  date: string
  power: number
}

// --- HELPERY FORMATOWANIA ---
const formatLevel = (lvl: number) => {
  if (lvl > 30) return `⭐️ TG ${lvl - 30}` // Truegold
  if (lvl === 30) return `🔥 Lv 30`
  if (lvl === 0) return `?`
  return `Lv ${lvl}`
}

const formatPower = (val: number) => {
  if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(2)}B`
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`
  return val.toLocaleString()
}

const formatDiff = (val: number) => {
  if (val === 0) return <span className="text-gray-600">-</span>
  const sign = val > 0 ? '+' : ''
  const color = val > 0 ? 'text-green-400' : 'text-red-400'
  const absVal = Math.abs(val)
  let txt = val.toLocaleString()
  
  if (absVal >= 1_000_000) txt = `${(absVal / 1_000_000).toFixed(1)}M`
  else if (absVal >= 1_000) txt = `${(absVal / 1_000).toFixed(1)}k`
  
  return <span className={`font-mono font-bold ${color}`}>{sign}{txt}</span>
}

export default function AlliancePage() {
  const params = useParams()
  const allianceId = params.id
  
  // Stan Aplikacji
  const [alliance, setAlliance] = useState<AllianceDetails | null>(null)
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]) // Dane do wykresu
  
  const [players, setPlayers] = useState<Player[]>([])
  const [dates, setDates] = useState<string[]>([])
  const [viewDate, setViewDate] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // 1. Pobieranie podstawowych danych (Info + Wykres Historii Sojuszu)
  useEffect(() => {
    const fetchBaseData = async () => {
        if (!allianceId) return

        // A. Info o sojuszu
        const { data: allData } = await supabase.from('alliances').select('*').eq('id', allianceId).single()
        setAlliance(allData)

        // B. Historia CAŁEGO sojuszu (do Twojego wykresu)
        const { data: history } = await supabase
            .from('alliance_snapshots')
            .select('total_power, recorded_at')
            .eq('alliance_id', allianceId)
            .order('recorded_at', { ascending: true })
        
        if (history) {
            const formattedChart = history.map(entry => ({
                date: new Date(entry.recorded_at).toLocaleDateString('pl-PL', { month: 'short', day: 'numeric' }),
                power: entry.total_power
            }))
            setChartData(formattedChart)
        }

        // C. Daty dostępne dla GRACZY (mogą być inne niż dla sojuszu)
        const { data: playerSnaps } = await supabase
            .from('player_snapshots')
            .select('recorded_at')
            .eq('alliance_id', allianceId)
            .order('recorded_at', { ascending: false })
        
        const uniqueDates = Array.from(new Set(playerSnaps?.map(s => s.recorded_at) || [])) as string[]
        setDates(uniqueDates)
        if (uniqueDates.length > 0) setViewDate(uniqueDates[0])
        else setLoading(false)
    }

    fetchBaseData()
  }, [allianceId])

  // 2. Pobieranie listy graczy przy zmianie daty
  useEffect(() => {
    if (!viewDate || !allianceId) return

    const fetchPlayers = async () => {
        setLoading(true)
        const dateIndex = dates.indexOf(viewDate)
        const prevDate = dates[dateIndex + 1]

        // Pobierz dzisiejszych
        const { data: current } = await supabase
            .from('player_snapshots')
            .select('*, players(name)')
            .eq('alliance_id', allianceId)
            .eq('recorded_at', viewDate)

        // Pobierz wczorajszych (jeśli są)
        let prevMap: Record<number, number> = {}
        if (prevDate) {
            const { data: p } = await supabase
                .from('player_snapshots')
                .select('player_id, power')
                .eq('alliance_id', allianceId)
                .eq('recorded_at', prevDate)
            
            p?.forEach(item => { prevMap[item.player_id] = item.power })
        }

        if (current) {
            const formatted = current.map(snap => ({
                id: snap.player_id,
                name: snap.players.name,
                power: snap.power,
                town_hall_level: snap.town_hall_level,
                prevPower: prevMap[snap.player_id] || 0,
                diff: prevMap[snap.player_id] ? snap.power - prevMap[snap.player_id] : 0
            }))
            // Sortowanie po mocy
            formatted.sort((a, b) => b.power - a.power)
            setPlayers(formatted)
        }
        setLoading(false)
    }

    fetchPlayers()
  }, [viewDate, allianceId, dates])


  if (!alliance) return <div className="p-10 text-white font-mono">Ładowanie danych sojuszu...</div>

  const latestPower = chartData.length > 0 ? chartData[chartData.length - 1].power : 0

  return (
    <main className="min-h-screen bg-[#1a1a1a] text-[#e0e0e0] p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* NAGŁÓWEK GŁÓWNY */}
        <Header />

        <Link href="/" className="text-gray-500 hover:text-white mb-6 inline-block transition-colors text-sm">
             ← Wróć do Dashboardu
        </Link>

        {/* KARTA SOJUSZU */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-8 bg-[#252525] p-6 rounded-xl border border-gray-800 shadow-lg">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <span className="text-4xl font-bold text-blue-500 font-mono">[{alliance.tag}]</span>
              <h1 className="text-3xl font-bold text-white">{alliance.name}</h1>
            </div>
            <div className="flex gap-3 items-center mt-2">
               <span className={`px-2 py-1 rounded text-xs font-bold border ${
                 alliance.status === 'TARGET' ? 'bg-green-900/30 text-green-400 border-green-800' : 
                 alliance.status === 'SKIP' ? 'bg-red-900/30 text-red-400 border-red-800' : 
                 'bg-gray-800 text-gray-400 border-gray-700'
               }`}>
                 {alliance.status}
               </span>
               {alliance.notes && <span className="text-gray-400 text-sm italic">"{alliance.notes}"</span>}
            </div>
          </div>
          
          <div className="text-right mt-4 md:mt-0">
             <p className="text-gray-500 text-xs uppercase tracking-widest mb-1 font-bold">Całkowita Moc</p>
             <p className="text-4xl font-bold text-white font-mono">{formatPower(latestPower)}</p>
          </div>
        </div>

        {/* WYKRES HISTORII (Ten co miałeś wcześniej) */}
        {chartData.length > 1 && (
            <div className="mb-10">
                <PowerChart data={chartData} />
            </div>
        )}

        {/* SEKCJON GRACZY */}
        <div className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                👤 Lista Graczy 
                <span className="text-sm font-normal text-gray-500 bg-gray-800 px-2 py-1 rounded-full">{players.length}</span>
            </h2>

            {/* Filtr Daty */}
            <div className="bg-[#252525] p-4 rounded-t-xl border border-gray-700 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm font-bold">📅 Raport z dnia:</span>
                    <select 
                        value={viewDate} 
                        onChange={(e) => setViewDate(e.target.value)}
                        className="bg-[#333] text-white p-2 rounded border border-gray-600 text-sm font-mono focus:border-blue-500 outline-none"
                    >
                        {dates.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                
                {dates.indexOf(viewDate) < dates.length - 1 && (
                    <span className="text-xs text-green-400 bg-green-900/20 px-2 py-1 rounded border border-green-900/50">
                        Porównanie z: {dates[dates.indexOf(viewDate) + 1]}
                    </span>
                )}
            </div>

            {/* Tabela */}
            <div className="bg-[#252525] rounded-b-xl shadow-lg overflow-hidden border-x border-b border-gray-700">
                {loading ? (
                    <div className="p-10 text-center text-gray-500 animate-pulse font-mono">Pobieranie danych operacyjnych...</div>
                ) : players.length === 0 ? (
                    <div className="p-10 text-center text-gray-500 italic">Brak danych graczy dla tego dnia. Wgraj JSON w zakładce Import.</div>
                ) : (
                    <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#303030] text-gray-300 uppercase text-xs tracking-wider">
                        <tr>
                            <th className="p-4 w-12 text-center text-gray-500">#</th>
                            <th className="p-4">Nick</th>
                            <th className="p-4 text-center">Level</th>
                            <th className="p-4 text-right">Moc</th>
                            <th className="p-4 text-right">Przyrost</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700 text-sm">
                        {players.map((player, idx) => (
                            <tr key={player.id} className="hover:bg-[#2a2a2a] transition-colors group">
                                <td className="p-4 text-center font-mono text-gray-500 font-bold border-r border-gray-800">{idx + 1}</td>
                                <td className="p-4 font-bold text-white group-hover:text-blue-300 transition-colors text-base">
                                    {player.name}
                                </td>
                                <td className="p-4 text-center">
                                    <span className={`px-2 py-1 rounded text-xs font-bold border shadow-sm ${
                                        player.town_hall_level > 30 
                                        ? 'bg-yellow-900/20 text-yellow-500 border-yellow-800 shadow-yellow-900/20' 
                                        : 'bg-gray-800 text-gray-400 border-gray-700'
                                    }`}>
                                        {formatLevel(player.town_hall_level)}
                                    </span>
                                </td>
                                <td className="p-4 text-right font-mono font-bold text-gray-200 text-base">
                                    {formatPower(player.power)}
                                </td>
                                <td className="p-4 text-right">
                                    {formatDiff(player.diff)}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    </div>
                )}
            </div>
        </div>

      </div>
    </main>
  )
}