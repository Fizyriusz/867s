import { supabase } from '@/utils/supabase'
import Link from 'next/link'
import EventCard from '@/components/EventCard'

export const dynamic = 'force-dynamic'

export default async function TimelinePage() {
  // 1. Pobieramy eventy
  const { data: events } = await supabase
    .from('game_events')
    .select('*')
    .order('start_date', { ascending: true })

  // 2. Pobieramy snapshoty i sojusze (potrzebne do raportów)
  // UWAGA: Przy dużej bazie to może być ciężkie, ale dla <100 sojuszy jest OK.
  const { data: snapshots } = await supabase.from('alliance_snapshots').select('*')
  const { data: alliances } = await supabase.from('alliances').select('id, tag, name')

  const today = new Date().toISOString().split('T')[0]

  return (
    <main className="min-h-screen bg-[#1a1a1a] text-[#e0e0e0] p-4 md:p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        
        <header className="flex justify-between items-center mb-10 border-b border-gray-700 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Timeline Wydarzeń</h1>
            <p className="text-gray-400 text-sm">Kalendarz & Raporty Mocy</p>
          </div>
          <Link href="/" className="text-blue-400 hover:underline text-sm">
            ← Wróć do Dashboardu
          </Link>
        </header>

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