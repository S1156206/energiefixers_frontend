<script setup lang="ts">
import { apiRequest } from '@/services/api'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import UserNavBar from '@/components/nav/UserNavBar.vue'

enum EmailStatus {
    NO_EMAIL, OPT_OUT, DELIVERABLE
}

interface PropertySummary {
  id: number
  street: string
  houseNumber: string
  houseNumberSuffix: string | null
  postcode: string,
  regionId: string,
  tenantEmail: string,
  emailStatus: EmailStatus,
  hasInvitations: boolean,
  hasSubmissionRequests: boolean
}

const properties = ref<PropertySummary[]>([])
const errorMessage = ref('')
const isLoading = ref(true)
const router = useRouter()

onMounted(async () => {
  try {
    properties.value = await apiRequest('GET', '/api/properties')
  } catch (err) {
    errorMessage.value = 'Er is iets misgegaan'
  } finally {
    isLoading.value = false
  }
})

function addProperty() {
  router.push('/properties/new')
}

function emailStatusInfo(status: EmailStatus): { label: string; modifier: string } {
  if (status === EmailStatus.DELIVERABLE) return { label: 'Actief', modifier: 'deliverable' }
  if (status === EmailStatus.OPT_OUT) return { label: 'Afgemeld', modifier: 'opt-out' }
  return { label: 'Geen e-mail', modifier: 'no-email' }
}

function goToPropertyDetail(id: number){
    router.push("/property/" + id)
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

      <div v-if="isLoading" class="state-message">Gegevens laden...</div>

      <div v-else-if="errorMessage" class="error">{{ errorMessage }}</div>

      <div v-else-if="properties.length === 0" class="state-message">
        Geen woningen gevonden.
      </div>

      <div v-else class="property-list">
        <div v-for="property in properties" :key="property.id" class="property-card" @click="goToPropertyDetail(property.id)">
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
            <div class="indicators">
              <span v-if="property.hasInvitations" class="indicator">Uitnodiging</span>
              <span v-if="property.hasSubmissionRequests" class="indicator">Aanmelding</span>
            </div>
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

.indicators {
  display: flex;
  gap: 0.4rem;
  margin-top: 0.3rem;
  justify-content: flex-end;
}

.indicator {
  font-size: 0.7rem;
  color: #3b82f6;
  background: #eff6ff;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
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
</style>
