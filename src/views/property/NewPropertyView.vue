<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { apiRequest } from '@/services/api'
import UserNavBar from '@/components/nav/UserNavBar.vue'
import type { PropertyRequest, Property } from '@/types'
import { useFixRoundsStore } from '@/stores/fixRounds'
import { usePropertiesStore } from '@/stores/properties'

const router = useRouter()
const fixRoundsStore = useFixRoundsStore()
const propertiesStore = usePropertiesStore()

const fixRoundId = ref<number | null>(null)
const errorMessage = ref('')
const isLoading = ref(false)

const street = ref('')
const houseNumber = ref('')
const houseNumberSuffix = ref('')
const postcode = ref('')
const tenantEmail = ref('')

onMounted(async () => {
  isLoading.value = true
  try {
    await fixRoundsStore.ensureLoaded()
    fixRoundId.value = fixRoundsStore.currentRound?.id ?? null
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Er is iets misgegaan'
  } finally {
    isLoading.value = false
  }
})

async function handleSubmit() {
  errorMessage.value = ''
  isLoading.value = true
  try {
    const body: PropertyRequest = {
      street: street.value,
      houseNumber: houseNumber.value,
      houseNumberSuffix: houseNumberSuffix.value || null,
      postcode: postcode.value.replaceAll(' ', ''),
      tenantEmail: tenantEmail.value || null,
      fixRoundId: fixRoundId.value,
    }
    const newProperty = await apiRequest<Property>('POST', '/api/properties', body)
    propertiesStore.addProperty(newProperty)
    router.push(`/property/${newProperty.id}`)
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Er is iets misgegaan'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="page">
    <UserNavBar />

    <main class="content">
      <div class="list-header">
        <h1>Nieuwe woning toevoegen</h1>
      </div>

      <div class="card form-card">
        <div v-if="isLoading" class="state-message-card">Gegevens laden...</div>

        <form v-else @submit.prevent="handleSubmit">
          <div class="form-row">
            <div class="form-group">
              <label for="street">Straat</label>
              <input id="street" v-model="street" type="text" required placeholder="Breestraat" />
            </div>
            <div class="form-group form-group--narrow">
              <label for="houseNumber">Huisnummer</label>
              <input
                id="houseNumber"
                v-model="houseNumber"
                type="text"
                required
                placeholder="12"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="houseNumberSuffix">Toevoeging <span class="optional">(optioneel)</span></label>
            <input id="houseNumberSuffix" v-model="houseNumberSuffix" type="text" placeholder="A" />
          </div>

          <div class="form-group">
            <label for="postcode">Postcode</label>
            <input id="postcode" v-model="postcode" type="text" required placeholder="2311 GZ" />
          </div>

          <div class="form-group">
            <label for="fixRoundId">Fixronde <span class="optional">(optioneel)</span></label>
            <select id="fixRoundId" v-model="fixRoundId">
              <option :value="null">Geen ronde</option>
              <option v-for="round in fixRoundsStore.rounds" :key="round.id" :value="round.id">
                {{ round.name }}{{ round.current ? ' (actief)' : '' }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="tenantEmail">E-mailadres huurder</label>
            <input
              id="tenantEmail"
              v-model="tenantEmail"
              type="email"
              placeholder="huurder@email.nl"
            />
          </div>

          <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="router.back()" :disabled="isLoading">
              Annuleren
            </button>
            <button type="submit" class="btn btn-primary" :disabled="isLoading">
              {{ isLoading ? 'Opslaan...' : 'Woning opslaan' }}
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
  background: var(--color-primary-light, #FDEEE8);
  border-radius: 8px;
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
  gap: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.75rem;
  align-items: end;
}

.form-group--narrow input {
  width: 6rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #374151;
}

.optional {
  font-weight: 400;
  color: #9ca3af;
}

input, select {
  padding: 0.6rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
  outline: none;
  background: white;
  color: #1a1a2e;
  transition: border-color 0.15s;
}

input:focus, select:focus {
  outline: none;
  border-color: var(--color-primary, #f15a22);
  box-shadow: 0 0 0 2px rgba(241, 90, 34, 0.2);
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

/* Simpele knop styling zonder shutter animatie */
.btn {
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
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
  background-color: var(--color-primary, #f15a22);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #d14917;
}

.btn-secondary {
  background-color: white;
  color: #374151;
  border-color: #d1d5db;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #f9fafb;
  border-color: #9ca3af;
}
</style>