"use client"

import { createContext, useContext, useState, useEffect } from "react"
import AuthAPI from "../services/auth.api"
import { getToken } from "../services/storage.service.js"

// Create context
const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check if user is logged in on initial load
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = getToken()
        if (token) {
          const data = await AuthAPI.getCurrentUser()
          setUser(data.user)
        }
      } catch (err) {
        console.error("Failed to load user:", err)
        AuthAPI.logout()
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true)
      setError(null)
      const data = await AuthAPI.login(email, password)
      setUser(data.user)
      return data
    } catch (err) {
      setError(err.response?.data?.message || "Login failed")
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Logout function
  const logout = () => {
    AuthAPI.logout()
    setUser(null)
  }

  // Context value
  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
