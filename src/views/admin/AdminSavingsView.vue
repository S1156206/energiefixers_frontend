<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import UserNavBar from '@/components/nav/UserNavBar.vue'
import { apiRequest } from '@/services/api'

interface RegionSavings {
  regionId: number
  regionName: string
  propertiesCount: number
  visitsCount: number
  propertiesWithActualData: number
  actualCostSavingsEuros: number
  actualElectricitySavingsKwh: number
  actualGasSavingsM3: number
  totalElectricitySavingsKwh: number
  totalGasSavingsM3: number
  totalMaterialCost: number
}

interface PropertySavings {
  propertyId: number
  street: string
  houseNumber: string
  postcode: string
  regionId: number
  regionName: string
  tenantName: string
  tenantEmail: string
  visitsCount: number
  totalMaterialCostEuros: number
  estimatedGasSavingsM3: number
  estimatedElectricitySavingsKwh: number
  actualGasSavingsM3: number
  actualElectricitySavingsKwh: number
  actualCostSavingsEuros: number
}

const loading = ref(true)
const error = ref<string | null>(null)
const regions = ref<RegionSavings[]>([])
const allProperties = ref<PropertySavings[]>([])
const selectedRegionId = ref<number | null>(null)

const filteredProperties = computed(() => {
  if (selectedRegionId.value === null) return []
  return allProperties.value.filter(p => p.regionId === selectedRegionId.value)
})

const selectedRegion = computed(() => {
  if (selectedRegionId.value === null) return null
  return regions.value.find(r => r.regionId === selectedRegionId.value) ?? null
})

function selectRegion(regionId: number) {
  selectedRegionId.value = regionId
}

function goBack() {
  selectedRegionId.value = null
}

function formatEuro(amount: number): string {
  return '€ ' + amount.toFixed(2)
}

function formatKwh(amount: number): string {
  return amount.toFixed(0) + ' kWh'
}

function formatM3(amount: number): string {
  return amount.toFixed(0) + ' m\u00B3'
}

onMounted(async () => {
  try {
    regions.value = await apiRequest<RegionSavings[]>('GET', '/api/admin/savings/by-region')
    allProperties.value = await apiRequest<PropertySavings[]>('GET', '/api/admin/savings/by-property')
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Er is een fout opgetreden bij het laden van de besparingen'
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
        <h1 class="text-balance">Besparingsoverzicht</h1>
        <p class="subtitle text-pretty">Inzicht in besparingen per regio en woning</p>
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

      <template v-else-if="selectedRegion === null">
        <transition-group name="card-stagger" tag="div" class="region-grid">
          <div
            v-for="region in regions"
            :key="region.regionId"
            class="region-card"
            @click="selectRegion(region.regionId)"
          >
            <h2 class="region-name text-balance">{{ region.regionName }}</h2>
            <div class="region-stats">
              <div class="stat">
                <span class="stat-label">Woningen</span>
                <span class="stat-value tabular-nums">{{ region.propertiesCount }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Kostenbesparing</span>
                <span class="stat-value tabular-nums euros">{{ formatEuro(region.actualCostSavingsEuros) }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Gasbesparing</span>
                <span class="stat-value tabular-nums gas">{{ formatM3(region.actualGasSavingsM3) }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Elektriciteitsbesparing</span>
                <span class="stat-value tabular-nums electra">{{ formatKwh(region.actualElectricitySavingsKwh) }}</span>
              </div>
            </div>
            <div class="card-footer">
              <span class="footer-link">Bekijk woningen &rarr;</span>
            </div>
          </div>
        </transition-group>
      </template>

      <template v-else>
        <button class="back-btn" @click="goBack">
          <span class="back-arrow">&larr;</span>
          Terug naar regio's
        </button>

        <div class="region-detail-header">
          <h2 class="text-balance">{{ selectedRegion.regionName }}</h2>
          <p class="subtitle text-pretty">{{ selectedRegion.propertiesCount }} woning(en), {{ selectedRegion.visitsCount }} fixbezoek(en)</p>
        </div>

        <div class="summary-row">
          <div class="summary-item">
            <span class="summary-label">Totale kostenbesparing</span>
            <span class="summary-value tabular-nums euros">{{ formatEuro(selectedRegion.actualCostSavingsEuros) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Gasbesparing</span>
            <span class="summary-value tabular-nums gas">{{ formatM3(selectedRegion.actualGasSavingsM3) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Elektriciteitsbesparing</span>
            <span class="summary-value tabular-nums electra">{{ formatKwh(selectedRegion.actualElectricitySavingsKwh) }}</span>
          </div>
        </div>

        <div class="properties-table-wrapper">
          <table class="properties-table">
            <thead>
              <tr>
                <th>Adres</th>
                <th>Huurder</th>
                <th class="num-col">Kostenbesparing</th>
                <th class="num-col">Gas (m&sup3;)</th>
                <th class="num-col">Elektriciteit (kWh)</th>
                <th class="num-col">Materialen</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in filteredProperties" :key="p.propertyId" class="table-row">
                <td class="address-cell">{{ p.street }} {{ p.houseNumber }}, {{ p.postcode }}</td>
                <td>{{ p.tenantName }}</td>
                <td class="tabular-nums euros">{{ formatEuro(p.actualCostSavingsEuros) }}</td>
                <td class="tabular-nums gas">{{ formatM3(p.actualGasSavingsM3) }} / {{ formatM3(p.estimatedGasSavingsM3) }}</td>
                <td class="tabular-nums electra">{{ formatKwh(p.actualElectricitySavingsKwh) }} / {{ formatKwh(p.estimatedElectricitySavingsKwh) }}</td>
                <td class="tabular-nums">{{ formatEuro(p.totalMaterialCostEuros) }}</td>
              </tr>
            </tbody>
          </table>
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
  margin-bottom: 0.25rem;
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

.pulse-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.pulse-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes pulse {
  0%, 80%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  40% {
    opacity: 1;
    transform: scale(1);
  }
}

.error-state {
  color: white;
  text-align: center;
  padding: 2rem;
  font-size: 1.1rem;
}

.region-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.region-card {
  background: white;
  border-radius: 10px;
  padding: 1.5rem;
  cursor: pointer;
  box-shadow:
    0px 0px 0px 1px rgba(0, 0, 0, 0.06),
    0px 1px 2px -1px rgba(0, 0, 0, 0.06),
    0px 2px 4px 0px rgba(0, 0, 0, 0.04);
  transition-property: box-shadow, transform;
  transition-duration: 150ms;
  transition-timing-function: ease-out;
}

.region-card:hover {
  box-shadow:
    0px 0px 0px 1px rgba(0, 0, 0, 0.08),
    0px 1px 2px -1px rgba(0, 0, 0, 0.08),
    0px 4px 8px 0px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.region-card:active {
  transform: scale(0.98);
}

.region-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--color-primary, #f15a22);
  margin: 0 0 1rem;
}

.region-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.8rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #333;
}

.euros { color: #059669; }
.gas { color: #d97706; }
.electra { color: #2563eb; }

.card-footer {
  border-top: 1px solid #e5e7eb;
  padding-top: 0.75rem;
}

.footer-link {
  font-size: 0.9rem;
  color: var(--color-primary, #f15a22);
  font-weight: 600;
}

.back-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: white;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  margin-top: 1rem;
  margin-bottom: 1rem;
  transition-property: background, transform;
  transition-duration: 150ms;
  transition-timing-function: ease-out;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.back-btn:active {
  transform: scale(0.96);
}

.back-arrow {
  display: inline-block;
}

.region-detail-header {
  margin-bottom: 1rem;
}

.region-detail-header h2 {
  font-size: 1.3rem;
  color: white;
  margin: 0;
}

.summary-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.summary-item {
  background: white;
  border-radius: 10px;
  padding: 1rem 1.25rem;
  flex: 1;
  min-width: 180px;
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
}

.properties-table-wrapper {
  overflow-x: auto;
  margin-bottom: 2rem;
  border-radius: 10px;
  box-shadow:
    0px 0px 0px 1px rgba(0, 0, 0, 0.06),
    0px 1px 2px -1px rgba(0, 0, 0, 0.06),
    0px 2px 4px 0px rgba(0, 0, 0, 0.04);
}

.properties-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.properties-table th {
  background: var(--color-primary, #f15a22);
  color: white;
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.properties-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.9rem;
  color: #333;
  transition: background 120ms ease-out;
}

.table-row:last-child td {
  border-bottom: none;
}

.table-row:hover td {
  background: #fef3ed;
}

.table-row:active td {
  background: #fde2d4;
}

.address-cell {
  font-weight: 600;
}

.num-col {
  white-space: nowrap;
}

.tabular-nums {
  font-variant-numeric: tabular-nums;
}

.text-balance {
  text-wrap: balance;
}

.text-pretty {
  text-wrap: pretty;
}

.card-stagger-enter-active {
  transition: all 350ms ease-out;
}

.card-stagger-enter-active:nth-child(1) { transition-delay: 0ms; }
.card-stagger-enter-active:nth-child(2) { transition-delay: 60ms; }
.card-stagger-enter-active:nth-child(3) { transition-delay: 120ms; }
.card-stagger-enter-active:nth-child(4) { transition-delay: 180ms; }
.card-stagger-enter-active:nth-child(5) { transition-delay: 240ms; }

.card-stagger-enter-from {
  opacity: 0;
  transform: translateY(12px);
  filter: blur(4px);
}

.card-stagger-leave-active {
  transition: all 150ms ease-in;
}

.card-stagger-leave-to {
  opacity: 0;
  transform: translateY(-12px);
  filter: blur(4px);
}
</style>
