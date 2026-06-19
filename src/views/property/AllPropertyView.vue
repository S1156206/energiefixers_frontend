<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import UserNavBar from '@/components/nav/UserNavBar.vue'
import PaginationControls from '@/components/pagination/PaginationControls.vue'
import { EmailStatus, TenantStatus } from '@/types/enums'
import { useFixRoundsStore } from '@/stores/fixRounds'
import { usePropertiesStore } from '@/stores/properties'

const router = useRouter()
const fixRoundsStore = useFixRoundsStore()
const propertiesStore = usePropertiesStore()

const selectedRoundId = ref<number | null>(null)

const properties = computed(() => propertiesStore.getForRound(selectedRoundId.value))

const PAGE_SIZE = 7
const currentPage = ref(1)

const totalPages = computed(() =>
  Math.max(1, Math.ceil(properties.value.length / PAGE_SIZE))
)

const paginatedProperties = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return properties.value.slice(start, start + PAGE_SIZE)
})

watch(selectedRoundId, () => {
  currentPage.value = 1
})

onMounted(async () => {
  await Promise.all([
    fixRoundsStore.ensureLoaded(),
    propertiesStore.ensureLoaded(),
  ])
  selectedRoundId.value = fixRoundsStore.currentRound?.id ?? null
})

function selectRound(id: number | null) {
  selectedRoundId.value = id
}

function addProperty() {
  router.push('/properties/new')
}

function goToPropertyDetail(id: number) {
  router.push('/property/' + id)
}

function emailStatusInfo(status: EmailStatus): { label: string; modifier: string } {
  if (status === EmailStatus.DELIVERABLE) return { label: 'Actief', modifier: 'deliverable' }
  if (status === EmailStatus.OPT_OUT) return { label: 'Afgemeld', modifier: 'opt-out' }
  return { label: 'Geen e-mail', modifier: 'no-email' }
}

function tenantStatusInfo(status: TenantStatus): { label: string; modifier: string } {
  switch (status) {
    case TenantStatus.NOT_INVITED:   return { label: 'Geen uitnodiging', modifier: 'not-invited' }
    case TenantStatus.INVITE_EXPIRED: return { label: 'Verlopen',        modifier: 'invite-expired' }
    case TenantStatus.INVITED:        return { label: 'Uitgenodigd',      modifier: 'invited' }
    case TenantStatus.REGISTERED:     return { label: 'Geregistreerd',    modifier: 'registered' }
    case TenantStatus.LINK_SENT:      return { label: 'Link verstuurd',   modifier: 'link-sent' }
    case TenantStatus.DATA_PRESENT:   return { label: 'Data aanwezig',    modifier: 'data-present' }
  }
}
</script>

<template>
  <div class="page">
    <UserNavBar />

    <main class="content">
      <div v-if="fixRoundsStore.error" class="error">{{ fixRoundsStore.error }}</div>
      <div v-if="propertiesStore.error" class="error">{{ propertiesStore.error }}</div>

      <div class="toolbar">
        <div v-if="fixRoundsStore.isLoaded" class="round-selector">
          <button
            :class="['round-btn', selectedRoundId === null ? 'round-btn--active' : '']"
            @click="selectRound(null)"
          >
            Alle woningen
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
        <div v-else class="round-selector">
          Gegevens laden...
        </div>

        <button class="btn-new" @click="addProperty">Nieuwe woning</button>
      </div>

      <div class="card table-card">
        <div v-if="propertiesStore.isLoading" class="state-message-card">Gegevens laden...</div>
        <div v-else-if="properties.length === 0" class="state-message-card">
          Geen woningen gevonden voor deze selectie.
        </div>
        <div v-else class="table-wrapper">
          <table>
            <thead>
            <tr>
              <td class="header-cell">Adres</td>
              <td class="header-cell">Huurder e-mail</td>
              <td class="header-cell">E-mail status</td>
              <td class="header-cell">Uitnodiging status</td>
            </tr>
            </thead>
            <tbody>
            <tr
              v-for="property in paginatedProperties"
              :key="property.id"
              @click="goToPropertyDetail(property.id)"
              class="clickable-row"
            >
              <td class="font-medium">
                {{ property.street }} {{ property.houseNumber }}{{ property.houseNumberSuffix ?? '' }}, {{ property.postcode }}, {{ property.city }}
              </td>
              <td class="subtext">{{ property.tenantEmail || '-' }}</td>
              <td>
                  <span :class="['status-badge', `status-badge--${emailStatusInfo(property.emailStatus).modifier}`]">
                    {{ emailStatusInfo(property.emailStatus).label }}
                  </span>
              </td>
              <td>
                  <span :class="['tenant-badge', `tenant-badge--${tenantStatusInfo(property.tenantStatus).modifier}`]">
                    {{ tenantStatusInfo(property.tenantStatus).label }}
                  </span>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="pagination-wrapper">
        <PaginationControls v-if="properties.length > 0" v-model="currentPage" :total-pages="totalPages" />
      </div>
    </main>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-primary, #f15a22);
  position: relative;
}

.content {
  max-width: 960px;
  width: 100%;
  margin: 2rem auto;
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  flex: 1;
}

.toolbar {
  display: flex;
  gap: 1rem;
  align-items: center;
  color: white;
}

.round-selector {
  flex: 1;
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

.round-btn--active:hover {
  background: var(--color-primary-light, #FDEEE8);
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

.btn-new {
  padding: 1rem 2rem;
  background: var(--color-button-bg, #FDEEE8);
  color: var(--color-primary, #f15a22);
  border: none;
  border-radius: 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-new:hover {
  background: var(--color-button-hover, #d1d5db);
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

.table-card {
  padding: 0;
  overflow: hidden;
  flex: 1;
}

.table-wrapper {
  overflow-x: auto;
  height: 100%;
}

table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.header-cell {
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

tr:nth-child(even) td {
  background-color: rgba(0, 0, 0, 0.02);
}

.clickable-row:hover td {
  background-color: rgba(255, 255, 255, 0.3);
  cursor: pointer;
}

.font-medium {
  font-weight: 500;
}

.subtext {
  color: #4b5563;
  font-size: 0.9rem;
}

.status-badge, .tenant-badge {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.2rem 0.7rem;
  border-radius: 9999px;
  display: inline-block;
  white-space: nowrap;
}

.status-badge--deliverable { background: #f0fdf4; color: #16a34a; }
.status-badge--opt-out { background: #fff7ed; color: #c2410c; }
.status-badge--no-email { background: #f3f4f6; color: #6b7280; }

.tenant-badge--not-invited   { background: #f3f4f6; color: #6b7280; }
.tenant-badge--invite-expired { background: #fee2e2; color: #dc2626; }
.tenant-badge--invited        { background: #fffbeb; color: #b45309; }
.tenant-badge--registered     { background: #eff6ff; color: #2563eb; }
.tenant-badge--link-sent      { background: #fffbeb; color: #d97706; }
.tenant-badge--data-present   { background: #f0fdf4; color: #16a34a; }

.pagination-wrapper {
  margin-top: auto;
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