<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import UserNavBar from '@/components/nav/UserNavBar.vue'
import { EmailStatus, TenantStatus } from '@/types/enums'
import { useFixRoundsStore } from '@/stores/fixRounds'
import { usePropertiesStore } from '@/stores/properties'

const router = useRouter()
const fixRoundsStore = useFixRoundsStore()
const propertiesStore = usePropertiesStore()

const selectedRoundId = ref<number | null>(null)

const properties = computed(() => propertiesStore.getForRound(selectedRoundId.value))

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

function emailStatusInfo(status: EmailStatus): { label: string; modifier: string } {
  if (status === EmailStatus.DELIVERABLE) return { label: 'Actief', modifier: 'deliverable' }
  if (status === EmailStatus.OPT_OUT) return { label: 'Afgemeld', modifier: 'opt-out' }
  return { label: 'Geen e-mail', modifier: 'no-email' }
}

function goToPropertyDetail(id: number) {
  router.push('/property/' + id)
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
      <div class="list-header">
        <h1>Woningen</h1>
        <button @click="addProperty">Nieuwe woning toevoegen</button>
      </div>

      <div v-if="fixRoundsStore.error" class="error">{{ fixRoundsStore.error }}</div>

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

      <div v-if="propertiesStore.isLoading" class="state-message">Gegevens laden...</div>

      <div v-else-if="propertiesStore.error" class="error">{{ propertiesStore.error }}</div>

      <div v-else-if="properties.length === 0" class="state-message">
        Geen woningen gevonden.
      </div>

      <div v-else class="property-list">
        <div
          v-for="property in properties"
          :key="property.id"
          class="property-card"
          @click="goToPropertyDetail(property.id)"
        >
          <div class="card-main">
            <span class="address">
              {{ property.street }} {{ property.houseNumber }}{{ property.houseNumberSuffix ?? '' }}, {{ property.postcode }}
            </span>
            <span v-if="property.tenantEmail" class="tenant-email">{{ property.tenantEmail }}</span>
          </div>
          <div class="card-meta">
            <span
              :class="['status-badge', `status-badge--${emailStatusInfo(property.emailStatus).modifier}`]"
            >
              {{ emailStatusInfo(property.emailStatus).label }}
            </span>
            <span
              :class="['tenant-badge', `tenant-badge--${tenantStatusInfo(property.tenantStatus).modifier}`]"
            >
              {{ tenantStatusInfo(property.tenantStatus).label }}
            </span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f15a22;
}

.content {
  max-width: 760px;
  width: 100%;
  margin: 2rem auto;
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-header h1 {
  font-size: 1.5rem;
  color: white;
  margin: 0;
}

.list-header button {
  padding: 0.6rem 1.2rem;
  background: var(--color-primary-light, #FDEEE8);
  color: #374151;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}

.list-header button:hover {
  opacity: 0.9;
  color: #f15a22;
}

.round-selector {
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

.property-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.property-card {
  background: var(--color-primary-light, #FDEEE8);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
  border: 1px solid #f3f4f6;
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: box-shadow 0.15s, transform 0.15s;
}

.property-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.card-main {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.address {
  font-weight: 400;
  font-size: 1.05rem;
  color: #1f2937;
}

.tenant-email {
  font-size: 0.85rem;
  color: #6b7280;
}

.card-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.4rem;
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

.state-message {
  color: white;
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
</style>