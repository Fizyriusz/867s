import { supabase } from '@/utils/supabase'
import Header from '@/components/Header'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function TargetsPage() {
  // 1. Pobieramy sojusze ze statusem TARGET
  const { data: alliances } = await supabase
    .from('alliances')
    .select('*')
    .eq('status', 'TARGET')

  // 2. Pobieramy najświeższe snapshoty (żeby znać ich moc)
  // Pobieramy tylko snapshoty dla sojuszy, które są targetami (optymalizacja)
  const targetIds = alliances?.map(a => a.id) || []
  
  let snapshots: any[] = []
  if (targetIds.length > 0) {
      const { data } = await supabase
        .from('alliance_snapshots')
        .select('*')
        .in('alliance_id', targetIds)
        .order('recorded_at', { ascending: false }) // Najnowsze pierwsze
      snapshots = data || []
  }

  // 3. ŁĄCZENIE I SORTOWANIE (Tu dzieje się magia)
  const sortedTargets = (alliances || []).map(alliance => {
      // Znajdź najnowszy wpis mocy dla tego sojuszu
      const latestSnap = snapshots.find(s => s.alliance_id === alliance.id)
      return {
          ...alliance,
          currentPower: latestSnap?.total_power || 0, // Dopisujemy moc do obiektu
          lastUpdate: latestSnap?.recorded_at || 'Brak danych'
      }
  })
  .sort((a, b) => b.currentPower - a.currentPower) // SORTUJEMY: Od największej mocy (b) do najmniejszej (a)


  return (
    <main className="min-h-screen bg-[#1a1a1a] text-[#e0e0e0] p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <Header />
        
        <div className="mb-8 border-b border-gray-700 pb-4 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-green-400 uppercase tracking-wider">🎯 Recruitment Targets</h2>
            <p className="text-gray-400 text-sm">Lista celów posortowana według siły.</p>
          </div>
          <div className="text-right text-xs text-gray-500">
            Znaleziono: {sortedTargets.length}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedTargets.map((alliance) => {
            return (
              <div key={alliance.id} className="bg-[#252525] p-5 rounded-xl border border-green-900/30 hover:border-green-500/50 transition-all group relative overflow-hidden">
                
                {/* Ozdobny numer rankingu w tle */}
                <div className="absolute -right-4 -top-4 text-[80px] font-bold text-white/5 pointer-events-none select-none">
                    #{(sortedTargets.indexOf(alliance) + 1)}
                </div>

                <div className="flex justify-between items-start mb-3 relative z-10">
                  <div>
                    <span className="text-green-500 font-mono font-bold text-lg">[{alliance.tag}]</span>
                    <h3 className="text-xl font-bold text-white group-hover:text-green-400 transition-colors">
                      {alliance.name}
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Moc</p>
                    <p className="text-lg font-mono font-bold text-white">
                        {(alliance.currentPower / 1000000).toFixed(1)}M
                    </p>
                  </div>
                </div>

                {alliance.notes && (
                  <div className="bg-black/30 p-3 rounded-lg border border-gray-800 mb-4 relative z-10">
                    <p className="text-xs text-gray-400 italic">"{alliance.notes}"</p>
                  </div>
                )}

                <div className="flex justify-between items-center mt-4 relative z-10">
                    <span className="text-[10px] text-gray-600 font-mono">
                        Data danych: {alliance.lastUpdate}
                    </span>
                    <Link 
                    href={`/alliance/${alliance.id}`}
                    className="px-4 py-2 bg-gray-800 hover:bg-green-700 text-gray-300 hover:text-white rounded-lg text-sm font-bold transition-colors"
                    >
                    Profil →
                    </Link>
                </div>
              </div>
            )
          })}
          
          {sortedTargets.length === 0 && (
            <div className="col-span-full p-20 text-center text-gray-600 italic">
              Brak aktywnych celów rekrutacyjnych. <br/>
              <span className="text-xs">Ustaw status "TARGET" na Dashboardzie, aby dodać sojusze do tej listy.</span>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}