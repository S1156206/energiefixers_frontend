<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import UserNavBar from '@/components/nav/UserNavBar.vue'
import SavingsChart from '@/components/energy/SavingsChart.vue'
import { apiRequest, ApiError } from '@/services/api'
import type { TenantSavingsResponse, EnergyReading } from '@/types'

const router = useRouter()
const loading = ref(true)
const error = ref<string | null>(null)
const savings = ref<TenantSavingsResponse | null>(null)
const readings = ref<EnergyReading[]>([])
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
    const [savingsData, readingsData] = await Promise.all([
      apiRequest<TenantSavingsResponse>('GET', '/api/energy-readings/savings'),
      apiRequest<EnergyReading[]>('GET', '/api/energy-readings').catch(() => []),
    ])
    savings.value = savingsData
    readings.value = readingsData
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

    <main class="content">
      <div v-if="loading" class="state-message">Gegevens laden...</div>

      <div v-else-if="error" class="error">{{ error }}</div>

      <div v-else-if="noVisit" class="empty-card">
        <h2>Nog geen fixbezoek</h2>
        <p>Je besparing wordt berekend na het eerste fixbezoek aan jouw woning. Zodra de materialen zijn geïnstalleerd, zie je hier je resultaten.</p>
      </div>

      <template v-else-if="savings">
        <div class="section-header">
          <h1>Mijn besparing</h1>
        </div>

        <div class="card">
          <div class="badge-row">
            <span :class="['badge', savings.hasMeasuredData ? 'badge-measured' : 'badge-estimated']">
              {{ savings.hasMeasuredData
                ? 'Berekend op basis van jouw rekeningen'
                : 'Schatting op basis van geïnstalleerde materialen' }}
            </span>
          </div>

          <div class="savings-grid">
            <div class="savings-item">
              <span class="savings-label">Bespaard gas</span>
              <span class="savings-value gas">{{ formatNumber(displayTotaalGas) }} <small>m³</small></span>
              <span class="savings-sub">~{{ formatNumber(displayJaarGas) }} m³ / jaar</span>
            </div>
            <div class="savings-item">
              <span class="savings-label">Bespaarde elektriciteit</span>
              <span class="savings-value electra">{{ formatNumber(displayTotaalElec) }} <small>kWh</small></span>
              <span class="savings-sub">~{{ formatNumber(displayJaarElec) }} kWh / jaar</span>
            </div>
            <div v-if="savings.hasMeasuredData" class="savings-item">
              <span class="savings-label">Bespaarde kosten</span>
              <span class="savings-value euros">{{ formatCurrency(savings.totalCostSavedToDateEuros!) }}</span>
              <span class="savings-sub">~{{ formatCurrency(savings.annualCostSavingsEuros!) }} / jaar</span>
            </div>
            <div v-else class="savings-item dim">
              <span class="savings-label">Bespaarde kosten</span>
              <span class="savings-value muted">—</span>
              <span class="savings-sub">Voer een rekening in om kosten te zien</span>
            </div>
          </div>

          <p v-if="!savings.hasMeasuredData" class="motivation-text">
            Jouw gemeten besparing wordt zichtbaar zodra je een rekening indient met een startdatum
            na {{ formatDate(savings.firstVisitDate) }}. Hoe meer rekeningen je invoert,
            hoe nauwkeuriger de berekening.
          </p>
        </div>

        <div v-if="savings.hasMeasuredData" class="card info-card">
          <p>Jouw besparing is berekend door je energieverbruik vóór en na het fixbezoek
            ({{ formatDate(savings.firstVisitDate) }}) te vergelijken.
          </p>
        </div>

        <p v-else class="info-text">
          De schatting is gebaseerd op de materialen die tijdens het fixbezoek van
          {{ formatDate(savings.firstVisitDate) }} zijn geïnstalleerd.
          Voer je jaarlijkse energierekening in bij <button class="link-btn" @click="router.push('/my-energy')">Mijn verbruik</button>
          voor een nauwkeurige berekening.
        </p>

        <SavingsChart
          v-if="readings.length > 1"
          :readings="readings"
          :first-visit-date="savings.firstVisitDate"
        />
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
  margin: 0;
}

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 1.5rem;
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

.empty-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 3rem 2rem;
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

.badge-row {
  margin-bottom: 1.25rem;
}

.badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 6px;
  padding: 0.3rem 0.6rem;
}

.badge-estimated {
  background: #eff6ff;
  color: #1d4ed8;
}

.badge-measured {
  background: #f0fdf4;
  color: #15803d;
}

.savings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.25rem;
  margin-bottom: 0.5rem;
}

.savings-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.savings-item.dim {
  opacity: 0.7;
}

.savings-label {
  font-size: 0.75rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.savings-value {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.savings-value small {
  font-size: 0.85rem;
  font-weight: 500;
  color: #6b7280;
}

.gas { color: #d97706; }
.electra { color: #2563eb; }
.euros { color: #059669; }
.muted { color: #bbb; }

.savings-sub {
  font-size: 0.85rem;
  color: #6b7280;
}

.motivation-text {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 0.75rem 0 0;
  line-height: 1.5;
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
}

.info-card p {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
}

.info-text {
  font-size: 0.9rem;
  color: #6b7280;
  line-height: 1.6;
  margin: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 1rem 1.5rem;
}

.link-btn {
  background: none;
  border: none;
  color: #3b82f6;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  font-size: 0.9rem;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.link-btn:hover {
  color: #2563eb;
}
</style>
