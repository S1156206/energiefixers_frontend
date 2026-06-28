<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiRequest } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import UserNavBar from '@/components/nav/UserNavBar.vue'
import type { MyProperty } from '@/types'

const authStore = useAuthStore()
const property = ref<MyProperty | null>(null)
const isLoading = ref(true)
const errorMessage = ref('')

onMounted(async () => {
  try {
    property.value = await apiRequest('GET', '/api/properties/me')
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Er is iets misgegaan'
  } finally {
    isLoading.value = false
  }
})

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount)
}
</script>

<template>
  <div class="page">
    <UserNavBar />

    <main class="content">
      <div v-if="isLoading" class="state-message">Gegevens laden...</div>

      <div v-else-if="errorMessage" class="error">{{ errorMessage }}</div>

      <template v-else-if="property">
        <div class="card address-card">
          <h1>Mijn woning</h1>
          <p class="address">
            {{ property.street }} {{ property.houseNumber }}{{ property.houseNumberSuffix ?? '' }},
            {{ property.postcode }}, {{ property.city }}
          </p>
        </div>

        <section class="visits-section">
          <h2>Bezoeken</h2>

          <div v-if="property.fixVisits.length === 0" class="state-message">
            Nog geen bezoeken geregistreerd.
          </div>

          <div v-for="visit in property.fixVisits" :key="visit.id" class="card visit-card">
            <div class="visit-header">
              <span class="visit-date">{{ formatDate(visit.visitDate) }}</span>
              <span class="visit-cost">{{ formatCurrency(visit.totalMaterialCost) }}</span>
            </div>
            <p v-if="visit.notes" class="visit-notes">{{ visit.notes }}</p>
            <ul class="materials">
              <li v-for="mat in visit.installedMaterials" :key="mat.materialId">
                <span class="mat-name">{{ mat.materialName }}</span>
                <span class="mat-qty">× {{ mat.quantity }}</span>
              </li>
            </ul>
          </div>
        </section>
      </template>
    </main>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-primary)
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

.card {
  background: var(--color-background);
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 1.5rem;
}

.address-card h1 {
  font-size: 1.25rem;
  color: var(--color-primary);
  margin-bottom: 0.25rem;
}

.address {
  color: #6b7280;
  margin-bottom: 1.25rem;
}

.labels {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.label-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.label-caption {
  font-size: 0.75rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.energy-label {
  font-size: 1.5rem;
  font-weight: 700;
  color: #dc2626;
  background: #fef2f2;
  border-radius: 6px;
  padding: 0.25rem 0.75rem;
  display: inline-block;
}

.energy-label.after {
  color: #16a34a;
  background: #f0fdf4;
}

.label-arrow {
  font-size: 1.25rem;
  color: #9ca3af;
  margin-top: 1rem;
}

.visits-section h2 {
  font-size: 1.1rem;
  color: white;
  margin-bottom: 0.75rem;
}

.visit-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.visit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.visit-date {
  font-weight: 600;
  color: #1a1a2e;
}

.visit-cost {
  font-weight: 600;
  color: var(--color-primary);
}

.visit-notes {
  color: #6b7280;
  font-size: 0.9rem;
}

.materials {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.materials li {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  padding: 0.4rem 0.75rem;
  background: #f9fafb;
  border-radius: 6px;
}

.mat-name {
  color: #374151;
}

.mat-qty {
  color: #6b7280;
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
