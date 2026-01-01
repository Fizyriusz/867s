import { supabase } from '@/utils/supabase'
import DashboardTable from '@/components/DashboardTable'
import Header from '@/components/Header' // <--- Import nowego Headera

export const dynamic = 'force-dynamic'

export default async function Home() {
  const { data: alliances } = await supabase.from('alliances').select('*').order('id', { ascending: true })
  const { data: snapshots } = await supabase.from('alliance_snapshots').select('alliance_id, total_power, recorded_at')

  return (
    <main className="min-h-screen bg-[#1a1a1a] text-[#e0e0e0] p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Używamy komponentu Header, który ma w sobie tłumaczenia i przycisk */}
        <Header />

        <DashboardTable 
          alliances={alliances || []} 
          snapshots={snapshots || []} 
        />
        
      </div>
    </main>
  )
}