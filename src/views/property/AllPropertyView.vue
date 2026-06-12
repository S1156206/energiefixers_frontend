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
  await fixRoundsStore.ensureLoaded()
  selectedRoundId.value = fixRoundsStore.currentRound?.id ?? null
  if (!propertiesStore.isCached(selectedRoundId.value)) {
    await propertiesStore.fetchForRound(selectedRoundId.value)
  }
})

async function selectRound(id: number | null) {
  selectedRoundId.value = id
  if (!propertiesStore.isCached(id)) {
    await propertiesStore.fetchForRound(id)
  }
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
              {{ property.street }} {{ property.houseNumber
              }}{{ property.houseNumberSuffix ?? '' }}, {{ property.postcode }}
            </span>
            <span class="tenant-email">{{ property.tenantEmail }}</span>
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

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-header h1 {
  font-size: 1.25rem;
  color: #1a1a2e;
}

.list-header button {
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.list-header button:hover {
  background: #2563eb;
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
  padding: 0.35rem 0.85rem;
  border: 1px solid #d1d5db;
  border-radius: 9999px;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.round-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.round-btn--active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.round-btn--active:hover {
  background: #2563eb;
  border-color: #2563eb;
  color: white;
}

.round-btn__badge {
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  letter-spacing: 0.02em;
}

.round-btn--active .round-btn__badge {
  background: rgba(255, 255, 255, 0.3);
  color: white;
}

.round-btn:not(.round-btn--active) .round-btn__badge {
  background: #eff6ff;
  color: #3b82f6;
}

.property-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.property-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: box-shadow 0.15s;
}

.property-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.card-main {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.address {
  font-weight: 500;
  color: #1a1a2e;
}

.card-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.tenant-email {
  font-size: 0.8rem;
  color: #6b7280;
}

.status-badge {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  display: inline-block;
}

.status-badge--deliverable {
  background: #f0fdf4;
  color: #16a34a;
}

.status-badge--opt-out {
  background: #fff7ed;
  color: #c2410c;
}

.status-badge--no-email {
  background: #f3f4f6;
  color: #6b7280;
}

.tenant-badge {
  font-size: 0.7rem;
  font-weight: 500;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  margin-top: 0.3rem;
  display: inline-block;
}

.tenant-badge--not-invited   { background: #f3f4f6; color: #6b7280; }
.tenant-badge--invite-expired { background: #fff7ed; color: #c2410c; }
.tenant-badge--invited        { background: #fefce8; color: #a16207; }
.tenant-badge--registered     { background: #eff6ff; color: #1d4ed8; }
.tenant-badge--link-sent      { background: #fefce8; color: #a16207; }
.tenant-badge--data-present   { background: #f0fdf4; color: #16a34a; }

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
</style>
