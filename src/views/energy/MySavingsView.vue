<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import UserNavBar from '@/components/nav/UserNavBar.vue'
import { apiRequest, ApiError } from '@/services/api'
import type { TenantSavingsResponse } from '@/types'

const router = useRouter()
const loading = ref(true)
const error = ref<string | null>(null)
const savings = ref<TenantSavingsResponse | null>(null)
const noVisit = ref(false)

const displayJaarGas = computed(() =>
  savings.value?.hasMeasuredData
    ? (savings.value.annualGasSavingsM3 ?? 0)
    : (savings.value?.estimatedAnnualGasSavingsM3 ?? 0)
)
const displayJaarElec = computed(() =>
  savings.value?.hasMeasuredData
    ? (savings.value.annualElectricitySavingsKwh ?? 0)
    : (savings.value?.estimatedAnnualElectricitySavingsKwh ?? 0)
)
const displayTotaalGas = computed(() =>
  savings.value?.hasMeasuredData
    ? (savings.value.totalGasSavedToDateM3 ?? 0)
    : (savings.value?.estimatedTotalGasSavedToDateM3 ?? 0)
)
const displayTotaalElec = computed(() =>
  savings.value?.hasMeasuredData
    ? (savings.value.totalElectricitySavedToDateKwh ?? 0)
    : (savings.value?.estimatedTotalElectricitySavedToDateKwh ?? 0)
)

function formatNumber(num: number) {
  return new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 0 }).format(Math.round(num))
}
function formatCurrency(amount: number) {
  const prefix = amount > 0 ? '+' : ''
  return prefix + new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount)
}
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

onMounted(async () => {
  try {
    savings.value = await apiRequest<TenantSavingsResponse>('GET', '/api/energy-readings/savings')
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      noVisit.value = true
    } else {
      error.value = e instanceof Error ? e.message : 'Er is een fout opgetreden'
    }
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
        <h1 class="text-balance">Mijn besparing</h1>
        <p class="subtitle text-pretty">Jouw energiebesparing in één oogopslag</p>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="pulse-dot-loader">
          <div class="pulse-dot"></div>
          <div class="pulse-dot"></div>
          <div class="pulse-dot"></div>
        </div>
        <span>Besparingen laden...</span>
      </div>

      <div v-else-if="error" class="error-state">
        {{ error }}
      </div>

      <div v-else-if="noVisit" class="empty-state">
        <div class="empty-card">
          <div class="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f15a22" stroke-width="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h2>Nog geen fixbezoek</h2>
          <p>Je besparing wordt berekend na het eerste fixbezoek aan jouw woning. Zodra de materialen zijn geïnstalleerd, zie je hier je resultaten.</p>
        </div>
      </div>

      <template v-else-if="savings">
        <div class="badge-row">
          <span :class="['badge', savings.hasMeasuredData ? 'badge-measured' : 'badge-estimated']">
            {{ savings.hasMeasuredData
              ? 'Berekend op basis van jouw rekeningen'
              : 'Schatting op basis van geïnstalleerde materialen' }}
          </span>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <span class="kpi-label">Bespaard gas</span>
            <span class="kpi-value gas">{{ formatNumber(displayTotaalGas) }} <small>m³</small></span>
            <span class="kpi-annual">~{{ formatNumber(displayJaarGas) }} m³ / jaar</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-label">Bespaarde elektriciteit</span>
            <span class="kpi-value electra">{{ formatNumber(displayTotaalElec) }} <small>kWh</small></span>
            <span class="kpi-annual">~{{ formatNumber(displayJaarElec) }} kWh / jaar</span>
          </div>
          <div v-if="savings.hasMeasuredData" class="kpi-card">
            <span class="kpi-label">Bespaarde kosten</span>
            <span class="kpi-value euros">{{ formatCurrency(savings.totalCostSavedToDateEuros!) }}</span>
            <span class="kpi-annual">~{{ formatCurrency(savings.annualCostSavingsEuros!) }} / jaar</span>
          </div>
          <div v-else class="kpi-card kpi-dim">
            <span class="kpi-label">Bespaarde kosten</span>
            <span class="kpi-value muted">—</span>
            <span class="kpi-annual">Voer een rekening in om kosten te zien</span>
          </div>
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
            <p v-if="savings.hasMeasuredData">
              Jouw besparing is berekend door je energieverbruik vóór en na het fixbezoek
              ({{ formatDate(savings.firstVisitDate) }}) te vergelijken.
            </p>
            <p v-else>
              De schatting is gebaseerd op de materialen die tijdens het fixbezoek van
              {{ formatDate(savings.firstVisitDate) }} zijn geïnstalleerd.
              Voer je jaarlijkse energierekening in bij <button class="link-btn" @click="router.push('/my-energy')">Mijn verbruik</button>
              voor een nauwkeurige berekening.
            </p>
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
  margin-bottom: 1rem;
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

.empty-icon {
  margin-bottom: 1rem;
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

.badge-row {
  margin-bottom: 1.25rem;
}

.badge {
  display: inline-block;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 6px;
  padding: 0.35rem 0.75rem;
}

.badge-estimated {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.badge-measured {
  background: #f0fdf4;
  color: #15803d;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.kpi-card {
  background: white;
  border-radius: 10px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  box-shadow:
    0px 0px 0px 1px rgba(0, 0, 0, 0.06),
    0px 1px 2px -1px rgba(0, 0, 0, 0.06),
    0px 2px 4px 0px rgba(0, 0, 0, 0.04);
}

.kpi-dim {
  opacity: 0.7;
}

.kpi-label {
  font-size: 0.8rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
}

.kpi-value {
  font-size: 2rem;
  font-weight: 800;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.kpi-value small {
  font-size: 1rem;
  font-weight: 500;
  color: #888;
}

.gas { color: #d97706; }
.electra { color: #2563eb; }
.euros { color: #059669; }
.muted { color: #bbb; }

.kpi-annual {
  font-size: 0.85rem;
  color: #888;
  margin-top: 0.5rem;
}

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

.link-btn {
  background: none;
  border: none;
  color: var(--color-primary, #f15a22);
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  font-size: 0.9rem;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.link-btn:hover {
  color: #d04d1a;
}

.text-balance {
  text-wrap: balance;
}

.text-pretty {
  text-wrap: pretty;
}
</style>
