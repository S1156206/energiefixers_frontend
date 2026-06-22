<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { apiRequest } from '@/services/api'
import UserNavBar from '@/components/nav/UserNavBar.vue'

import dividerImg from '@/assets/stekkerdoos_oranje.png'
import verticalDividerImg from '@/assets/spaarlamp_oranje.png'

import iconFixrondes from '@/assets/icons/energiefixers_logo_icon.png'
import iconHouse from '@/assets/icons/house_icon.png'
import iconMoney from '@/assets/icons/money_icon.png'
import iconGas from '@/assets/icons/gas_icon.png'
import iconElectricity from '@/assets/icons/electricity_icon.png'
import iconCo2 from '@/assets/icons/co2_leaf_icon.png'

import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, LogarithmicScale
} from 'chart.js'
import { Bar } from 'vue-chartjs'
import ChartDataLabels from 'chartjs-plugin-datalabels'

ChartJS.register(CategoryScale, LinearScale, LogarithmicScale, BarElement, Title, Tooltip, Legend, ChartDataLabels)

interface FixRoundChartEntry {
  fixRoundId: number
  fixRoundName: string
  co2SavedKg: number
  savingsEuros: number
  propertiesHelped: number
  gasSavedM3: number
  electricitySavedKwh: number
}

interface PublicOverviewResponse {
  totalFixRounds: number
  totalPropertiesHelped: number
  totalSavingsEuros: number
  totalGasSavedM3: number
  totalElectricitySavedKwh: number
  totalCo2SavedKg: number
  chartData: FixRoundChartEntry[]
}

const dashboardData = ref<PublicOverviewResponse | null>(null)
const isLoading = ref(true)
const errorMessage = ref('')
const activeTab = ref<number | 'Overview'>('Overview')

onMounted(async () => {
  isLoading.value = true
  try {
    dashboardData.value = await apiRequest<PublicOverviewResponse>('GET', '/api/dashboard/public-overview')
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Er is iets misgegaan bij het inladen'
  } finally {
    isLoading.value = false
  }
})

const displayData = computed(() => {
  if (!dashboardData.value) return null
  if (activeTab.value === 'Overview') {
    return {
      propertiesHelped: dashboardData.value.totalPropertiesHelped,
      savingsEuros: dashboardData.value.totalSavingsEuros,
      gasSavedM3: dashboardData.value.totalGasSavedM3,
      electricitySavedKwh: dashboardData.value.totalElectricitySavedKwh,
      co2SavedKg: dashboardData.value.totalCo2SavedKg
    }
  }
  const round = dashboardData.value.chartData.find(r => r.fixRoundId === activeTab.value)
  return round ? {
    propertiesHelped: round.propertiesHelped,
    savingsEuros: round.savingsEuros,
    gasSavedM3: round.gasSavedM3,
    electricitySavedKwh: round.electricitySavedKwh,
    co2SavedKg: round.co2SavedKg
  } : null
})

const chartData = computed(() => {
  if (!dashboardData.value) return { labels: [], datasets: [] }
  return {
    labels: dashboardData.value.chartData.map(d => d.fixRoundName),
    datasets: [
      { label: 'Bespaarde CO₂ in kg', backgroundColor: '#65a30d', borderRadius: 6, data: dashboardData.value.chartData.map(d => d.co2SavedKg) },
      { label: 'Bespaarde Geld in Euro', backgroundColor: '#166534', borderRadius: 6, data: dashboardData.value.chartData.map(d => d.savingsEuros) },
      { label: 'Geholpen Woningen', backgroundColor: '#ea580c', borderRadius: 6, data: dashboardData.value.chartData.map(d => d.propertiesHelped) }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  layout: { padding: { top: 20 } },
  plugins: {
    legend: { position: 'top' as const, labels: { usePointStyle: true, font: { family: 'Inter, sans-serif', size: 11 } } },
    datalabels: {
      color: 'white', anchor: 'end' as const, align: 'bottom' as const, offset: 4, font: { weight: 'bold' as const, size: 12 },
      formatter: (value: number) => value > 0 ? formatNumber(value) : ''
    }
  },
  scales: {
    y: {
      type: 'logarithmic',
      display: false,
      min: 0.1
    },
    x: {
      grid: { display: false }
    }
  }
} as any

function formatNumber(num: number) { return new Intl.NumberFormat('nl-NL').format(Math.round(num)) }
function formatCurrency(amount: number) { return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount) }
</script>

<template>
  <div class="page">
    <UserNavBar />
    <main class="content">
      <div v-if="isLoading" class="state-message">Dashboard inladen...</div>
      <div v-else-if="errorMessage" class="error">{{ errorMessage }}</div>
      <template v-else-if="dashboardData && displayData">
        <div class="tabs-container">
          <button class="tab-btn" :class="{ active: activeTab === 'Overview' }" @click="activeTab = 'Overview'">Overview</button>
          <button v-for="round in dashboardData.chartData" :key="round.fixRoundId" class="tab-btn" :class="{ active: activeTab === round.fixRoundId }" @click="activeTab = round.fixRoundId">
            {{ round.fixRoundName }}
          </button>
        </div>
        <div class="dashboard-grid">
          <div class="left-column">
            <div class="top-kpi-row">
              <div class="card kpi-card dual-kpi">
                <div class="kpi-half">
                  <span class="kpi-label">FIXRONDES <img :src="iconFixrondes" class="card-icon" /></span>
                  <span class="kpi-value text-orange">{{ formatNumber(dashboardData.totalFixRounds) }}</span>
                </div>
                <img :src="verticalDividerImg" alt="divider" class="vertical-divider" />
                <div class="kpi-half">
                  <span class="kpi-label">GEHOLPEN WONINGEN <img :src="iconHouse" class="card-icon" /></span>
                  <span class="kpi-value text-orange">{{ formatNumber(displayData.propertiesHelped) }}</span>
                </div>
              </div>
              <div class="card kpi-card">
                <span class="kpi-label">BESPAARDE GELD <img :src="iconMoney" class="card-icon" /></span>
                <span class="kpi-value text-orange">{{ formatCurrency(displayData.savingsEuros) }}</span>
              </div>
            </div>
            <div class="card chart-card">
              <span class="chart-title">Overzicht per Fixronde</span>
              <div class="chart-container"><Bar :data="chartData" :options="chartOptions" /></div>
            </div>
          </div>
          <div class="right-column">
            <div class="card combined-resource-card">
              <div class="resource-block">
                <span class="kpi-label">BESPAARDE GAS <img :src="iconGas" class="card-icon" /></span>
                <span class="kpi-value text-orange">{{ formatNumber(displayData.gasSavedM3) }} <span class="unit">m³</span></span>
              </div>
              <img :src="dividerImg" alt="divider" class="custom-divider" />
              <div class="resource-block">
                <span class="kpi-label">BESPAARDE STROOM <img :src="iconElectricity" class="card-icon" /></span>
                <span class="kpi-value text-orange">{{ formatNumber(displayData.electricitySavedKwh) }} <span class="unit">kWh</span></span>
              </div>
            </div>
            <div class="card resource-card">
              <span class="kpi-label">BESPAARDE CO₂ <img :src="iconCo2" class="card-icon" /></span>
              <span class="kpi-value text-orange">{{ formatNumber(displayData.co2SavedKg) }} <span class="unit">kg</span></span>
            </div>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>

<style scoped>

.card-icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
}

.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-primary, #f15a22);
}

.content {
  max-width: 1200px;
  width: 100%;
  margin: 2rem auto;
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.tabs-container {
  display: flex;
  gap: 1rem;
  background: white;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  overflow-x: auto;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.tab-btn {
  padding: 0.5rem 1.5rem;
  border: none;
  background: transparent;
  color: var(--color-primary, #f15a22);
  font-weight: 700;
  font-size: 0.95rem;
  border-radius: 999px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.tab-btn.active,
.tab-btn:hover {
  background: var(--color-primary, #f15a22);
  color: white;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
}

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.top-kpi-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.card {
  background: #FFF5F1;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.kpi-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.dual-kpi {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  padding: 0;
}

.kpi-half {
  flex: 1;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.vertical-divider {
  height: 110px;
  width: auto;
  object-fit: contain;
  z-index: 10;
  align-self: center;
}

.combined-resource-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
}

.resource-block {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.custom-divider {
  display: block;
  width: 100%;
  height: 40px;
  margin: 1.5rem 0;
  object-fit: contain;
  position: relative;
  z-index: 10;
}

.resource-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.5rem;
}

.kpi-label {
  font-size: 0.75rem;
  color: #ea580c;
  font-weight: 600;
  text-transform: uppercase;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.kpi-value {
  font-size: 3rem;
  font-weight: 800;
  line-height: 1;
}

.text-orange {
  color: var(--color-primary, #f15a22);
}

.unit {
  font-size: 1.25rem;
  font-weight: 600;
  color: #ea580c;
}

.chart-card {
  flex: 1;
  min-height: 350px;
  display: flex;
  flex-direction: column;
}

.chart-title {
  font-size: 0.85rem;
  color: #ea580c;
  font-weight: 500;
  margin-bottom: 1rem;
}

.chart-container {
  position: relative;
  flex: 1;
  width: 100%;
}

.state-message {
  color: white;
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
  font-weight: 500;
}

.error {
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 1rem;
  font-weight: 500;
}

@media (max-width: 900px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  .top-kpi-row {
    grid-template-columns: 1fr;
  }
  .vertical-divider {
    height: 80px;
  }
}

</style>