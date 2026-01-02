'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type AdminContextType = {
  isAdmin: boolean
  login: (password: string) => boolean
  logout: () => void
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false)

  // Sprawdzamy przy wejściu, czy użytkownik był już zalogowany (zapisane w przeglądarce)
  useEffect(() => {
    const savedAuth = localStorage.getItem('is_admin_867')
    if (savedAuth === 'true') setIsAdmin(true)
  }, [])

  const login = (password: string) => {
    // --- TUTAJ USTAV HASŁO ---
    if (password === '867') { 
      setIsAdmin(true)
      localStorage.setItem('is_admin_867', 'true')
      return true
    }
    return false
  }

  const logout = () => {
    setIsAdmin(false)
    localStorage.removeItem('is_admin_867')
  }

  return (
    <AdminContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </AdminContext.Provider>
  )
}

export const useAdmin = () => {
  const context = useContext(AdminContext)
  if (!context) throw new Error('useAdmin must be used within AdminProvider')
  return context
}