import { supabase } from '@/utils/supabase'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

// Typy danych
type Alliance = {
  id: number
  tag: string
  name: string
  status: string
  notes: string | null
}

type Snapshot = {
  alliance_id: number
  total_power: number
  recorded_at: string
}

// Funkcja pomocnicza do formatowania dużych liczb (np. +1.5M)
const formatDiff = (val: number) => {
  if (val === 0) return '-'
  const sign = val > 0 ? '+' : ''
  const absVal = Math.abs(val)
  
  // Formatowanie kolorów w klasach CSS niżej, tu tylko tekst
  if (absVal >= 1000000) return `${sign}${(val / 1000000).toFixed(1)}M`
  if (absVal >= 1000) return `${sign}${(val / 1000).toFixed(1)}k`
  return `${sign}${val.toLocaleString()}`
}

const formatPower = (val: number) => {
  if (val >= 1000000000) return `${(val / 1000000000).toFixed(2)}B`
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`
  return val.toLocaleString()
}

// Pobieranie danych (Serwer)
async function getData() {
  // 1. Pobierz sojusze
  const { data: alliances } = await supabase
    .from('alliances')
    .select('*')
    .order('id', { ascending: true })

  // 2. Pobierz WSZYSTKIE snapshoty (do obliczeń)
  // W przyszłości można to zoptymalizować, ale przy <100 sojuszach to jest błyskawiczne
  const { data: snapshots } = await supabase
    .from('alliance_snapshots')
    .select('alliance_id, total_power, recorded_at')
    .order('recorded_at', { ascending: true })

  return { alliances: alliances as Alliance[], snapshots: snapshots as Snapshot[] }
}

export default async function Home() {
  const { alliances, snapshots } = await getData()

  return (
    <main className="min-h-screen bg-[#1a1a1a] text-[#e0e0e0] p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Nagłówek i Przyciski */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 border-b border-gray-700 pb-6 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-1">867's HQ</h1>
            <p className="text-gray-400 text-sm">Dashboard Rekrutacyjny</p>
          </div>
          <div className="flex gap-3">
             <Link 
              href="/import" 
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold text-sm transition-colors flex items-center gap-2"
            >
              <span>📥</span> Importuj Dane
            </Link>
          </div>
        </header>

        {/* Tabela Główna */}
        <div className="bg-[#252525] rounded-xl shadow-lg overflow-hidden border border-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#303030] text-gray-300 uppercase text-xs tracking-wider">
                <tr>
                  <th className="p-4 font-semibold w-16 text-center">Tag</th>
                  <th className="p-4 font-semibold">Nazwa Sojuszu</th>
                  <th className="p-4 font-semibold text-right">Moc</th>
                  <th className="p-4 font-semibold text-right text-gray-400" title="Zmiana od ostatniego wpisu">24h Δ</th>
                  <th className="p-4 font-semibold text-right text-gray-400" title="Zmiana od wpisu sprzed ok. 7 dni">7d Δ</th>
                  <th className="p-4 font-semibold text-center">Status</th>
                  <th className="p-4 font-semibold text-gray-500">Uwagi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700 text-sm">
                {!alliances || alliances.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500 italic">
                      Baza jest pusta. Zaimportuj dane!
                    </td>
                  </tr>
                ) : (
                  alliances.map((alliance) => {
                    // Logika obliczeń dla konkretnego sojuszu
                    const history = snapshots?.filter(s => s.alliance_id === alliance.id) || []
                    const latest = history[history.length - 1]
                    const prev = history[history.length - 2] // Ostatni wpis (wczoraj)
                    const weekAgo = history[history.length - 8] // 8 wpisów temu (ok. tydzień)

                    // Obliczanie różnic
                    const currentPower = latest ? latest.total_power : 0
                    const diff24h = (latest && prev) ? (latest.total_power - prev.total_power) : 0
                    const diff7d = (latest && weekAgo) ? (latest.total_power - weekAgo.total_power) : 0

                    return (
                      <tr key={alliance.id} className="hover:bg-[#2a2a2a] transition-colors group">
                        
                        {/* TAG */}
                        <td className="p-4 font-mono text-blue-400 font-bold text-center">
                          {alliance.tag}
                        </td>
                        
                        {/* NAZWA (Link) */}
                        <td className="p-4 font-medium text-white">
                          <Link href={`/alliance/${alliance.id}`} className="hover:text-blue-400 hover:underline transition-colors block py-2">
                            {alliance.name}
                          </Link>
                        </td>

                        {/* MOC AKTUALNA */}
                        <td className="p-4 text-right font-mono text-gray-200 font-bold">
                          {latest ? formatPower(currentPower) : <span className="text-gray-600">-</span>}
                        </td>

                        {/* ZMIANA 24H */}
                        <td className={`p-4 text-right font-mono font-bold ${
                          diff24h > 0 ? 'text-green-400' : diff24h < 0 ? 'text-red-400' : 'text-gray-600'
                        }`}>
                          {latest && prev ? formatDiff(diff24h) : <span className="text-gray-700 text-xs">n/a</span>}
                        </td>

                        {/* ZMIANA 7D */}
                        <td className={`p-4 text-right font-mono font-bold ${
                          diff7d > 0 ? 'text-green-400' : diff7d < 0 ? 'text-red-400' : 'text-gray-600'
                        }`}>
                          {latest && weekAgo ? formatDiff(diff7d) : <span className="text-gray-700 text-xs">n/a</span>}
                        </td>

                        {/* STATUS */}
                        <td className="p-4 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-bold border ${
                             alliance.status === 'TARGET' ? 'bg-green-900/20 text-green-400 border-green-900' : 
                             alliance.status === 'SKIP' ? 'bg-red-900/20 text-red-400 border-red-900' : 
                             'bg-gray-800 text-gray-400 border-gray-700'
                          }`}>
                            {alliance.status}
                          </span>
                        </td>

                        {/* UWAGI */}
                        <td className="p-4 text-xs text-gray-500 italic truncate max-w-[200px]">
                          {alliance.notes || ''}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="mt-6 text-center text-xs text-gray-600">
          Dane: Last Update vs Previous (24h) | Last Update vs 7 entries ago (7d)
        </div>
      </div>
    </main>
  )
}