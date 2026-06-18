<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { apiRequest } from '@/services/api'
import UserNavBar from '@/components/nav/UserNavBar.vue'
import { useFixRoundsStore } from '@/stores/fixRounds'
import type { Material } from '@/types'

interface MaterialInstallationSummary {
  materialName: string
  category: string
  totalQuantity: number
}

interface EnrichedMaterialRow extends MaterialInstallationSummary {
  unitPrice: number
  totalCost: number
}

const fixRoundsStore = useFixRoundsStore()
const selectedRoundId = ref<number | null>(null)

const dashboardData = ref<MaterialInstallationSummary[]>([])
const allMaterials = ref<Material[]>([])
const isLoading = ref(true)
const errorMessage = ref('')
const searchQuery = ref('')

async function fetchDashboardData() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    let endpoint = '/api/dashboard/materials'
    if (selectedRoundId.value !== null) {
      endpoint += `?fixRoundId=${selectedRoundId.value}`
    }

    const [dashboardRes, materialsRes] = await Promise.all([
      apiRequest<MaterialInstallationSummary[]>('GET', endpoint),
      allMaterials.value.length === 0
        ? apiRequest<Material[]>('GET', '/api/materials')
        : Promise.resolve(allMaterials.value)
    ])

    dashboardData.value = dashboardRes
    allMaterials.value = materialsRes
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Er is iets misgegaan bij het inladen van de data'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  isLoading.value = true
  try {
    await fixRoundsStore.ensureLoaded()
    selectedRoundId.value = fixRoundsStore.currentRound?.id ?? null
    await fetchDashboardData()
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Er is iets misgegaan'
    isLoading.value = false
  }
})

function selectRound(id: number | null) {
  selectedRoundId.value = id
  fetchDashboardData()
}

const enrichedMaterials = computed<EnrichedMaterialRow[]>(() => {
  const data = dashboardData.value || []
  const materials = allMaterials.value || []

  return data.map(row => {
    const mat = materials.find(m => m.name === row.materialName)
    const price = mat ? mat.priceEuros : 0

    return {
      ...row,
      unitPrice: price,
      totalCost: price * (row.totalQuantity || 0)
    }
  })
})

const filteredMaterials = computed(() => {
  const data = enrichedMaterials.value
  if (!searchQuery.value) return data

  const lowerQuery = searchQuery.value.toLowerCase()
  return data.filter(row =>
    row.materialName.toLowerCase().includes(lowerQuery) ||
    row.category.toLowerCase().includes(lowerQuery)
  )
})

const totalItems = computed(() => {
  return filteredMaterials.value.reduce((sum, row) => sum + row.totalQuantity, 0)
})

const totalCosts = computed(() => {
  return filteredMaterials.value.reduce((sum, row) => sum + row.totalCost, 0)
})

function formatCategory(category: string) {
  const map: Record<string, string> = {
    'INSULATION': 'Isolatie',
    'LIGHTING': 'Verlichting',
    'WATER': 'Water',
    'VENTILATION': 'Ventilatie',
    'OTHER': 'Overig'
  }
  return map[category.toUpperCase()] || category
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount)
}
</script>

<template>
  <div class="page">
    <UserNavBar />

    <main class="content">
      <div class="list-header">
        <h1>Materialen Overzicht</h1>
      </div>

      <div v-if="fixRoundsStore.isLoaded" class="round-selector">
        <button
          :class="['round-btn', selectedRoundId === null ? 'round-btn--active' : '']"
          @click="selectRound(null)"
        >
          Alle rondes
        </button>
        <button
          v-for="round in fixRoundsStore.rounds"
          :key="round.id"
          :class="['round-btn', selectedRoundId === round.id ? 'round-btn--active' : '']"
          @click="selectRound(round.id)"
        >
          {{ round.name }}
          <span v-if="round.current" class="round-btn__badge">Actief</span>
        </button>
      </div>

      <div v-if="isLoading" class="state-message">Gegevens laden...</div>
      <div v-else-if="errorMessage" class="error">{{ errorMessage }}</div>

      <template v-else>
        <div class="kpi-grid">
          <div class="card kpi-card">
            <span class="kpi-label">Totale kosten geplaatste materialen</span>
            <span class="kpi-value text-primary">{{ formatCurrency(totalCosts) }}</span>
          </div>
          <div class="card kpi-card">
            <span class="kpi-label">Totaal aantal items</span>
            <span class="kpi-value">{{ totalItems }}</span>
          </div>
        </div>

        <div class="card filter-card">
          <div class="filter-group search-group">
            <label for="search">Zoeken naar materialen</label>
            <input id="search" v-model="searchQuery" type="text" placeholder="Zoek op materiaal of categorie..." />
          </div>
        </div>

        <div class="card table-card">
          <div v-if="filteredMaterials.length === 0" class="state-message-card">
            Geen materialen gevonden voor deze selectie.
          </div>
          <div class="table-wrapper" v-else>
            <table>
              <thead>
              <tr>
                <th>Materiaal</th>
                <th>Categorie</th>
                <th class="text-right">Stuksprijs</th>
                <th class="text-right">Totaal geplaatst</th>
                <th class="text-right">Totale kosten</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="(row, index) in filteredMaterials" :key="index">
                <td class="font-medium">{{ row.materialName }}</td>
                <td class="subtext">{{ formatCategory(row.category) }}</td>
                <td class="text-right subtext">{{ formatCurrency(row.unitPrice) }}</td>
                <td class="text-right font-medium">{{ row.totalQuantity }}x</td>
                <td class="text-right font-medium text-primary">{{ formatCurrency(row.totalCost) }}</td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
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
  max-width: 1000px;
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

.round-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.round-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 9999px;
  background: var(--color-primary-light, #FDEEE8);
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.round-btn:hover {
  border-color: var(--color-primary, #f15a22);
  color: var(--color-primary, #f15a22);
}

.round-btn--active {
  background: var(--color-primary-light, #FDEEE8);
  border-color: var(--color-primary, #f15a22);
  color: var(--color-primary, #f15a22);
}

.round-btn__badge {
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  letter-spacing: 0.02em;
}

.round-btn--active .round-btn__badge {
  background: var(--color-primary, #f15a22);
  color: white;
}

.round-btn:not(.round-btn--active) .round-btn__badge {
  background: #f3f4f6;
  color: #6b7280;
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

.kpi-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.kpi-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  justify-content: center;
  padding: 1.25rem 1.5rem;
}

.kpi-label {
  font-size: 0.875rem;
  color: #4b5563;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.kpi-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
}

.text-primary {
  color: var(--color-primary, #f15a22);
}

.filter-card {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: flex-end;
  padding: 1.25rem 1.5rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 200px;
}

.search-group {
  flex-grow: 1;
}

label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #374151;
}

input {
  padding: 0.6rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
  outline: none;
  background: white;
  color: #1a1a2e;
}

input:focus {
  outline: none;
  border-color: var(--color-primary, #f15a22);
  box-shadow: 0 0 0 2px rgba(241, 90, 34, 0.2);
}

.table-card {
  padding: 0;
  overflow: hidden;
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

th {
  background-color: rgba(255, 255, 255, 0.4);
  color: #374151;
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.05em;
  padding: 0.85rem 1.5rem;
  border-bottom: 1px solid #d1d5db;
}

td {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  color: #1f2937;
  font-size: 0.95rem;
  vertical-align: middle;
}

tr:last-child td {
  border-bottom: none;
}

tr:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.font-medium {
  font-weight: 500;
}

.text-right {
  text-align: right;
}

.subtext {
  color: #4b5563;
  font-size: 0.9rem;
}

.state-message {
  color: white;
  text-align: center;
  padding: 2rem;
  font-size: 1rem;
}

.state-message-card {
  color: #4b5563;
  text-align: center;
  padding: 3rem;
  font-size: 1rem;
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
</style>