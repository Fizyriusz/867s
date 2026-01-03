'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Definiujemy możliwe role
export type UserRole = 'guest' | 'recruiter' | 'admin'

type AdminContextType = {
  role: UserRole
  login: (password: string) => boolean
  logout: () => void
  isRecruiterOrHigher: boolean // Helper: czy ma uprawnienia rekrutera lub wyższe
  isAdmin: boolean // Helper: czy jest adminem
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>('guest')

  // Sprawdzamy przy wejściu, czy rola była zapisana
  useEffect(() => {
    const savedRole = localStorage.getItem('app_role') as UserRole
    if (savedRole && ['guest', 'recruiter', 'admin'].includes(savedRole)) {
      setRole(savedRole)
    }
  }, [])

  const login = (password: string) => {
    // --- HASŁA ---
    if (password === '867') { 
      setRole('admin')
      localStorage.setItem('app_role', 'admin')
      return true
    }
    if (password === 'hunter') { 
      setRole('recruiter')
      localStorage.setItem('app_role', 'recruiter')
      return true
    }
    return false
  }

  const logout = () => {
    setRole('guest')
    localStorage.removeItem('app_role')
  }

  // Helpery dla wygody w kodzie
  const isAdmin = role === 'admin'
  const isRecruiterOrHigher = role === 'admin' || role === 'recruiter'

  return (
    <AdminContext.Provider value={{ role, login, logout, isAdmin, isRecruiterOrHigher }}>
      {children}
    </AdminContext.Provider>
  )
}

export const useAdmin = () => {
  const context = useContext(AdminContext)
  if (!context) throw new Error('useAdmin must be used within AdminProvider')
  return context
}