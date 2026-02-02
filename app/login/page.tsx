'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase'
import Header from '@/components/Header'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            router.push('/')
            router.refresh()
        }
    }

    const handleSignUp = async () => {
        // Optional: Redirect to signup or handle here
        // For this internal app, maybe we just want login.
        // But let's allow trying to sign up if the user wants to creat account
        setLoading(true)
        const { error } = await supabase.auth.signUp({
            email,
            password,
        })
        if (error) {
            setError(error.message)
        } else {
            setError('Check your email for the confirmation link.')
        }
        setLoading(false)
    }

    return (
        <main className="min-h-screen bg-[#1a1a1a] text-[#e0e0e0] p-4 md:p-8 font-sans">
            <div className="max-w-md mx-auto">
                <Header />

                <div className="bg-[#252525] p-8 rounded-xl shadow-2xl border border-gray-800 mt-10">
                    <h1 className="text-2xl font-bold text-white mb-6 text-center">Kingshot Access</h1>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[#333] border border-gray-600 rounded p-3 text-white focus:border-blue-500 outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[#333] border border-gray-600 rounded p-3 text-white focus:border-blue-500 outline-none"
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-red-900/20 border border-red-500 text-red-400 p-3 rounded text-sm text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded shadow-lg transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Sign In'}
                        </button>
                        {/*
            <div className="text-center mt-4">
                <button type="button" onClick={handleSignUp} className="text-sm text-gray-500 hover:text-gray-300">
                    Need an account? Sign Up
                </button>
            </div>
*/}
                    </form>
                </div>
            </div>
        </main>
    )
}
