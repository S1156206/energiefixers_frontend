<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { apiRequest } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import UserNavBar from '@/components/nav/UserNavBar.vue'
import EnergyChart from '@/components/energy/EnergyChart.vue'
import type { EnergyReading, EnergyReadingForm } from '@/types'

const authStore = useAuthStore()

const isLoading = ref(true)
const energyReadings = ref<EnergyReading[]>([])
const sortedReadings = computed(() =>
    [...energyReadings.value].sort((a, b) => b.periodStart.localeCompare(a.periodStart))
)
const errorMessage = ref('')
const visitDate = ref<string | null>(null)

const showForm = ref(false)
const editingId = ref<number | null>(null)
const formError = ref('')
const formLoading = ref(false)
const form = reactive<EnergyReadingForm>({
    periodStart: '',
    periodEnd: '',
    gasUsageM3: null,
    electricityUsageKwh: null,
    totalCostEuros: null,
})

const activeSavingsTab = ref<'recent' | 'total'>('recent')

const savingsData = computed(() => {
  const readings = sortedReadings.value
  if (readings.length < 2) return null

  const newest = readings[0]
  const previous = readings[1]
  const oldest = readings[readings.length - 1]

  if (!newest || !previous || !oldest) return null

  const calcSavings = (oldR: EnergyReading, newR: EnergyReading) => {
    return {
      cost: (oldR.totalCostEuros || 0) - (newR.totalCostEuros || 0),
      gas: (oldR.gasUsageM3 || 0) - (newR.gasUsageM3 || 0),
      electricity: (oldR.electricityUsageKwh || 0) - (newR.electricityUsageKwh || 0),
      periodLabel: `${new Date(oldR.periodStart).getFullYear()} vs ${new Date(newR.periodStart).getFullYear()}`
    }
  }

  const recent = calcSavings(previous, newest)
  let total = null

  if (readings.length > 2) {
    total = calcSavings(oldest, newest)
  }

  return { recent, total }
})

const currentSavings = computed(() => {
  if (!savingsData.value) return null
  return activeSavingsTab.value === 'recent' ? savingsData.value.recent : savingsData.value.total
})

onMounted(async () => {
    try {
        const [readings, property] = await Promise.all([
            apiRequest<EnergyReading[]>('GET', '/api/energy-readings'),
            apiRequest<{ fixVisits: { visitDate: string }[] }>('GET', '/api/properties/me'),
        ])
        energyReadings.value = readings
        visitDate.value = property.fixVisits[0]?.visitDate ?? null
    } catch (err) {
        errorMessage.value = err instanceof Error ? err.message : 'Er is iets misgegaan'
    } finally {
        isLoading.value = false
    }
})

function openAddForm() {
    editingId.value = null
    form.periodStart = ''
    form.periodEnd = ''
    form.gasUsageM3 = null
    form.electricityUsageKwh = null
    form.totalCostEuros = null
    formError.value = ''
    showForm.value = true
}

function openEditForm(reading: EnergyReading) {
    editingId.value = reading.id
    form.periodStart = reading.periodStart
    form.periodEnd = reading.periodEnd
    form.gasUsageM3 = reading.gasUsageM3
    form.electricityUsageKwh = reading.electricityUsageKwh
    form.totalCostEuros = reading.totalCostEuros
    formError.value = ''
    showForm.value = true
}

function closeForm() {
    showForm.value = false
}

async function deleteReading(id: number) {
    if (!confirm('Weet je zeker dat je deze meting wilt verwijderen?')) return
    try {
        await apiRequest('DELETE', `/api/energy-readings/${id}`)
        energyReadings.value = energyReadings.value.filter((r) => r.id !== id)
    } catch (err) {
        errorMessage.value = err instanceof Error ? err.message : 'Verwijderen mislukt'
    }
}

async function submitForm() {
    formError.value = ''
    formLoading.value = true
    try {
        const body = {
            periodStart: form.periodStart,
            periodEnd: form.periodEnd,
            gasUsageM3: form.gasUsageM3,
            electricityUsageKwh: form.electricityUsageKwh,
            totalCostEuros: form.totalCostEuros,
        }

        if (editingId.value !== null) {
            const updated = await apiRequest<EnergyReading>('PUT', `/api/energy-readings/${editingId.value}`, body)
            const index = energyReadings.value.findIndex((r) => r.id === editingId.value)
            if (index !== -1) energyReadings.value[index] = updated
        } else {
            const created = await apiRequest<EnergyReading>('POST', '/api/energy-readings', body)
            energyReadings.value.push(created)
        }

        showForm.value = false
    } catch (err) {
        formError.value = err instanceof Error ? err.message : 'Er is iets misgegaan'
    } finally {
        formLoading.value = false
    }
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount)
}

function sourceLabel(sourceType: string) {
    return sourceType === 'ANNUAL_BILL_MANUAL' ? 'Zelf ingevoerd' : 'Ingevoerd door medewerker'
}

function getSavingsClass(amount: number) {
  if (amount > 0) return 'text-green' // Besparing
  if (amount < 0) return 'text-red'   // Meerverbruik
  return 'text-gray'                  // Gelijk gebleven
}

function formatSavingsCurrency(amount: number) {
  const prefix = amount > 0 ? '+' : ''
  return prefix + new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount)
}

function formatSavingsNumber(amount: number) {
  const prefix = amount > 0 ? '+' : ''
  return prefix + new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 0 }).format(amount)
}

</script>

<template>
    <div class="page">
        <UserNavBar />


        <main class="content">
            <div v-if="isLoading" class="state-message">Gegevens laden...</div>

            <div v-else-if="errorMessage" class="error">{{ errorMessage }}</div>

            <template v-else>
                <div class="section-header">
                    <h1>Mijn energieverbruik</h1>
                    <button class="btn-primary" @click="openAddForm">+ Nieuw verbruik</button>
                </div>

                <div v-if="visitDate" class="visit-info">
                    Fixbezoek uitgevoerd op {{ formatDate(visitDate) }}
                </div>

                <div v-if="energyReadings.length === 0" class="state-message">
                    Nog geen energiemetingen ingevoerd.
                </div>

              <div v-if="savingsData" class="savings-container">
                <div class="savings-tabs" v-if="savingsData.total">
                  <button
                    :class="['tab-btn', { active: activeSavingsTab === 'recent' }]"
                    @click="activeSavingsTab = 'recent'"
                  >Recente besparing</button>
                  <button
                    :class="['tab-btn', { active: activeSavingsTab === 'total' }]"
                    @click="activeSavingsTab = 'total'"
                  >Totale besparing</button>
                </div>

                <div v-if="currentSavings" class="card savings-card">
                  <h3 class="savings-title">
                    {{ activeSavingsTab === 'recent' ? 'Besparing laatste periode' : 'Totale besparing' }}
                    <span class="savings-period-label">({{ currentSavings.periodLabel }})</span>
                  </h3>

                  <div class="savings-stats">
                    <div class="stat">
                      <span class="stat-label">Kosten bespaard</span>
                      <span :class="['stat-value', getSavingsClass(currentSavings.cost)]">
                    {{ formatSavingsCurrency(currentSavings.cost) }}
                </span>
                    </div>
                    <div class="stat">
                      <span class="stat-label">Gas bespaard</span>
                      <span :class="['stat-value', getSavingsClass(currentSavings.gas)]">
                    {{ formatSavingsNumber(currentSavings.gas) }} m³
                </span>
                    </div>
                    <div class="stat">
                      <span class="stat-label">Elektriciteit bespaard</span>
                      <span :class="['stat-value', getSavingsClass(currentSavings.electricity)]">
                    {{ formatSavingsNumber(currentSavings.electricity) }} kWh
                </span>
                    </div>
                  </div>
                </div>
              </div>

                <EnergyChart v-if="energyReadings.length > 0" :readings="sortedReadings" />


                <div v-for="reading in sortedReadings" :key="reading.id" class="card reading-card">
                    <div class="reading-header">
                        <div>
                            <span class="reading-period">
                                {{ formatDate(reading.periodStart) }} — {{ formatDate(reading.periodEnd) }}
                            </span>
                            <span class="source-badge">{{ sourceLabel(reading.sourceType) }}</span>
                        </div>
                        <div v-if="reading.sourceType === 'ANNUAL_BILL_MANUAL'" class="reading-actions">
                            <button class="btn-edit" @click="openEditForm(reading)">Bewerken</button>
                            <button class="btn-delete" @click="deleteReading(reading.id)">Verwijderen</button>
                        </div>
                    </div>

                    <div class="reading-stats">
                        <div class="stat">
                            <span class="stat-label">Gas</span>
                            <span class="stat-value">{{ reading.gasUsageM3 }} m³</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Elektriciteit</span>
                            <span class="stat-value">{{ reading.electricityUsageKwh }} kWh</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Totale kosten</span>
                            <span class="stat-value highlight">{{ formatCurrency(reading.totalCostEuros) }}</span>
                        </div>
                    </div>
                </div>
            </template>
        </main>

        <div v-if="showForm" class="overlay" @click.self="closeForm">
            <div class="modal">
                <div class="modal-header">
                    <h2>{{ editingId !== null ? 'Verbruik bewerken' : 'Nieuw verbruik invoeren' }}</h2>
                    <button class="close-btn" @click="closeForm">✕</button>
                </div>

                <form @submit.prevent="submitForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Startdatum</label>
                            <input v-model="form.periodStart" type="date" required />
                        </div>
                        <div class="form-group">
                            <label>Einddatum</label>
                            <input v-model="form.periodEnd" type="date" required />
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Gasverbruik (m³)</label>
                        <input v-model.number="form.gasUsageM3" type="number" step="0.01" min="0" required />
                    </div>

                    <div class="form-group">
                        <label>Elektriciteitsverbruik (kWh)</label>
                        <input v-model.number="form.electricityUsageKwh" type="number" step="0.01" min="0" required />
                    </div>

                    <div class="form-group">
                        <label>Totale kosten (€)</label>
                        <input v-model.number="form.totalCostEuros" type="number" step="0.01" min="0" required />
                    </div>

                    <p v-if="formError" class="error">{{ formError }}</p>

                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" @click="closeForm">Annuleren</button>
                        <button type="submit" class="btn-primary" :disabled="formLoading">
                            {{ formLoading ? 'Bezig...' : editingId !== null ? 'Opslaan' : 'Toevoegen' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<style scoped>
.page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.topbar {
    background: white;
    border-bottom: 1px solid #e5e7eb;
    padding: 0 1.5rem;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.topbar-title {
    font-weight: 700;
    color: #1a1a2e;
    font-size: 1.1rem;
}

.topbar-right {
    display: flex;
    align-items: center;
    gap: 1rem;
    color: #6b7280;
    font-size: 0.9rem;
}

.logout-btn {
    background: none;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 0.35rem 0.75rem;
    font-size: 0.875rem;
    cursor: pointer;
    color: #374151;
}

.logout-btn:hover {
    background: #f3f4f6;
}

.content {
    max-width: 720px;
    width: 100%;
    margin: 2rem auto;
    padding: 0 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.section-header h1 {
    font-size: 1.25rem;
    color: #1a1a2e;
}

.card {
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    padding: 1.25rem 1.5rem;
}

.reading-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
}

.reading-period {
    font-weight: 600;
    color: #1a1a2e;
    display: block;
    margin-bottom: 0.25rem;
}

.visit-info {
    font-size: 0.875rem;
    color: #6b7280;
    background: white;
    border-left: 3px solid #3b82f6;
    border-radius: 6px;
    padding: 0.6rem 1rem;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.source-badge {
    font-size: 0.75rem;
    color: #6b7280;
    background: #f3f4f6;
    border-radius: 4px;
    padding: 0.2rem 0.5rem;
}

.reading-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
}

.stat {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.stat-label {
    font-size: 0.75rem;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.stat-value {
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
}

.stat-value.highlight {
    color: #3b82f6;
}

.btn-primary {
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
}

.btn-primary:hover:not(:disabled) {
    background: #2563eb;
}

.btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.btn-secondary {
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    cursor: pointer;
}

.btn-secondary:hover {
    background: #f3f4f6;
}

.reading-actions {
    display: flex;
    gap: 0.5rem;
}

.btn-delete {
    background: none;
    border: 1px solid #fecaca;
    border-radius: 6px;
    padding: 0.3rem 0.6rem;
    font-size: 0.8rem;
    cursor: pointer;
    color: #dc2626;
    white-space: nowrap;
}

.btn-delete:hover {
    background: #fef2f2;
}

.btn-edit {
    background: none;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 0.3rem 0.6rem;
    font-size: 0.8rem;
    cursor: pointer;
    color: #374151;
    white-space: nowrap;
}

.btn-edit:hover {
    background: #f3f4f6;
}

.state-message {
    color: #6b7280;
    text-align: center;
    padding: 2rem;
}

.error {
    color: #dc2626;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
}

/* Modal */
.overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
}

.modal {
    background: white;
    border-radius: 10px;
    padding: 1.5rem;
    width: 100%;
    max-width: 480px;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-header h2 {
    font-size: 1.1rem;
    color: #1a1a2e;
}

.close-btn {
    background: none;
    border: none;
    font-size: 1rem;
    color: #9ca3af;
    cursor: pointer;
    line-height: 1;
}

.close-btn:hover {
    color: #374151;
}

form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
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

input {
    padding: 0.6rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.95rem;
    outline: none;
}

input:focus {
    border-color: #3b82f6;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 0.5rem;
}

.savings-container {
  margin-bottom: 0.5rem;
}

.savings-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.tab-btn {
  background: transparent;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0.4rem 0.8rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s;
}

.tab-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.tab-btn.active {
  background: #eff6ff;
  border-color: #3b82f6;
  color: #3b82f6;
}

.savings-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  box-shadow: none;
}

.savings-title {
  font-size: 1rem;
  color: #1a1a2e;
  margin-bottom: 1rem;
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.savings-period-label {
  font-size: 0.8rem;
  font-weight: 400;
  color: #6b7280;
}

.savings-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.text-green {
  color: #16a34a !important;
}

.text-red {
  color: #dc2626 !important;
}

.text-gray {
  color: #6b7280 !important;
}
</style>
