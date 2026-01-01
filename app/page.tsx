import { supabase } from '@/utils/supabase'
import Link from 'next/link'
import DashboardTable from '@/components/DashboardTable'

// Wymuszamy pobieranie świeżych danych przy każdym wejściu
export const dynamic = 'force-dynamic'

export default async function Home() {
  const { data: alliances } = await supabase.from('alliances').select('*').order('id', { ascending: true })
  const { data: snapshots } = await supabase.from('alliance_snapshots').select('alliance_id, total_power, recorded_at')

  return (
    <main className="min-h-screen bg-[#1a1a1a] text-[#e0e0e0] p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-gray-700 pb-6 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-1">867's HQ</h1>
            <p className="text-gray-400 text-sm">Dashboard Rekrutacyjny</p>
          </div>
          <Link href="/import" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold text-sm transition-colors flex items-center gap-2">
            <span>📥</span> Zarządzanie / Import
          </Link>
        </header>

        {/* Cała logika tabeli i dat siedzi teraz tutaj: */}
        <DashboardTable 
          alliances={alliances || []} 
          snapshots={snapshots || []} 
        />
        
      </div>
    </main>
  )
}