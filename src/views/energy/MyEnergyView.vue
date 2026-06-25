<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { apiRequest, ApiError } from '@/services/api'
import UserNavBar from '@/components/nav/UserNavBar.vue'
import EnergyChart from '@/components/energy/EnergyChart.vue'
import SavingsChart from '@/components/energy/SavingsChart.vue'
import type { EnergyReading, EnergyReadingForm, TenantSavingsResponse } from '@/types'

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

const serverSavings = ref<TenantSavingsResponse | null>(null)
const savingsError = ref<'no-visit' | 'other' | null>(null)

// Derived display values — switch between measured and estimated tracks
const displayJaarGas = computed(() =>
    serverSavings.value?.hasMeasuredData
        ? (serverSavings.value.annualGasSavingsM3 ?? 0)
        : (serverSavings.value?.estimatedAnnualGasSavingsM3 ?? 0)
)
const displayJaarElec = computed(() =>
    serverSavings.value?.hasMeasuredData
        ? (serverSavings.value.annualElectricitySavingsKwh ?? 0)
        : (serverSavings.value?.estimatedAnnualElectricitySavingsKwh ?? 0)
)
const displayTotaalGas = computed(() =>
    serverSavings.value?.hasMeasuredData
        ? (serverSavings.value.totalGasSavedToDateM3 ?? 0)
        : (serverSavings.value?.estimatedTotalGasSavedToDateM3 ?? 0)
)
const displayTotaalElec = computed(() =>
    serverSavings.value?.hasMeasuredData
        ? (serverSavings.value.totalElectricitySavedToDateKwh ?? 0)
        : (serverSavings.value?.estimatedTotalElectricitySavedToDateKwh ?? 0)
)

// Warn when form start date falls before the fix visit
const periodStartBeforeVisit = computed(() =>
    !!(visitDate.value && form.periodStart && form.periodStart < visitDate.value)
)

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

    try {
        serverSavings.value = await apiRequest<TenantSavingsResponse>('GET', '/api/energy-readings/savings')
    } catch (err) {
        savingsError.value = err instanceof ApiError && err.status === 404 ? 'no-visit' : 'other'
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
        try {
        serverSavings.value = await apiRequest<TenantSavingsResponse>('GET', '/api/energy-readings/savings')
    } catch (err) {
        savingsError.value = err instanceof ApiError && err.status === 404 ? 'no-visit' : 'other'
    }
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
    try {
        serverSavings.value = await apiRequest<TenantSavingsResponse>('GET', '/api/energy-readings/savings')
    } catch (err) {
        savingsError.value = err instanceof ApiError && err.status === 404 ? 'no-visit' : 'other'
    }
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })
}

function formatCurrency(amount: number | null) {
    if (amount === null) return '—'
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount)
}

function sourceLabel(sourceType: string) {
    return sourceType === 'ANNUAL_BILL_MANUAL' ? 'Zelf ingevoerd' : 'Ingevoerd door medewerker'
}

function formatSavingsCurrency(amount: number) {
    const prefix = amount > 0 ? '+' : ''
    return prefix + new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount)
}

function formatSavingsNumber(amount: number) {
    return new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 0 }).format(amount)
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

                <!-- Savings: no fix visit registered -->
                <div v-if="savingsError === 'no-visit'" class="visit-info">
                    Nog geen fixbezoek geregistreerd. Besparingen zijn beschikbaar na het eerste bezoek.
                </div>

                <!-- Savings: two-track card -->
                <div v-else-if="serverSavings" class="card savings-card">
                    <div class="savings-header">
                        <h3 class="savings-title">Jouw besparing</h3>
                        <span :class="['savings-badge', serverSavings.hasMeasuredData ? 'badge-measured' : 'badge-estimated']">
                            {{ serverSavings.hasMeasuredData
                                ? 'Berekend op basis van jouw rekeningen'
                                : 'Schatting op basis van geïnstalleerde materialen' }}
                        </span>
                    </div>

                    <!-- Primary KPIs: always shown -->
                    <div class="savings-kpis">
                        <div class="kpi">
                            <span class="kpi-label">Al bespaard (gas)</span>
                            <span class="kpi-value">{{ formatSavingsNumber(displayTotaalGas) }} <small>m³</small></span>
                        </div>
                        <div class="kpi">
                            <span class="kpi-label">Al bespaard (elektriciteit)</span>
                            <span class="kpi-value">{{ formatSavingsNumber(displayTotaalElec) }} <small>kWh</small></span>
                        </div>
                        <div class="kpi kpi-annual">
                            <span class="kpi-label">Verwachte jaarlijkse besparing</span>
                            <span class="kpi-value kpi-annual-value">
                                {{ formatSavingsNumber(displayJaarGas) }} m³
                                &nbsp;·&nbsp;
                                {{ formatSavingsNumber(displayJaarElec) }} kWh
                            </span>
                        </div>
                    </div>

                    <!-- Cost block: only when measured data is available -->
                    <div v-if="serverSavings.hasMeasuredData" class="savings-cost">
                        <div class="kpi">
                            <span class="kpi-label">Al bespaard (kosten)</span>
                            <span class="kpi-value text-green">{{ formatSavingsCurrency(serverSavings.totalCostSavedToDateEuros!) }}</span>
                        </div>
                        <div class="kpi">
                            <span class="kpi-label">Jaarlijkse kostenbesparing</span>
                            <span class="kpi-value text-green">{{ formatSavingsCurrency(serverSavings.annualCostSavingsEuros!) }}</span>
                        </div>
                    </div>

                    <!-- Motivation: nudge tenant to add readings -->
                    <p v-if="!serverSavings.hasMeasuredData" class="savings-motivation">
                        Jouw gemeten besparing wordt zichtbaar zodra je een rekening indient met een startdatum
                        na {{ formatDate(serverSavings.firstVisitDate) }}. Hoe meer rekeningen je invoert,
                        hoe nauwkeuriger de berekening.
                    </p>

                    <SavingsChart
                        v-if="energyReadings.length > 0"
                        class="savings-chart"
                        :readings="energyReadings"
                        :first-visit-date="serverSavings.firstVisitDate"
                    />
                </div>

                <div v-if="energyReadings.length === 0" class="state-message">
                    Nog geen energiemetingen ingevoerd.
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
                            <span class="stat-value">{{ reading.gasUsageM3 ?? '—' }} m³</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Elektriciteit</span>
                            <span class="stat-value">{{ reading.electricityUsageKwh ?? '—' }} kWh</span>
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
                            <p v-if="periodStartBeforeVisit" class="form-warning">
                                Deze startdatum ligt vóór het fixbezoek ({{ formatDate(visitDate!) }}).
                                Een aflezing die vóór het bezoek begint, telt niet als na-meting en wordt
                                niet gebruikt voor de besparingsberekening.
                            </p>
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

.form-warning {
    font-size: 0.8rem;
    color: #92400e;
    background: #fffbeb;
    border: 1px solid #fcd34d;
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    margin-top: 0.25rem;
    line-height: 1.4;
}

/* Savings card */
.savings-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    box-shadow: none;
}

.savings-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.25rem;
    flex-wrap: wrap;
}

.savings-title {
    font-size: 1rem;
    color: #1a1a2e;
    margin: 0;
}

.savings-badge {
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: 4px;
    padding: 0.25rem 0.6rem;
    white-space: nowrap;
}

.badge-estimated {
    background: #eff6ff;
    color: #1d4ed8;
}

.badge-measured {
    background: #f0fdf4;
    color: #15803d;
}

.savings-kpis {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
}

.kpi-annual {
    grid-column: 1 / -1;
    background: white;
    border-radius: 6px;
    padding: 0.75rem 1rem;
    border: 1px solid #e2e8f0;
}

.kpi {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.kpi-label {
    font-size: 0.75rem;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.kpi-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1a1a2e;
}

.kpi-annual-value {
    font-size: 1rem;
    color: #374151;
}

.kpi-value small {
    font-size: 0.8rem;
    font-weight: 400;
    color: #6b7280;
}

.savings-cost {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e2e8f0;
    margin-top: 0.5rem;
}

.savings-motivation {
    font-size: 0.85rem;
    color: #6b7280;
    margin: 0.75rem 0 0;
    line-height: 1.5;
    border-top: 1px solid #e2e8f0;
    padding-top: 0.75rem;
}

.savings-chart {
    margin-top: 1.25rem;
    padding-top: 1.25rem;
    border-top: 1px solid #e2e8f0;
}

.text-green {
    color: #16a34a !important;
}
</style>
