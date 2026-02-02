'use client'

import Header from '@/components/Header'

export default function HqPage() {
    return (
        <main className="min-h-screen bg-[#1a1a1a] text-[#e0e0e0] p-4 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <Header />

                <h1 className="text-3xl font-bold text-orange-400 mb-6">🛡️ HQ - Centrum Dowodzenia Sojuszu</h1>

                <div className="bg-[#252525] p-8 rounded border border-gray-700">
                    <p>Witaj w panelu zarządzania.</p>
                    <p className="text-sm text-gray-500 mt-2">To miejsce zastąpi funkcje z starego kingshot-hq.</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                        <div className="bg-[#333] p-4 rounded border border-gray-600">
                            <h3 className="font-bold text-xl mb-2">Członkowie</h3>
                            <p className="text-gray-400 text-sm">Tu będzie lista z TH, Power i Marszami.</p>
                        </div>
                        <div className="bg-[#333] p-4 rounded border border-gray-600">
                            <h3 className="font-bold text-xl mb-2">Eventy</h3>
                            <p className="text-gray-400 text-sm">Tworzenie i podgląd eventów.</p>
                        </div>
                        <div className="bg-[#333] p-4 rounded border border-gray-600">
                            <h3 className="font-bold text-xl mb-2">Snapshoty</h3>
                            <p className="text-gray-400 text-sm">Historia rozwoju graczy.</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
