<script setup lang="ts">
import { apiRequest, ApiError } from '@/services/api'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import UserNavBar from '@/components/nav/UserNavBar.vue'
import { EmailStatus, InvitationType, InvitationStatus } from '@/types/enums'
import type { Property } from '@/types'

const route = useRoute()
const router = useRouter()
const property = ref<Property>()
const errorMessage = ref('')
const isLoading = ref(true)
const isInviting = ref(false)
const isSubmitting = ref(false)

const cooldownUntil = computed(() => {
    if (!property.value?.invitations.length) return null
    const next = property.value.invitations
        .map(inv => inv.nextMailAvailableAt)
        .filter(Boolean)
        .sort()
        .at(-1)
    return next && new Date(next) > new Date() ? next : null
})

const submissionCooldownUntil = computed(() => {
    if (!property.value?.submissionRequests.length) return null
    const next = property.value.submissionRequests
        .map(req => req.nextMailAvailableAt)
        .filter(Boolean)
        .sort()
        .at(-1)
    return next && new Date(next) > new Date() ? next : null
})

const canInvite = computed(() => {
    if (!property.value) return false

    const hasAccepted = property.value.invitations.some(i => i.status === InvitationStatus.ACCEPTED)

    return !hasAccepted
})

onMounted(async () => {
    try {
        property.value = await apiRequest('GET', `/api/properties/${route.params.id}`)
        console.log(property.value?.emailStatus)
    } catch (err) {
        errorMessage.value = err instanceof Error ? err.message : 'Er is iets misgegaan.'
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


function emailStatusInfo(status: EmailStatus): { label: string; modifier: string } {
    if (status === EmailStatus.DELIVERABLE) return { label: 'Actief', modifier: 'deliverable' }
    if (status === EmailStatus.OPT_OUT) return { label: 'Afgemeld', modifier: 'opt-out' }
    if (status === EmailStatus.NO_EMAIL) return { label: 'Geen email', modifier: 'no-email'}
    return { label: '', modifier: 'email' }
}

function invitationStatusInfo(status: InvitationStatus): { label: string; modifier: string } {
    if (status === InvitationStatus.ACCEPTED) return { label: 'Geaccepteerd', modifier: 'accepted' }
    if (status === InvitationStatus.PENDING) return { label: 'In afwachting', modifier: 'pending' }
    if (status === InvitationStatus.EXPIRED) return { label: 'Verlopen', modifier: 'expired' }
    return { label: 'Ingetrokken', modifier: 'revoked' }
}

function invitationTypeLabel(type: InvitationType): string {
    return type === InvitationType.REGISTRATION ? 'Registratie' : 'Jaarlijkse herinnering'
}

function addFixVisit(){
    router.push(`/property/${route.params.id}/add-visit`)
}

async function sendSubmissionRequest() {
    if (!property.value) {
        errorMessage.value = 'Property unknown'
        return
    }
    if (property.value.submissionRequests.length > 0) {
        const mostRecentCooldown = property.value.submissionRequests
            .map(req => req.nextMailAvailableAt)
            .filter(Boolean)
            .sort()
            .at(-1)
        if (mostRecentCooldown && new Date(mostRecentCooldown) > new Date()) {
            errorMessage.value = `Je moet wachten tot ${formatDate(mostRecentCooldown)} voordat je opnieuw een aanmelding kunt sturen.`
            return
        }
    }
    errorMessage.value = ''
    isSubmitting.value = true
    try {
        await apiRequest('POST', '/api/submission', {
            propertyId: property.value.id,
            email: property.value.tenantEmail,
        })
        property.value = await apiRequest('GET', `/api/properties/${route.params.id}`)
    } catch (err) {
        if (err instanceof ApiError && err.status === 429 && err.retryAfter) {
            errorMessage.value = `Je moet wachten tot ${formatDate(err.retryAfter)} voordat je opnieuw een aanmelding kunt sturen.`
        } else {
            errorMessage.value = err instanceof Error ? err.message : 'Er is iets misgegaan bij het versturen van de aanmelding.'
        }
    } finally {
        isSubmitting.value = false
    }
}

async function inviteUserForAccount() {
    if(property.value === null){
        errorMessage.value = 'Property unknown'
        return
    }
    if(property.value!.invitations.length > 0){
        const mostRecentCooldown = property.value!.invitations
            .map(inv => inv.nextMailAvailableAt)
            .filter(Boolean)
            .sort()
            .at(-1)

        if (mostRecentCooldown && new Date(mostRecentCooldown) > new Date()) {
            errorMessage.value = `Je moet wachten tot ${formatDate(mostRecentCooldown)} voordat je opnieuw een mail kunt sturen.`
            return
        }
    }
    errorMessage.value = ''
    isInviting.value = true
    try {
        await apiRequest('POST', '/api/invitations', {
            propertyId: property.value!.id,
            recipientEmail: property.value!.tenantEmail,
        })
        property.value = await apiRequest('GET', `/api/properties/${route.params.id}`)
    } catch (err) {
        if (err instanceof ApiError && err.status === 429 && err.retryAfter) {
            errorMessage.value = `Je moet wachten tot ${formatDate(err.retryAfter)} voordat je opnieuw een mail kunt sturen.`
        } else {
            errorMessage.value = err instanceof Error ? err.message : 'Er is iets misgegaan bij het versturen van de uitnodiging.'
        }
    } finally {
        isInviting.value = false
    }
}

function editProperty() {
  router.push(`/edit-property/${route.params.id}`)
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
          <div class="address-header">
            <div>
              <h1>
                {{ property.street }} {{ property.houseNumber }}{{ property.houseNumberSuffix ?? '' }}
              </h1>
              <p class="subtext">{{ property.postcode }}</p>
            </div>
            <button @click="editProperty" class="btn-edit">Bewerken</button>
          </div>

          <div class="meta-row">
            <span class="tenant-email">{{ property.tenantEmail }}</span>
            <span :class="['status-badge', `status-badge--${emailStatusInfo(property.emailStatus).modifier}`]">
              {{ emailStatusInfo(property.emailStatus).label }}
            </span>
          </div>
        </div>

        <section class="section">
          <div class="section-header">
            <h2>Uitnodigingen</h2>
            <button
              v-if="property.emailStatus === EmailStatus.DELIVERABLE && canInvite"
              class="btn-add"
              :disabled="isInviting || !!cooldownUntil"
              :title="cooldownUntil ? `Beschikbaar op ${formatDate(cooldownUntil)}` : undefined"
              :class="{ 'btn--cooldown': !!cooldownUntil }"
              @click="inviteUserForAccount"
            >{{ cooldownUntil ? '🕐' : '+' }}</button>
          </div>

          <div v-if="property.invitations.length === 0" class="state-message">
            Geen uitnodigingen gevonden.
          </div>

          <div v-for="inv in property.invitations" :key="inv.id" class="card row-card">
            <div class="row-main">
              <span class="row-title">{{ invitationTypeLabel(inv.type) }}</span>
              <span class="subtext">{{ inv.recipientEmail }}</span>
            </div>
            <div class="row-meta">
              <span :class="['status-badge', `status-badge--${invitationStatusInfo(inv.status).modifier}`]">
                {{ invitationStatusInfo(inv.status).label }}
              </span>
              <span v-if="inv.acceptedAt" class="subtext date">Geaccepteerd: {{ formatDate(inv.acceptedAt) }}</span>
              <span v-else class="subtext date">Verstuurd: {{ formatDate(inv.sentAt) }}</span>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="section-header">
            <h2>Aanmeldingen</h2>
            <button
              v-if="property.emailStatus === EmailStatus.DELIVERABLE && property.submissionRequests.length === 0"
              class="btn-add"
              :disabled="isSubmitting || !!submissionCooldownUntil"
              :title="submissionCooldownUntil ? `Beschikbaar op ${formatDate(submissionCooldownUntil)}` : undefined"
              :class="{ 'btn--cooldown': !!submissionCooldownUntil }"
              @click="sendSubmissionRequest"
            >{{ submissionCooldownUntil ? '🕐' : '+' }}</button>
          </div>

          <div v-if="property.submissionRequests.length === 0" class="state-message">
            Geen aanmeldingen gevonden.
          </div>

          <div v-for="req in property.submissionRequests" :key="req.id" class="card row-card">
            <div class="row-main">
              <span class="row-title">{{ req.recipientEmail }}</span>
              <span class="subtext">Aangemaakt: {{ formatDate(req.createdAt) }}</span>
            </div>
            <div class="row-meta">
              <span v-if="req.submittedAt" class="status-badge status-badge--accepted">Ingediend</span>
              <span v-else class="status-badge status-badge--pending">In afwachting</span>
              <span v-if="req.submittedAt" class="subtext date">Ingediend: {{ formatDate(req.submittedAt) }}</span>
              <span v-else class="subtext date">Verloopt: {{ formatDate(req.expiresAt) }}</span>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="section-header">
            <h2>Bezoeken</h2>
            <button class="btn-add" @click="addFixVisit">+</button>
          </div>

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
  background-color: var(--color-primary, #f15a22);
}

.content {
  max-width: 760px;
  width: 100%;
  margin: 2rem auto;
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
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
  transform: translateY(-1px);
}

.address-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.address-card h1 {
  font-size: 1.5rem;
  color: #1f2937;
  margin-bottom: 0.25rem;
  margin-top: 0;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0.75rem 0 0.5rem;
}

.tenant-email {
  font-size: 0.95rem;
  color: #4b5563;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header h2 {
  font-size: 1.25rem;
  color: white;
  margin: 0;
}

.row-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
}

.row-main {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.row-title {
  font-weight: 600;
  font-size: 1.05rem;
  color: #1f2937;
}

.row-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.35rem;
}

.subtext {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0;
}

.subtext.date {
  font-size: 0.8rem;
}

.status-badge {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.2rem 0.7rem;
  border-radius: 6px;
  display: inline-block;
}

.status-badge--deliverable { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
.status-badge--opt-out { background: #fff7ed; color: #c2410c; border: 1px solid #ffedd5; }
.status-badge--no-email { background: #f3f4f6; color: #6b7280; border: 1px solid #e5e7eb; }

.status-badge--accepted { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
.status-badge--pending { background: #eff6ff; color: #3b82f6; border: 1px solid #bfdbfe; }
.status-badge--expired { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.status-badge--revoked { background: #f3f4f6; color: #6b7280; border: 1px solid #e5e7eb; }

.visit-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.visit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.visit-date {
  font-weight: 600;
  font-size: 1.05rem;
  color: #1f2937;
}

.visit-cost {
  font-weight: 600;
  font-size: 1.05rem;
  color: var(--color-primary, #f15a22);
}

.visit-notes {
  color: #4b5563;
  font-size: 0.95rem;
  margin: 0;
  background: white;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  border: 1px solid #f3f4f6;
}

.materials {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
}

.materials li {
  display: flex;
  justify-content: space-between;
  font-size: 0.95rem;
  padding: 0.6rem 1rem;
  background: white;
  border: 1px solid #f3f4f6;
  border-radius: 6px;
}

.mat-name {
  font-weight: 500;
  color: #374151;
}

.mat-qty {
  font-weight: 600;
  color: #6b7280;
}

.state-message {
  color: white;
  text-align: center;
  padding: 2rem;
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

.btn-add {
  padding: 0.5rem 1.2rem;
  background: var(--color-primary-light, #FDEEE8);
  color: #374151;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s, color 0.15s;
}

.btn-add:hover:not(:disabled) {
  opacity: 0.9;
  color: var(--color-primary, #f15a22);
}

.btn-add:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-add.btn--cooldown {
  background: #e5e7eb;
  color: #9ca3af;
}

.btn-edit {
  padding: 0.5rem 1.2rem;
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-edit:hover {
  background: #f9fafb;
  color: var(--color-primary, #f15a22);
  border-color: var(--color-primary, #f15a22);
}
</style>
