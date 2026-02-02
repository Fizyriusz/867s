'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase'

type UserRole = 'guest' | 'recruiter' | 'admin' | 'officer'

type AuthContextType = {
    user: User | null
    session: Session | null
    role: UserRole
    isLoading: boolean
    signInWithGoogle: () => Promise<void>
    signOut: () => Promise<void>
    isAdmin: boolean
    isOfficer: boolean
    isRecruiterOrHigher: boolean // For backward compatibility with UI
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [role, setRole] = useState<UserRole>('guest')
    const [isLoading, setIsLoading] = useState(true)

    const supabase = createClient()

    useEffect(() => {
        // 1. Get initial session
        const initSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                await fetchUserRole(session.user.id)
            } else {
                setIsLoading(false)
            }
        }

        initSession()

        // 2. Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                setIsLoading(true)
                await fetchUserRole(session.user.id)
            } else {
                setRole('guest')
                setIsLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const fetchUserRole = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single()

            if (data) {
                setRole(data.role as UserRole)
            } else {
                // Fallback or default
                setRole('guest')
            }
        } catch (e) {
            console.error('Error fetching role:', e)
            setRole('guest')
        } finally {
            setIsLoading(false)
        }
    }

    const signInWithGoogle = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
        })
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        setRole('guest')
    }

    // Helpers
    const isAdmin = role === 'admin'
    const isOfficer = role === 'officer' || role === 'admin'
    const isRecruiterOrHigher = isAdmin || isOfficer // Officers treated as recruiters+

    return (
        <AuthContext.Provider value={{
            user,
            session,
            role,
            isLoading,
            signInWithGoogle,
            signOut,
            isAdmin,
            isOfficer,
            isRecruiterOrHigher
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used within AuthProvider')
    return context
}
