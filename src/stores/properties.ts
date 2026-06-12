import { ref } from 'vue'
import { defineStore } from 'pinia'
import { apiRequest } from '@/services/api'
import { TenantStatus } from '@/types/enums'
import type { Property, PropertySummary } from '@/types'

export const usePropertiesStore = defineStore('properties', () => {
  const cache = ref<Record<string, PropertySummary[]>>({})
  const isLoading = ref(false)
  const error = ref('')

  function cacheKey(roundId: number | null): string {
    return roundId == null ? 'null' : String(roundId)
  }

  function isCached(roundId: number | null): boolean {
    return cacheKey(roundId) in cache.value
  }

  function getForRound(roundId: number | null): PropertySummary[] {
    return cache.value[cacheKey(roundId)] ?? []
  }

  async function fetchForRound(roundId: number | null) {
    isLoading.value = true
    error.value = ''
    try {
      const path = roundId != null ? `/api/properties?fixRoundId=${roundId}` : '/api/properties'
      cache.value[cacheKey(roundId)] = await apiRequest<PropertySummary[]>('GET', path)
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
    const roundList = property.fixRoundId != null ? cache.value[cacheKey(property.fixRoundId)] : undefined
    if (roundList) roundList.unshift(summary)

    const allList = cache.value['null']
    if (allList) allList.unshift(summary)
  }

  function invalidateCache(){
    cache.value = {}
  }

  return { isLoading, error, isCached, getForRound, fetchForRound, addProperty, invalidateCache }
})
