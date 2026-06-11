<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiRequest } from '@/services/api'
import UserNavBar from '@/components/nav/UserNavBar.vue'
import { EnergyLabel } from '@/types/enums'
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
const houseNumber = ref('')
const houseNumberSuffix = ref('')
const postcode = ref('')
const energyLabelBefore = ref<EnergyLabel>(EnergyLabel.G)
const energyLabelAfter = ref<EnergyLabel>(EnergyLabel.G)
const regionId = ref<number | ''>('')
const tenantEmail = ref('')

const energyLabelOptions: { value: EnergyLabel; label: string }[] = [
  { value: EnergyLabel.A_PLUS_PLUS_PLUS, label: 'A+++' },
  { value: EnergyLabel.A_PLUS_PLUS, label: 'A++' },
  { value: EnergyLabel.A_PLUS, label: 'A+' },
  { value: EnergyLabel.A, label: 'A' },
  { value: EnergyLabel.B, label: 'B' },
  { value: EnergyLabel.C, label: 'C' },
  { value: EnergyLabel.D, label: 'D' },
  { value: EnergyLabel.E, label: 'E' },
  { value: EnergyLabel.F, label: 'F' },
  { value: EnergyLabel.G, label: 'G' },
]

onMounted(async () => {
  isLoading.value = true
  try {
    const [regionsData, propertyData, _] = await Promise.all([
      apiRequest<Region[]>('GET', '/api/regions'),
      apiRequest<Property>('GET', `/api/properties/${propertyId}`),
      fixRoundsStore.ensureLoaded() // Laad de fixrondes voor de dropdown
    ])

    regions.value = regionsData

    street.value = propertyData.street
    houseNumber.value = propertyData.houseNumber
    houseNumberSuffix.value = propertyData.houseNumberSuffix ?? ''
    postcode.value = propertyData.postcode
    tenantEmail.value = propertyData.tenantEmail ?? ''
    energyLabelBefore.value = propertyData.energyLabelBefore ?? EnergyLabel.G
    energyLabelAfter.value = propertyData.energyLabelAfter ?? EnergyLabel.G

    regionId.value = (propertyData as any).region?.id ?? propertyData.regionId ?? ''

    // Haal de fixronde op. Checkt op fixRoundId, of fixRound object afhankelijk van je API response
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
      houseNumber: houseNumber.value,
      houseNumberSuffix: houseNumberSuffix.value,
      postcode: postcode.value,
      energyLabelBefore: energyLabelBefore.value,
      energyLabelAfter: energyLabelAfter.value,
      regionId: regionId.value as number,
      tenantEmail: tenantEmail.value,
      fixRoundId: fixRoundId.value, // Wordt nu netjes meegestuurd!
    }

    await apiRequest<Property>('PUT', `/api/properties/${propertyId}`, body)

    // Flush de cache: de applicatie is nu verplicht de database opnieuw te raadplegen
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
      <div class="card">
        <div class="header-actions">
          <h1>Woning bewerken</h1>
          <button class="btn-cancel" @click="cancel" type="button">Annuleren</button>
        </div>

        <div v-if="isLoading" class="state-message">Gegevens inladen...</div>

        <form v-else @submit.prevent="handleSubmit">
          <div class="form-row">
            <div class="form-group">
              <label for="street">Straat</label>
              <input id="street" v-model="street" type="text" required />
            </div>
            <div class="form-group form-group--narrow">
              <label for="houseNumber">Huisnummer</label>
              <input id="houseNumber" v-model="houseNumber" type="text" required />
            </div>
          </div>

          <div class="form-group">
            <label for="houseNumberSuffix">Toevoeging <span class="optional">(optioneel)</span></label>
            <input id="houseNumberSuffix" v-model="houseNumberSuffix" type="text" />
          </div>

          <div class="form-group">
            <label for="postcode">Postcode</label>
            <input id="postcode" v-model="postcode" type="text" required />
          </div>

          <div class="form-group">
            <label for="regionId">Regio</label>
            <select id="regionId" v-model="regionId" required>
              <option value="" disabled>Kies een regio</option>
              <option v-for="region in regions" :key="region.id" :value="region.id">
                {{ region.name }}
              </option>
            </select>
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
            <input id="tenantEmail" v-model="tenantEmail" type="email"/>
          </div>

          <div class="form-row form-row--equal">
            <div class="form-group">
              <label for="energyLabelBefore">Energielabel voor</label>
              <select id="energyLabelBefore" v-model="energyLabelBefore" required>
                <option v-for="opt in energyLabelOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label for="energyLabelAfter">Energielabel na</label>
              <select id="energyLabelAfter" v-model="energyLabelAfter" required>
                <option v-for="opt in energyLabelOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
          </div>

          <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

          <button type="submit" class="btn-save" :disabled="isSaving">
            {{ isSaving ? 'Opslaan...' : 'Wijzigingen opslaan' }}
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
.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}
.header-actions h1 {
  font-size: 1.25rem;
  color: #1a1a2e;
  margin: 0;
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
input, select {
  padding: 0.625rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.15s;
  background: white;
  color: #111827;
}
input:focus, select:focus {
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
.btn-save {
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
.btn-save:hover:not(:disabled) {
  background: #2563eb;
}
.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-cancel {
  padding: 0.4rem 0.8rem;
  background: transparent;
  color: #6b7280;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-cancel:hover {
  background: #f3f4f6;
  color: #374151;
}
</style>