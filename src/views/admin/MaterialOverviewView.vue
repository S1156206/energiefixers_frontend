<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { apiRequest } from '@/services/api'
import UserNavBar from '@/components/nav/UserNavBar.vue'
import type { Material } from '@/types'

// De samengevatte data die van jouw backend DashboardController afkomt
interface MaterialInstallationSummary {
  materialName: string
  category: string
  totalQuantity: number
}

// Interne interface voor de tabel (inclusief de lokaal berekende kosten)
interface EnrichedMaterialRow extends MaterialInstallationSummary {
  unitPrice: number
  totalCost: number
}

const dashboardData = ref<MaterialInstallationSummary[]>([])
const allMaterials = ref<Material[]>([])
const isLoading = ref(true)
const errorMessage = ref('')
const searchQuery = ref('')

onMounted(async () => {
  isLoading.value = true
  try {
    // We laden de dashboard-aantallen én de materiaalprijzen tegelijkertijd in
    const [dashboardRes, materialsRes] = await Promise.all([
      apiRequest<MaterialInstallationSummary[]>('GET', '/api/dashboard/materials'),
      apiRequest<Material[]>('GET', '/api/materials')
    ])

    dashboardData.value = dashboardRes
    allMaterials.value = materialsRes
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Er is iets misgegaan bij het inladen van de data'
  } finally {
    isLoading.value = false
  }
})

// Koppel de dashboard totalen aan de actuele stuksprijzen uit de database
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

      <div v-if="isLoading" class="state-message">Data inladen...</div>
      <div v-else-if="errorMessage" class="error">{{ errorMessage }}</div>

      <template v-else>
        <div class="kpi-grid">
          <div class="card kpi-card">
            <span class="kpi-label">Totale kosten geplaatste materialen</span>
            <span class="kpi-value text-blue">{{ formatCurrency(totalCosts) }}</span>
          </div>
          <div class="card kpi-card">
            <span class="kpi-label">Totaal aantal items</span>
            <span class="kpi-value">{{ totalItems }}</span>
          </div>
        </div>

        <div class="card filter-card">
          <div class="filter-group search-group">
            <label for="search">Zoeken</label>
            <input id="search" v-model="searchQuery" type="text" placeholder="Zoek op materiaal of categorie..." />
          </div>
        </div>

        <div class="card table-card">
          <div v-if="filteredMaterials.length === 0" class="state-message">
            Geen materialen gevonden.
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
                <td class="text-right font-medium text-blue">{{ formatCurrency(row.totalCost) }}</td>
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

.kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.kpi-card { display: flex; flex-direction: column; gap: 0.5rem; justify-content: center; padding: 1.25rem 1.5rem; }
.kpi-label { font-size: 0.875rem; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; }
.kpi-value { font-size: 1.75rem; font-weight: 700; color: #111827; }
.text-blue { color: #3b82f6; }

.filter-card { display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end; padding: 1.25rem 1.5rem; }
.filter-group { display: flex; flex-direction: column; gap: 0.4rem; min-width: 200px; }
.search-group { flex-grow: 1; }
label { font-size: 0.875rem; font-weight: 500; color: #374151; }
input { padding: 0.6rem 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.95rem; outline: none; background: white; color: #111827; }
input:focus { border-color: #3b82f6; }

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
.state-message { color: #6b7280; text-align: center; padding: 2rem; }
.error { color: #dc2626; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 1rem; }
</style>