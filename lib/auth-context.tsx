"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface User {
  id: string
  name: string
  email: string
}

interface AuthContextType {
  user: User | null
  login: (user: User, token: string) => void
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = getCookie("auth-token")
    if (token) {
      try {
        const payload = JSON.parse(Buffer.from(token, "base64").toString())

        if (payload.exp > Date.now()) {
          const userData = {
            id: payload.id,
            name: payload.name,
            email: payload.email,
          }
          setUser(userData)
        } else {
          deleteCookie("auth-token")
        }
      } catch (error) {
        console.error("Erro ao decodificar token:", error)
        deleteCookie("auth-token")
      }
    }
    setIsLoading(false)
  }, [])

  const getCookie = (name: string) => {
    if (typeof document === "undefined") return null
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(";").shift()
    return null
  }

  const setCookie = (name: string, value: string, days = 7) => {
    if (typeof document === "undefined") return
    const expires = new Date()
    expires.setDate(expires.getDate() + days)
    const cookieString = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
    document.cookie = cookieString
  }

  const deleteCookie = (name: string) => {
    if (typeof document === "undefined") return
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
  }

  const login = (userData: User, token: string) => {
    setUser(userData)
    setCookie("auth-token", token)
  }

  const logout = () => {
    setUser(null)
    deleteCookie("auth-token")
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
