<script setup lang="ts">
import { onMounted, ref } from 'vue'
import UserNavBar from '@/components/nav/UserNavBar.vue'
import { apiRequest } from '@/services/api'

interface NeighborEntry {
  isYou: boolean
  fixVisitDate: string
  estimatedGasSavingsM3: number
  estimatedElectricitySavingsKwh: number
  actualGasSavingsM3: number | null
  actualElectricitySavingsKwh: number | null
  actualCostSavingsEuros: number | null
  hasActualData: boolean
}

interface NeighborhoodResponse {
  regionName: string
  totalNeighbors: number
  neighbors: NeighborEntry[]
}

const loading = ref(true)
const error = ref<string | null>(null)
const data = ref<NeighborhoodResponse | null>(null)

const neighborsWithNumber = computed(() => {
  if (!data.value) return []
  let num = 0
  return data.value.neighbors.map(n => ({
    ...n,
    displayNumber: n.isYou ? null : ++num,
  }))
})

function formatNumber(num: number | null): string {
  if (num === null) return '—'
  return new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 0 }).format(Math.round(num))
}
function formatCurrency(amount: number | null): string {
  if (amount === null) return '—'
  const prefix = amount >= 0 ? '+' : ''
  return prefix + new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount)
}
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

onMounted(async () => {
  try {
    data.value = await apiRequest<NeighborhoodResponse>('GET', '/api/neighborhood/savings')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Er is een fout opgetreden'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page">
    <UserNavBar />
    <div class="content-container">
      <div class="header-section">
        <h1 class="text-balance">Vergelijken met de buurt</h1>
        <p class="subtitle text-pretty">Anonieme vergelijking van jouw besparing met anderen in {{ data?.regionName ?? 'jouw regio' }}</p>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="pulse-dot-loader">
          <div class="pulse-dot"></div>
          <div class="pulse-dot"></div>
          <div class="pulse-dot"></div>
        </div>
        <span>Gegevens laden...</span>
      </div>

      <div v-else-if="error" class="error-state">
        {{ error }}
      </div>

      <div v-else-if="!data || data.totalNeighbors === 0" class="empty-state">
        <div class="empty-card">
          <h2>Nog geen buren om mee te vergelijken</h2>
          <p>Er zijn nog niet genoeg woningen in jouw regio met besparingsgegevens. Zodra er meer data beschikbaar is, zie je hier een anonieme vergelijking.</p>
        </div>
      </div>

      <template v-else>
        <div class="summary-row">
          <div class="summary-card">
            <span class="summary-label">Regio</span>
            <span class="summary-value">{{ data.regionName }}</span>
          </div>
          <div class="summary-card">
            <span class="summary-label">Deelnemende woningen</span>
            <span class="summary-value tabular-nums">{{ data.totalNeighbors }}</span>
          </div>
        </div>

        <div class="table-wrapper">
          <table class="neighbor-table">
            <thead>
              <tr>
                <th aria-label="Nummer"></th>
                <th>Fixbezoek</th>
                <th class="num-col">Gas (m³)</th>
                <th class="num-col">Elektriciteit (kWh)</th>
                <th class="num-col">Kostenbesparing</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(n, i) in neighborsWithNumber"
                :key="i"
                :class="['neighbor-row', { 'is-you': n.isYou }]"
              >
                <td class="label-cell">
                  <span v-if="n.isYou" class="you-badge">Jij</span>
                  <span v-else class="anon-badge">Buur {{ n.displayNumber }}</span>
                </td>
                <td class="tabular-nums">{{ formatDate(n.fixVisitDate) }}</td>
                <td class="tabular-nums gas">{{ formatNumber(n.hasActualData ? n.actualGasSavingsM3 : n.estimatedGasSavingsM3) }}</td>
                <td class="tabular-nums electra">{{ formatNumber(n.hasActualData ? n.actualElectricitySavingsKwh : n.estimatedElectricitySavingsKwh) }}</td>
                <td class="tabular-nums euros">{{ n.hasActualData ? formatCurrency(n.actualCostSavingsEuros) : '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="info-card">
          <div class="info-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2">
              <circle cx="12" cy="12" r="10" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="12" y1="16" x2="12" y2="12" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="12" y1="8" x2="12.01" y2="8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="info-text">
            <p>Alle gegevens zijn anoniem weergegeven. Jouw positie is willekeurig in de lijst — alleen jij ziet welke rij van jou is.</p>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-primary, #f15a22);
}

.content-container {
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  padding: 0 1rem;
}

.header-section {
  margin-top: 2rem;
  margin-bottom: 1.5rem;
}

.header-section h1 {
  font-size: 1.5rem;
  color: white;
  margin: 0 0 0.25rem;
}

.subtitle {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

.loading-state {
  color: white;
  text-align: center;
  padding: 3rem 2rem;
  font-size: 1.1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.pulse-dot-loader {
  display: flex;
  gap: 0.5rem;
}

.pulse-dot {
  width: 10px;
  height: 10px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  animation: pulse 1.4s ease-in-out infinite;
}

.pulse-dot:nth-child(2) { animation-delay: 0.2s; }
.pulse-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes pulse {
  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1); }
}

.error-state {
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  padding: 1rem 1.5rem;
  font-weight: 500;
}

.empty-state {
  display: flex;
  justify-content: center;
  padding: 2rem 0;
}

.empty-card {
  background: white;
  border-radius: 10px;
  padding: 3rem 2rem;
  text-align: center;
  max-width: 480px;
  box-shadow:
    0px 0px 0px 1px rgba(0, 0, 0, 0.06),
    0px 1px 2px -1px rgba(0, 0, 0, 0.06),
    0px 2px 4px 0px rgba(0, 0, 0, 0.04);
}

.empty-card h2 {
  font-size: 1.2rem;
  color: #333;
  margin: 0 0 0.5rem;
}

.empty-card p {
  font-size: 0.9rem;
  color: #666;
  line-height: 1.6;
  margin: 0;
}

.summary-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.summary-card {
  background: white;
  border-radius: 10px;
  padding: 1rem 1.25rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  box-shadow:
    0px 0px 0px 1px rgba(0, 0, 0, 0.06),
    0px 1px 2px -1px rgba(0, 0, 0, 0.06),
    0px 2px 4px 0px rgba(0, 0, 0, 0.04);
}

.summary-label {
  font-size: 0.8rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: #333;
}

.table-wrapper {
  overflow-x: auto;
  margin-bottom: 1.5rem;
  border-radius: 10px;
  box-shadow:
    0px 0px 0px 1px rgba(0, 0, 0, 0.06),
    0px 1px 2px -1px rgba(0, 0, 0, 0.06),
    0px 2px 4px 0px rgba(0, 0, 0, 0.04);
}

.neighbor-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.neighbor-table th {
  background: var(--color-primary, #f15a22);
  color: white;
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.neighbor-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.9rem;
  color: #333;
  transition: background 120ms ease-out;
}

.neighbor-row:last-child td {
  border-bottom: none;
}

.neighbor-row.is-you td {
  background: #fef3ed;
}

.neighbor-row.is-you td:first-child {
  border-left: 3px solid var(--color-primary, #f15a22);
}

.neighbor-row:hover td {
  background: #f9fafb;
}

.neighbor-row.is-you:hover td {
  background: #fde2d4;
}

.label-cell {
  min-width: 80px;
}

.you-badge {
  display: inline-block;
  background: var(--color-primary, #f15a22);
  color: white;
  font-weight: 700;
  font-size: 0.8rem;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
}

.anon-badge {
  display: inline-block;
  color: #888;
  font-size: 0.85rem;
  font-weight: 500;
}

.num-col {
  white-space: nowrap;
}

.tabular-nums {
  font-variant-numeric: tabular-nums;
}

.gas { color: #d97706; font-weight: 600; }
.electra { color: #2563eb; font-weight: 600; }
.euros { color: #059669; font-weight: 600; }

.info-card {
  background: white;
  border-radius: 10px;
  padding: 1.25rem 1.5rem;
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  margin-bottom: 2rem;
  box-shadow:
    0px 0px 0px 1px rgba(0, 0, 0, 0.06),
    0px 1px 2px -1px rgba(0, 0, 0, 0.06),
    0px 2px 4px 0px rgba(0, 0, 0, 0.04);
}

.info-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.info-text p {
  font-size: 0.9rem;
  color: #555;
  line-height: 1.6;
  margin: 0;
}

.text-balance {
  text-wrap: balance;
}

.text-pretty {
  text-wrap: pretty;
}
</style>
