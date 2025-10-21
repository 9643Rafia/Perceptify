import api from "./api"
import { setToken, removeToken } from "./storage.service.js"

// Register user
export const register = async (userData) => {
  const response = await api.post("/auth/register", userData)
  if (response.data.token) {
    setToken(response.data.token)
  }
  return response.data
}

// Login user
export const login = async (email, password) => {
  const response = await api.post("/auth/login", { email, password })
  if (response.data.token) {
    setToken(response.data.token)
  }
  return response.data
}

// Logout user
export const logout = () => {
  removeToken()
}

// Get current user
export const getCurrentUser = async () => {
  const response = await api.get("/auth/me")
  return response.data
}

// Approve minor account
export const approveAccount = async (token) => {
  const response = await api.post("/auth/approve", { token })
  return response.data
}
