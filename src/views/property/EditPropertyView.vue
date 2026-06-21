<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiRequest } from '@/services/api'
import UserNavBar from '@/components/nav/UserNavBar.vue'
import type { Region, PropertyRequest, Property } from '@/types'
import { usePropertiesStore } from '@/stores/properties'
import { useFixRoundsStore } from '@/stores/fixRounds'

const route = useRoute()
const router = useRouter()
const propertyId = Number(route.params.id)

const propertiesStore = usePropertiesStore()
const fixRoundsStore = useFixRoundsStore()

const regions = ref<Region[]>([])
const fixRoundId = ref<number | null>(null)
const errorMessage = ref('')
const isLoading = ref(true)
const isSaving = ref(false)

const street = ref('')
const city = ref('')
const houseNumber = ref('')
const houseNumberSuffix = ref('')
const postcode = ref('')
const tenantEmail = ref('')

onMounted(async () => {
  isLoading.value = true
  try {
    const [regionsData, propertyData, _] = await Promise.all([
      apiRequest<Region[]>('GET', '/api/regions'),
      apiRequest<Property>('GET', `/api/properties/${propertyId}`),
      fixRoundsStore.ensureLoaded()
    ])

    regions.value = regionsData

    street.value = propertyData.street
    city.value = propertyData.city
    houseNumber.value = propertyData.houseNumber
    houseNumberSuffix.value = propertyData.houseNumberSuffix ?? ''
    postcode.value = propertyData.postcode
    tenantEmail.value = propertyData.tenantEmail ?? ''

    fixRoundId.value = (propertyData as any).fixRoundId ?? (propertyData as any).fixRound?.id ?? null

  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Kan de woninggegevens niet inladen'
  } finally {
    isLoading.value = false
  }
})

async function handleSubmit() {
  errorMessage.value = ''
  isSaving.value = true
  try {
    const body: PropertyRequest = {
      street: street.value,
      city: city.value,
      houseNumber: houseNumber.value,
      houseNumberSuffix: houseNumberSuffix.value || null,
      postcode: postcode.value.replaceAll(' ', ''),
      tenantEmail: tenantEmail.value || null,
      fixRoundId: fixRoundId.value,
    }

    await apiRequest<Property>('PUT', `/api/properties/${propertyId}`, body)

    propertiesStore.invalidateCache()

    router.push(`/property/${propertyId}`)
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Er is iets misgegaan bij het opslaan'
  } finally {
    isSaving.value = false
  }
}

function cancel() {
  router.push(`/property/${propertyId}`)
}
</script>

<template>
  <div class="page">
    <UserNavBar />

    <main class="content">
      <div class="list-header">
        <h1>Woning bewerken</h1>
      </div>

      <div class="card form-card">
        <div v-if="isLoading" class="state-message-card">Gegevens inladen...</div>

        <form v-else @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="city">Woonplaats:</label>
            <input id="city" v-model="city" type="text" required placeholder="Woonplaats" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="street">Straatnaam:</label>
              <input id="street" v-model="street" type="text" required placeholder="Straatnaam" />
            </div>
            <div class="house-number-group form-group--narrow">
              <div class="form-group">
                <label for="houseNumber">Huisnummer</label>
                <input
                  id="houseNumber"
                  v-model="houseNumber"
                  type="text"
                  required
                  placeholder="Huisnummer"
                />
              </div>
              <div class="form-group">
                <label for="houseNumberSuffix">Toevoeging</label>
                <input
                  id="houseNumberSuffix"
                  v-model="houseNumberSuffix"
                  type="text"
                  class="house-number-suffix"
                  placeholder="A"
                />
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="postcode">Postcode:</label>
            <input id="postcode" v-model="postcode" type="text" required placeholder="1234AB" />
          </div>

          <div class="form-group form-group--fixronde">
            <label for="fixRoundId">Fixronde:</label>
            <select id="fixRoundId" v-model="fixRoundId">
              <option :value="null">Geen ronde</option>
              <option v-for="round in fixRoundsStore.rounds" :key="round.id" :value="round.id">
                {{ round.name }}{{ round.current ? ' (actief)' : '' }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="tenantEmail">E-mailadres huurder:</label>
            <input
              id="tenantEmail"
              v-model="tenantEmail"
              type="email"
              placeholder="Huurder@email.nl"
            />
          </div>

          <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="cancel" :disabled="isSaving">
              Annuleren
            </button>
            <button type="submit" class="btn btn-primary" :disabled="isSaving">
              {{ isSaving ? 'Opslaan...' : 'Wijzigingen opslaan' }}
            </button>
          </div>
        </form>
      </div>
    </main>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-primary, #f15a22);
}

.content {
  max-width: 760px;
  width: 100%;
  margin: 2rem auto;
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-header h1 {
  font-size: 1.5rem;
  color: white;
  margin: 0;
}

.card {
  background: var(--color-primary-medium);
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
  border: 1px solid #f3f4f6;
  padding: 1.5rem;
  transition: box-shadow 0.15s, transform 0.15s;
}

.card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  min-width: 0;
}

.form-group--narrow {
  min-width: 0;
}

.form-group--fixronde {
  align-items: flex-start;
}

.form-group--fixronde select {
  width: auto;
  min-width: 5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
}

.optional {
  font-weight: 400;
  color: #9ca3af;
}

input, select {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 999px;
  font-size: 0.95rem;
  outline: none;
  background: white;
  color: #374151;
  transition: box-shadow 0.15s;
}


input:focus, select:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(241, 90, 34, 0.35);
}

.house-number-group {
  display: flex;
  gap: 0.5rem;
  min-width: 0;
  align-items: flex-end;
}

.house-number-group .form-group:first-child {
  flex: 1;
  min-width: 0;
}

.house-number-group .form-group:last-child {
  flex: 0 0 3.5rem;
}

select {
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23f15a22'><path d='M4 6l4 4 4-4z'/></svg>");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 0.85rem;
  padding-right: 2.25rem;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.error {
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 1rem;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.state-message-card {
  color: #4b5563;
  text-align: center;
  padding: 3rem;
  font-size: 1rem;
}

.btn {
  padding: 0.6rem 1.2rem;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #4caf50;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #43a047;
}

.btn-secondary {
  background-color: white;
  color: var(--color-primary, #f15a22);
  border-color: var(--color-primary, #f15a22);
  border-width: 3px;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #fdeee8;
}
</style>