import { supabase } from '@/utils/supabase'
import Header from '@/components/Header'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function TargetsPage() {
  // Pobieramy tylko sojusze ze statusem TARGET
  const { data: alliances } = await supabase
    .from('alliances')
    .select('*')
    .eq('status', 'TARGET')
    .order('name', { ascending: true })

  // Pobieramy najświeższe snapshoty dla tych sojuszy
  const { data: snapshots } = await supabase
    .from('alliance_snapshots')
    .select('*')
    .order('recorded_at', { ascending: false })

  return (
    <main className="min-h-screen bg-[#1a1a1a] text-[#e0e0e0] p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <Header />
        
        <div className="mb-8 border-b border-gray-700 pb-4 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-green-400 uppercase tracking-wider">🎯 Recruitment Targets</h2>
            <p className="text-gray-400 text-sm">Lista sojuszy wytypowanych do rekrutacji / fuzji.</p>
          </div>
          <div className="text-right text-xs text-gray-500">
            Znaleziono: {alliances?.length || 0}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alliances?.map((alliance) => {
            const latestPower = snapshots?.find(s => s.alliance_id === alliance.id)?.total_power || 0
            
            return (
              <div key={alliance.id} className="bg-[#252525] p-5 rounded-xl border border-green-900/30 hover:border-green-500/50 transition-all group">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-green-500 font-mono font-bold text-lg">[{alliance.tag}]</span>
                    <h3 className="text-xl font-bold text-white group-hover:text-green-400 transition-colors">
                      {alliance.name}
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Aktualna Moc</p>
                    <p className="text-lg font-mono font-bold text-white">
                        {(latestPower / 1000000).toFixed(1)}M
                    </p>
                  </div>
                </div>

                {alliance.notes && (
                  <div className="bg-black/30 p-3 rounded-lg border border-gray-800 mb-4">
                    <p className="text-xs text-gray-400 italic">"{alliance.notes}"</p>
                  </div>
                )}

                <Link 
                  href={`/alliance/${alliance.id}`}
                  className="block w-full text-center py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-bold transition-colors"
                >
                  Zobacz pełną historię
                </Link>
              </div>
            )
          })}
          
          {(!alliances || alliances.length === 0) && (
            <div className="col-span-full p-20 text-center text-gray-600 italic">
              Brak aktywnych celów rekrutacyjnych.
            </div>
          )}
        </div>
      </div>
    </main>
  )
}