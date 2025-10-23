import api from './api'
import { setToken, removeToken } from './storage.service.js'

const AuthAPI = {
  async register(userData) {
    const response = await api.post('/auth/register', userData)
    if (response.data.token) setToken(response.data.token)
    return response.data
  },

  async login(email, password) {
    const response = await api.post('/auth/login', { email, password })
    if (response.data.token) setToken(response.data.token)
    return response.data
  },

  logout() {
    removeToken()
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me')
    return response.data
  },

  async approveAccount(token) {
    const response = await api.post('/auth/approve', { token })
    return response.data
  }
}

export default AuthAPI
// Only default export (use AuthAPI.method to access functions)
