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

    <main class="content">
      <div class="section-header">
        <h1>Vergelijken met de buurt</h1>
        <p class="subtitle">Anonieme vergelijking van jouw besparing met anderen in {{ data?.regionName ?? 'jouw regio' }}</p>
      </div>

      <div v-if="loading" class="state-message">Gegevens laden...</div>

      <div v-else-if="error" class="error">{{ error }}</div>

      <div v-else-if="!data || data.totalNeighbors === 0" class="card empty-card">
        <h2>Nog geen buren om mee te vergelijken</h2>
        <p>Er zijn nog niet genoeg woningen in jouw regio met besparingsgegevens. Zodra er meer data beschikbaar is, zie je hier een anonieme vergelijking.</p>
      </div>

      <template v-else>
        <div class="summary-row">
          <div class="card summary-card">
            <span class="summary-label">Regio</span>
            <span class="summary-value">{{ data.regionName }}</span>
          </div>
          <div class="card summary-card">
            <span class="summary-label">Deelnemende woningen</span>
            <span class="summary-value tabular-nums">{{ data.totalNeighbors }}</span>
          </div>
        </div>

        <div class="table-card">
          <table class="neighbor-table">
            <thead>
              <tr>
                <th></th>
                <th>Fixbezoek</th>
                <th class="num-col">Gas (m³)</th>
                <th class="num-col">Elektriciteit (kWh)</th>
                <th class="num-col">Kostenbesparing</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(n, i) in data.neighbors"
                :key="i"
                :class="['neighbor-row', { 'is-you': n.isYou }]"
              >
                <td class="label-cell">
                  <span v-if="n.isYou" class="you-badge">Jij</span>
                  <span v-else class="anon-badge">Buur {{ i + 1 }}</span>
                </td>
                <td class="tabular-nums">{{ formatDate(n.fixVisitDate) }}</td>
                <td class="tabular-nums gas">{{ formatNumber(n.hasActualData ? n.actualGasSavingsM3 : n.estimatedGasSavingsM3) }}</td>
                <td class="tabular-nums electra">{{ formatNumber(n.hasActualData ? n.actualElectricitySavingsKwh : n.estimatedElectricitySavingsKwh) }}</td>
                <td class="tabular-nums euros">{{ n.hasActualData ? formatCurrency(n.actualCostSavingsEuros) : '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="card info-card">
          <p>Alle gegevens zijn anoniem weergegeven. Jouw positie is willekeurig in de lijst — alleen jij ziet welke rij van jou is.</p>
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

.section-header h1 {
  font-size: 1.25rem;
  color: #1a1a2e;
  margin: 0 0 0.25rem;
}

.subtitle {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0;
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
  border-radius: 8px;
  padding: 1rem;
}

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 1.5rem;
}

.empty-card {
  text-align: center;
  max-width: 480px;
  margin: 0 auto;
}

.empty-card h2 {
  font-size: 1.2rem;
  color: #1a1a2e;
  margin: 0 0 0.5rem;
}

.empty-card p {
  font-size: 0.9rem;
  color: #6b7280;
  line-height: 1.6;
  margin: 0;
}

.summary-row {
  display: flex;
  gap: 1rem;
}

.summary-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.summary-label {
  font-size: 0.75rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.summary-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1a2e;
}

.table-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.neighbor-table {
  width: 100%;
  border-collapse: collapse;
}

.neighbor-table th {
  background: #f9fafb;
  color: #6b7280;
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e5e7eb;
}

.neighbor-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.9rem;
  color: #374151;
}

.neighbor-row:last-child td {
  border-bottom: none;
}

.neighbor-row.is-you td {
  background: #fef3ed;
}

.neighbor-row.is-you td:first-child {
  border-left: 3px solid #f15a22;
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
  background: #f15a22;
  color: white;
  font-weight: 700;
  font-size: 0.8rem;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
}

.anon-badge {
  display: inline-block;
  color: #9ca3af;
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

.info-card p {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
}
</style>
