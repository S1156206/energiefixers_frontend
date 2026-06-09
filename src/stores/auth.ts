import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { apiRequest } from '@/services/api'
import router from '@/router'

export interface User {
  id: number
  email: string
  role: 'TENANT' | 'STAFF' | 'ADMIN'
  firstName: string
  registeredAt: string
  lastLoginAt: string
  gamificationPoints: number
  propertyId: number | null
}

interface LoginResponse {
  accessToken: string
  user: User
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('auth_token'))

  const user = ref<User | null>(null)
  try {
    const stored = localStorage.getItem('auth_user')
    if (stored) user.value = JSON.parse(stored)
  } catch {
    localStorage.removeItem('auth_user')
  }

  const isAuthenticated = computed(() => !!token.value)

  function setSession(accessToken: string, userData: User) {
    token.value = accessToken
    user.value = userData
    localStorage.setItem('auth_token', accessToken)
    localStorage.setItem('auth_user', JSON.stringify(userData))
  }

  async function login(email: string, password: string) {
    const data = await apiRequest<LoginResponse>('POST', '/auth/login', { email, password })
    setSession(data.accessToken, data.user)
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    router.push('/login')
  }

  return { user, token, isAuthenticated, login, logout, setSession }
})
