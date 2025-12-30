'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea
} from 'recharts'

type ChartData = {
  date: string
  power: number
}

// Funkcja formatująca duże liczby (np. 820M)
const formatPower = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
  return value.toString()
}

export default function PowerChart({ data }: { data: ChartData[] }) {
  if (!data || data.length === 0) {
    return <div className="text-gray-500 text-center py-10">Brak danych historycznych</div>
  }

  // Obliczamy min/max, żeby wykres nie zaczynał się zawsze od zera (dla lepszej widoczności zmian)
  const minPower = Math.min(...data.map(d => d.power)) * 0.95
  const maxPower = Math.max(...data.map(d => d.power)) * 1.05

  return (
    <div className="h-[400px] w-full bg-[#252525] rounded-xl p-4 border border-gray-800 shadow-lg">
      <h3 className="text-gray-400 text-sm font-bold mb-4 uppercase tracking-wider">Historia Mocy</h3>
      
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
          
          <XAxis 
            dataKey="date" 
            stroke="#666" 
            tick={{ fill: '#888', fontSize: 12 }} 
            tickLine={false}
          />
          
          <YAxis 
            stroke="#666"
            tick={{ fill: '#888', fontSize: 12 }}
            tickFormatter={formatPower}
            domain={[minPower, maxPower]}
            tickLine={false}
            width={60}
          />
          
        <Tooltip 
            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #444', borderRadius: '8px' }}
            itemStyle={{ color: '#4ade80' }}
            // ZMIANA TUTAJ: (value: any) naprawi błąd typowania
            formatter={(value: any) => [value.toLocaleString(), 'Moc']}
            labelStyle={{ color: '#888', marginBottom: '0.5rem' }}
          />

          <Line 
            type="monotone" 
            dataKey="power" 
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6, fill: '#60a5fa' }}
            animationDuration={1000}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}