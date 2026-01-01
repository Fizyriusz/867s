import { supabase } from '@/utils/supabase'
import EventCard from '@/components/EventCard'
import Header from '@/components/Header'

// Wymuszamy dynamiczne pobieranie danych (zawsze świeże)
export const dynamic = 'force-dynamic'

export default async function TimelinePage() {
  // 1. Pobieramy eventy (posortowane od najstarszych)
  const { data: events } = await supabase
    .from('game_events')
    .select('*')
    .order('start_date', { ascending: true })

  // 2. Pobieramy snapshoty i sojusze (potrzebne do raportów wewnątrz kart)
  const { data: snapshots } = await supabase.from('alliance_snapshots').select('*')
  const { data: alliances } = await supabase.from('alliances').select('id, tag, name')

  return (
    <main className="min-h-screen bg-[#1a1a1a] text-[#e0e0e0] p-4 md:p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        
        {/* Nagłówek z przełącznikiem języka */}
        <Header />

        <div className="mb-8 border-b border-gray-700 pb-4">
           <h2 className="text-2xl font-bold text-white">Timeline</h2>
           <p className="text-gray-400 text-sm">Historia wojen i wydarzeń</p>
        </div>

        {/* OŚ CZASU */}
        <div className="relative border-l-2 border-gray-700 ml-4 md:ml-10 space-y-10 pb-10">
          {events?.map((event) => (
             <EventCard 
                key={event.id} 
                event={event} 
                snapshots={snapshots || []} 
                alliances={alliances || []} 
             />
          ))}
          
          {(!events || events.length === 0) && (
             <div className="pl-10 text-gray-500 italic">Brak zaplanowanych wydarzeń.</div>
          )}
        </div>

      </div>
    </main>
  )
}