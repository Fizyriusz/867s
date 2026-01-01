import { supabase } from '@/utils/supabase'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

type GameEvent = {
  id: number
  title: string
  event_type: 'KVK' | 'KVK_WAR' | 'BRAWL' | 'OTHER'
  start_date: string
  end_date: string
  description: string | null
}

const getEventColor = (type: string) => {
  switch (type) {
    case 'KVK': return 'border-orange-500 text-orange-400 bg-orange-900/10'
    case 'KVK_WAR': return 'border-red-600 text-red-500 bg-red-900/20' // Wojna na czerwono
    case 'BRAWL': return 'border-blue-500 text-blue-400 bg-blue-900/10'
    default: return 'border-gray-600 text-gray-400 bg-gray-800'
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })
}

export default async function TimelinePage() {
  const { data: events } = await supabase
    .from('game_events')
    .select('*')
    .order('start_date', { ascending: true }) // Najstarsze na górze, najnowsze na dole

  const today = new Date().toISOString().split('T')[0]

  return (
    <main className="min-h-screen bg-[#1a1a1a] text-[#e0e0e0] p-4 md:p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        
        {/* NAGŁÓWEK */}
        <header className="flex justify-between items-center mb-10 border-b border-gray-700 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Timeline Wydarzeń</h1>
            <p className="text-gray-400 text-sm">Kalendarz KvK i Brawl</p>
          </div>
          <Link href="/" className="text-blue-400 hover:underline text-sm">
            ← Wróć do Dashboardu
          </Link>
        </header>

        {/* STATUS AKTUALNY (Baner) */}
        {events?.map(event => {
          if (today >= event.start_date && today <= event.end_date) {
            return (
              <div key={event.id} className="mb-10 p-6 rounded-xl border-2 border-green-500 bg-green-900/20 shadow-[0_0_20px_rgba(34,197,94,0.2)] text-center animate-pulse-slow">
                <p className="text-green-400 font-bold uppercase tracking-widest text-xs mb-2">AKTUALNIE TRWA</p>
                <h2 className="text-3xl font-bold text-white mb-2">{event.title}</h2>
                <p className="text-gray-300">{event.description}</p>
                <p className="mt-4 text-sm font-mono text-green-300 bg-green-900/40 inline-block px-3 py-1 rounded">
                   📅 {formatDate(event.start_date)} - {formatDate(event.end_date)}
                </p>
              </div>
            )
          }
        })}

        {/* OŚ CZASU (TIMELINE) */}
        <div className="relative border-l-2 border-gray-700 ml-4 md:ml-10 space-y-10 pb-10">
          {events?.map((event) => {
            const isPast = today > event.end_date
            const isCurrent = today >= event.start_date && today <= event.end_date
            
            return (
              <div key={event.id} className="relative pl-8 md:pl-12 group">
                {/* Kropka na osi */}
                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 bg-[#1a1a1a] transition-all 
                  ${isCurrent ? 'border-green-500 bg-green-500 scale-125 shadow-[0_0_10px_#22c55e]' : 
                    isPast ? 'border-gray-600 bg-gray-600' : 'border-blue-500'}`} 
                />

                {/* Karta Wydarzenia */}
                <div className={`p-5 rounded-lg border-l-4 transition-all hover:translate-x-1 ${getEventColor(event.event_type)} ${isPast ? 'opacity-50 grayscale hover:grayscale-0' : ''}`}>
                  <div className="flex flex-col md:flex-row justify-between md:items-center mb-2">
                    <h3 className="text-xl font-bold text-white">{event.title}</h3>
                    <span className="text-sm font-mono opacity-80 mt-1 md:mt-0 bg-black/30 px-2 py-1 rounded">
                      {formatDate(event.start_date)} — {formatDate(event.end_date)}
                    </span>
                  </div>
                  <p className="text-sm opacity-90">{event.description}</p>
                </div>
              </div>
            )
          })}
          
          {(!events || events.length === 0) && (
             <div className="pl-10 text-gray-500 italic">Brak zaplanowanych wydarzeń. Dodaj je w bazie SQL.</div>
          )}
        </div>

      </div>
    </main>
  )
}