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
      houseNumberSuffix: houseNumberSuffix.value,
      postcode: postcode.value,
      tenantEmail: tenantEmail.value,
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
      <div class="card">
        <h1>Nieuwe woning toevoegen</h1>

        <div v-if="isLoading" class="state-message">Laden...</div>

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
            <label for="houseNumberSuffix"
              >Toevoeging <span class="optional">(optioneel)</span></label
            >
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
              required
              placeholder="huurder@email.nl"
            />
          </div>

          <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

          <button type="submit" :disabled="isLoading">
            {{ isLoading ? 'Opslaan...' : 'Woning opslaan' }}
          </button>
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
}

.content {
  max-width: 720px;
  width: 100%;
  margin: 2rem auto;
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 1.5rem;
}

.card h1 {
  font-size: 1.25rem;
  color: #1a1a2e;
  margin-bottom: 1.5rem;
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

.form-row--equal {
  grid-template-columns: 1fr 1fr;
}

.form-group--narrow input {
  width: 6rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.optional {
  font-weight: 400;
  color: #9ca3af;
}

input,
select {
  padding: 0.625rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.15s;
  background: white;
  color: #111827;
}

input:focus,
select:focus {
  border-color: #3b82f6;
}

.error {
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 1rem;
  font-size: 0.875rem;
}

.state-message {
  color: #6b7280;
  text-align: center;
  padding: 2rem;
}

button[type='submit'] {
  padding: 0.75rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
  margin-top: 0.5rem;
}

button[type='submit']:hover:not(:disabled) {
  background: #2563eb;
}

button[type='submit']:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
