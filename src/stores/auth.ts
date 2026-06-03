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

  async function login(email: string, password: string) {
    const data = await apiRequest<LoginResponse>('POST', '/auth/login', { email, password })
    token.value = data.accessToken
    user.value = data.user
    localStorage.setItem('auth_token', data.accessToken)
    localStorage.setItem('auth_user', JSON.stringify(data.user))
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    router.push('/login')
  }

  return { user, token, isAuthenticated, login, logout }
})
