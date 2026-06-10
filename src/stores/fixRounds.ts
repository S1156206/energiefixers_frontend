import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { apiRequest } from '@/services/api'
import type { FixRound } from '@/types'

export const useFixRoundsStore = defineStore('fixRounds', () => {
  const rounds = ref<FixRound[]>([])
  const isLoaded = ref(false)
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

  return { rounds, isLoaded, error, currentRound, ensureLoaded }
})
