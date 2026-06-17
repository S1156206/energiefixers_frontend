import { ref } from 'vue'
import { defineStore } from 'pinia'
import { apiRequest } from '@/services/api'
import { TenantStatus } from '@/types/enums'
import type { Property, PropertySummary } from '@/types'

export const usePropertiesStore = defineStore('properties', () => {
  const allProperties = ref<PropertySummary[]>([])
  const isLoading = ref(false)
  const isLoaded = ref(false)
  const error = ref('')

  function getForRound(roundId: number | null): PropertySummary[] {
    if (roundId === null) return allProperties.value
    return allProperties.value.filter(p => p.fixRoundId === roundId)
  }

  async function ensureLoaded() {
    if (isLoaded.value) return
    isLoading.value = true
    error.value = ''
    try {
      allProperties.value = await apiRequest<PropertySummary[]>('GET', '/api/properties')
      isLoaded.value = true
    } catch {
      error.value = 'Er is iets misgegaan'
    } finally {
      isLoading.value = false
    }
  }

  function addProperty(property: Property) {
    const summary: PropertySummary = {
      id: property.id,
      street: property.street,
      houseNumber: property.houseNumber,
      houseNumberSuffix: property.houseNumberSuffix,
      postcode: property.postcode,
      regionId: String(property.regionId),
      tenantEmail: property.tenantEmail,
      emailStatus: property.emailStatus,
      tenantStatus: TenantStatus.NOT_INVITED,
      fixRoundId: property.fixRoundId,
      fixRoundName: property.fixRoundName,
    }
    allProperties.value.unshift(summary)
  }

  function invalidateCache() {
    allProperties.value = []
    isLoaded.value = false
  }

  return { isLoading, isLoaded, error, getForRound, ensureLoaded, addProperty, invalidateCache }
})
