<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { apiRequest } from '@/services/api'
import UserNavBar from '@/components/nav/UserNavBar.vue'
import { useFixRoundsStore } from '@/stores/fixRounds'
import type { Region } from '@/types'

// Deze interface representeert de 'platte' data die we van onze nieuwe API verwachten
interface DashboardMaterialRow {
  propertyId: number
  address: string
  regionId: number
  regionName: string
  fixRoundId: number | null
  fixRoundName: string | null
  visitDate: string
  materialName: string
  quantity: number
  cost: number // Totale kosten van deze specifieke regel (bijv. prijs per stuk * quantity)
}

const fixRoundsStore = useFixRoundsStore()
const regions = ref<Region[]>([])
const materialsData = ref<DashboardMaterialRow[]>([])
const isLoading = ref(true)
const errorMessage = ref('')

// Filters
const selectedRoundId = ref<number | ''>('')
const selectedRegionId = ref<number | ''>('')
const searchQuery = ref('')

onMounted(async () => {
  isLoading.value = true
  try {
    const [regionsRes, materialsRes, _] = await Promise.all([
      apiRequest<Region[]>('GET', '/api/regions'),
      // Dit is het nieuwe endpoint dat we nog in de backend moeten maken!
      apiRequest<DashboardMaterialRow[]>('GET', '/api/reports/installed-materials'),
      fixRoundsStore.ensureLoaded()
    ])

    regions.value = regionsRes
    materialsData.value = materialsRes
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Er is iets misgegaan bij het laden van de data'
  } finally {
    isLoading.value = false
  }
})

// De gefilterde lijst die in de tabel wordt getoond
const filteredMaterials = computed(() => {
  return materialsData.value.filter((row) => {
    const matchRound = selectedRoundId.value === '' || row.fixRoundId === selectedRoundId.value
    const matchRegion = selectedRegionId.value === '' || row.regionId === selectedRegionId.value
    const matchSearch = row.materialName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      row.address.toLowerCase().includes(searchQuery.value.toLowerCase())

    return matchRound && matchRegion && matchSearch
  })
})

// Berekent de totale kosten van alleen de rijen die momenteel gefilterd zijn
const totalCosts = computed(() => {
  return filteredMaterials.value.reduce((sum, row) => sum + row.cost, 0)
})

// Berekent het totaal aantal geplaatste items van alleen de rijen die momenteel gefilterd zijn
const totalItems = computed(() => {
  return filteredMaterials.value.reduce((sum, row) => sum + row.quantity, 0)
})

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('nl-NL', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}
</script>

<template>
  <div class="page">
    <UserNavBar />

    <main class="content">
      <div class="list-header">
        <h1>Materialen Overzicht</h1>
      </div>

      <div v-if="isLoading" class="state-message">Data inladen...</div>
      <div v-else-if="errorMessage" class="error">{{ errorMessage }}</div>

      <template v-else>
        <div class="kpi-grid">
          <div class="card kpi-card">
            <span class="kpi-label">Totale kosten (gefilterd)</span>
            <span class="kpi-value text-blue">{{ formatCurrency(totalCosts) }}</span>
          </div>
          <div class="card kpi-card">
            <span class="kpi-label">Aantal items geplaatst</span>
            <span class="kpi-value">{{ totalItems }}</span>
          </div>
        </div>

        <div class="card filter-card">
          <div class="filter-group search-group">
            <label for="search">Zoeken</label>
            <input id="search" v-model="searchQuery" type="text" placeholder="Zoek op materiaal of adres..." />
          </div>
          <div class="filter-group">
            <label for="roundFilter">Fixronde</label>
            <select id="roundFilter" v-model="selectedRoundId">
              <option value="">Alle rondes</option>
              <option v-for="round in fixRoundsStore.rounds" :key="round.id" :value="round.id">
                {{ round.name }}
              </option>
            </select>
          </div>
          <div class="filter-group">
            <label for="regionFilter">Regio</label>
            <select id="regionFilter" v-model="selectedRegionId">
              <option value="">Alle regio's</option>
              <option v-for="region in regions" :key="region.id" :value="region.id">
                {{ region.name }}
              </option>
            </select>
          </div>
        </div>

        <div class="card table-card">
          <div v-if="filteredMaterials.length === 0" class="state-message">
            Geen materialen gevonden voor deze filters.
          </div>
          <div class="table-wrapper" v-else>
            <table>
              <thead>
              <tr>
                <th>Datum</th>
                <th>Woning</th>
                <th>Ronde / Regio</th>
                <th>Materiaal</th>
                <th class="text-right">Aantal</th>
                <th class="text-right">Kosten</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="(row, index) in filteredMaterials" :key="index">
                <td class="subtext">{{ formatDate(row.visitDate) }}</td>
                <td class="font-medium">{{ row.address }}</td>
                <td>
                  <div class="stacked-cell">
                    <span>{{ row.fixRoundName || 'Geen ronde' }}</span>
                    <span class="subtext">{{ row.regionName }}</span>
                  </div>
                </td>
                <td>{{ row.materialName }}</td>
                <td class="text-right font-medium">{{ row.quantity }}x</td>
                <td class="text-right font-medium text-blue">{{ formatCurrency(row.cost) }}</td>
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
.page { min-height: 100vh; display: flex; flex-direction: column; }
.content { max-width: 1000px; width: 100%; margin: 2rem auto; padding: 0 1rem; display: flex; flex-direction: column; gap: 1.5rem; }
.card { background: white; border-radius: 8px; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08); padding: 1.5rem; }

.list-header { display: flex; justify-content: space-between; align-items: center; }
.list-header h1 { font-size: 1.25rem; color: #1a1a2e; }

/* KPI Styling */
.kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.kpi-card { display: flex; flex-direction: column; gap: 0.5rem; justify-content: center; padding: 1.25rem 1.5rem; }
.kpi-label { font-size: 0.875rem; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; }
.kpi-value { font-size: 1.75rem; font-weight: 700; color: #111827; }
.text-blue { color: #3b82f6; }

/* Filters */
.filter-card { display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end; padding: 1.25rem 1.5rem; }
.filter-group { display: flex; flex-direction: column; gap: 0.4rem; min-width: 200px; }
.search-group { flex-grow: 1; }
label { font-size: 0.875rem; font-weight: 500; color: #374151; }
input, select { padding: 0.6rem 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.95rem; outline: none; background: white; color: #111827; }
input:focus, select:focus { border-color: #3b82f6; }

/* Tabel */
.table-card { padding: 0; overflow: hidden; }
.table-wrapper { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; text-align: left; }
th { background-color: #f9fafb; color: #6b7280; font-size: 0.75rem; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em; padding: 0.75rem 1.5rem; border-bottom: 1px solid #e5e7eb; }
td { padding: 1rem 1.5rem; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 0.9rem; vertical-align: middle; }
tr:last-child td { border-bottom: none; }
tr:hover { background-color: #f9fafb; }

.font-medium { font-weight: 500; }
.text-right { text-align: right; }
.subtext { color: #6b7280; font-size: 0.85rem; }
.stacked-cell { display: flex; flex-direction: column; gap: 0.2rem; }

.state-message { color: #6b7280; text-align: center; padding: 2rem; }
.error { color: #dc2626; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 1rem; }
</style>