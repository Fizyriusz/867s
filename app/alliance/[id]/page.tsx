import { supabase } from '@/utils/supabase'
import PowerChart from '@/components/PowerChart'
import HistoryList from '@/components/HistoryList' // <--- IMPORTUJEMY NOWY KOMPONENT
import Link from 'next/link'

export default async function AlliancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: alliance } = await supabase
    .from('alliances')
    .select('*')
    .eq('id', id)
    .single()

  // ZMIANA TUTAJ: Dodaliśmy 'id' do selecta!
  const { data: history } = await supabase
    .from('alliance_snapshots')
    .select('id, total_power, recorded_at') 
    .eq('alliance_id', id)
    .order('recorded_at', { ascending: true })

  if (!alliance) return <div className="p-10 text-white">Nie znaleziono sojuszu.</div>

  const chartData = history?.map(entry => ({
    date: new Date(entry.recorded_at).toLocaleDateString('pl-PL', { month: 'short', day: 'numeric' }),
    power: entry.total_power
  })) || []

  const latestPower = history?.[history.length - 1]?.total_power || 0
  const startPower = history?.[0]?.total_power || 0
  const diff = latestPower - startPower
  const isPositive = diff >= 0

  return (
    <main className="min-h-screen bg-[#1a1a1a] text-[#e0e0e0] p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="text-gray-500 hover:text-white mb-6 inline-block transition-colors">
          ← Wróć do listy
        </Link>

        {/* Nagłówek */}
        <div className="flex justify-between items-start mb-8 bg-[#252525] p-6 rounded-xl border border-gray-800">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <span className="text-3xl font-bold text-blue-400 font-mono">{alliance.tag}</span>
              <h1 className="text-3xl font-bold text-white">{alliance.name}</h1>
            </div>
            <div className="flex gap-3">
               <span className={`px-2 py-1 rounded text-xs font-bold border ${
                  alliance.status === 'TARGET' ? 'bg-green-900/30 text-green-400 border-green-800' : 
                  alliance.status === 'SKIP' ? 'bg-red-900/30 text-red-400 border-red-800' : 
                  'bg-gray-800 text-gray-400 border-gray-700'
               }`}>
                 {alliance.status}
               </span>
               <span className="text-gray-400 text-sm self-center italic">{alliance.notes}</span>
            </div>
          </div>

          <div className="text-right">
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Aktualna Moc</p>
            <p className="text-4xl font-bold text-white">{latestPower.toLocaleString()}</p>
            {history && history.length > 1 && (
               <p className={`text-sm font-bold mt-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                 {isPositive ? '▲' : '▼'} {Math.abs(diff).toLocaleString()} (od {chartData[0].date})
               </p>
            )}
          </div>
        </div>

        {/* WYKRES */}
        <PowerChart data={chartData} />

        {/* NOWA TABELA HISTORII Z USUWANIEM */}
        {history && <HistoryList snapshots={history} />}

      </div>
    </main>
  )
}