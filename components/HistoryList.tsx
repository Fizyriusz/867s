'use client'

import { useState } from 'react'
import { supabase } from '@/utils/supabase'
import { useRouter } from 'next/navigation'

type Snapshot = {
  id: number
  total_power: number
  recorded_at: string
}

export default function HistoryList({ snapshots }: { snapshots: Snapshot[] }) {
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  const router = useRouter()

  const handleDelete = async (id: number, date: string) => {
    // Proste potwierdzenie w przeglądarce
    if (!confirm(`Czy na pewno chcesz usunąć wpis z dnia ${date}?`)) return

    setIsDeleting(id)

    try {
      const { error } = await supabase
        .from('alliance_snapshots')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Odśwież stronę, żeby zniknął wpis i zaktualizował się wykres
      router.refresh()
    } catch (err) {
      alert('Błąd usuwania!')
      console.error(err)
    } finally {
      setIsDeleting(null)
    }
  }

  return (
    <div className="mt-8 bg-[#252525] rounded-xl border border-gray-800 overflow-hidden">
      <div className="p-4 bg-[#303030] border-b border-gray-700">
        <h3 className="text-gray-200 font-bold text-sm uppercase tracking-wider">
          Szczegółowa Historia (Edycja)
        </h3>
      </div>
      
      <div className="max-h-60 overflow-y-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#2a2a2a] text-gray-400 sticky top-0">
            <tr>
              <th className="p-3">Data</th>
              <th className="p-3 text-right">Moc</th>
              <th className="p-3 text-center w-20">Akcja</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {snapshots.slice().reverse().map((snap) => ( // Odwracamy, żeby najnowsze były na górze
              <tr key={snap.id} className="hover:bg-[#2f2f2f] transition-colors">
                <td className="p-3 text-gray-300 font-mono">
                  {new Date(snap.recorded_at).toLocaleDateString('pl-PL')}
                </td>
                <td className="p-3 text-right text-white font-mono font-bold">
                  {(snap.total_power / 1000000).toFixed(1)}M
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => handleDelete(snap.id, snap.recorded_at)}
                    disabled={isDeleting === snap.id}
                    className="text-red-500 hover:text-red-400 p-1 hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                    title="Usuń ten wpis"
                  >
                    {isDeleting === snap.id ? '...' : '🗑️'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}