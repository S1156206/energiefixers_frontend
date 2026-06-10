import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { apiRequest } from '@/services/api'
import type { FixRound, FixRoundRequest } from '@/types'

export const useFixRoundsStore = defineStore('fixRounds', () => {
  const rounds = ref<FixRound[]>([])
  const isLoaded = ref(false)
  const isLoading = ref(false)
  const error = ref('')

  const currentRound = computed(() => rounds.value.find((r) => r.current) ?? null)

  async function ensureLoaded() {
    if (isLoaded.value) return
    try {
      rounds.value = await apiRequest<FixRound[]>('GET', '/api/fix-rounds')
      isLoaded.value = true
    } catch {
      error.value = 'Fixrondes konden niet worden geladen'
    }
  }

  async function createRound(data: FixRoundRequest): Promise<FixRound> {
    isLoading.value = true
    try {
      const created = await apiRequest<FixRound>('POST', '/api/fix-rounds', data)
      rounds.value.push(created)
      return created
    } finally {
      isLoading.value = false
    }
  }

  async function updateRound(id: number, data: FixRoundRequest): Promise<FixRound> {
    isLoading.value = true
    try {
      const updated = await apiRequest<FixRound>('PUT', `/api/fix-rounds/${id}`, data)
      const idx = rounds.value.findIndex((r) => r.id === id)
      if (idx !== -1) rounds.value[idx] = updated
      return updated
    } finally {
      isLoading.value = false
    }
  }

  async function setCurrentRound(id: number): Promise<void> {
    isLoading.value = true
    try {
      await apiRequest<FixRound>('PUT', `/api/fix-rounds/${id}/set-current`)
      for (const r of rounds.value) {
        r.current = r.id === id
      }
    } finally {
      isLoading.value = false
    }
  }

  return { rounds, isLoaded, isLoading, error, currentRound, ensureLoaded, createRound, updateRound, setCurrentRound }
})
