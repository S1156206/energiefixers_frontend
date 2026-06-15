import { ref } from 'vue'
import { defineStore } from 'pinia'
import { apiRequest } from '@/services/api'
import type { Material, MaterialRequest } from '@/types'

export const useMaterialsStore = defineStore('materials', () => {
  const materials = ref<Material[]>([])
  const isLoaded = ref(false)
  const isLoading = ref(false)
  const error = ref('')

  async function ensureLoaded() {
    if (isLoaded.value) return
    try {
      materials.value = await apiRequest<Material[]>('GET', '/api/materials')
      isLoaded.value = true
    } catch {
      error.value = 'Materialen konden niet worden geladen'
    }
  }

  async function createMaterial(data: MaterialRequest): Promise<Material> {
    isLoading.value = true
    try {
      const created = await apiRequest<Material>('POST', '/api/materials', data)
      materials.value.push(created)
      return created
    } finally {
      isLoading.value = false
    }
  }

  async function updateMaterial(id: number, data: MaterialRequest): Promise<Material> {
    isLoading.value = true
    try {
      const updated = await apiRequest<Material>('PUT', `/api/materials/${id}`, data)
      const idx = materials.value.findIndex((m) => m.id === id)
      if (idx !== -1) materials.value[idx] = updated
      return updated
    } finally {
      isLoading.value = false
    }
  }

  return { materials, isLoaded, isLoading, error, ensureLoaded, createMaterial, updateMaterial }
})
