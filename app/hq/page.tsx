'use client'

import Header from '@/components/Header'
import MembersTab from './components/MembersTab'
import EventsTab from './components/EventsTab'
import SnapshotsTab from './components/SnapshotsTab'
import { useState } from 'react'

export default function HqPage() {
    const [activeTab, setActiveTab] = useState<'members' | 'events' | 'snapshots'>('members')

    return (
        <main className="min-h-screen bg-[#1a1a1a] text-[#e0e0e0] p-4 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <Header />

                <h1 className="text-3xl font-bold text-orange-400 mb-6">🛡️ HQ - Centrum Dowodzenia Sojuszu</h1>

                {/* TABS */}
                <div className="flex border-b border-gray-700 mb-6 space-x-6">
                    <button onClick={() => setActiveTab('members')} className={`pb-3 border-b-2 font-bold transition-colors ${activeTab === 'members' ? 'border-orange-500 text-orange-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                        Członkowie
                    </button>
                    <button onClick={() => setActiveTab('events')} className={`pb-3 border-b-2 font-bold transition-colors ${activeTab === 'events' ? 'border-orange-500 text-orange-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                        Eventy (Wkrótce)
                    </button>
                    <button onClick={() => setActiveTab('snapshots')} className={`pb-3 border-b-2 font-bold transition-colors ${activeTab === 'snapshots' ? 'border-orange-500 text-orange-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                        Snapshoty (Wkrótce)
                    </button>
                </div>

                {/* CONTENT */}
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {activeTab === 'members' && <MembersTab />}
                    {activeTab === 'events' && <EventsTab />}
                    {activeTab === 'snapshots' && <SnapshotsTab />}
                </div>
            </div>
        </main>
    )
}
