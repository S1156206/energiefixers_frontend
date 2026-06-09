<script setup lang="ts">
import { apiRequest } from '@/services/api'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import UserNavBar from '@/components/nav/UserNavBar.vue'

enum EnergyLabel { A_PLUS_PLUS_PLUS, A_PLUS_PLUS, A_PLUS, A, B, C, D, E, F, G }

enum EmailStatus { NO_EMAIL, OPT_OUT, DELIVERABLE }

enum InvitationType { REGISTRATION, ANNUAL_REMINDER }

enum InvitationStatus { PENDING, ACCEPTED, EXPIRED, REVOKED }

interface InvitationSummary {
    id: number
    type: InvitationType
    status: InvitationStatus
    recipientEmail: string
    sentAt: string
    expiresAt: string
    acceptedAt: string
}

interface SubmissionRequestSummary {
    id: number
    recipientEmail: string
    createdAt: string
    expiresAt: string
    submittedAt: string
}

interface InstalledMaterial {
    materialId: number
    materialName: string
    quantity: number
}

interface FixVisitResponse {
    id: number
    propertyId: number
    visitDate: string
    notes: string
    totalMaterialCost: number
    materials: InstalledMaterial[]
}

interface Property {
    id: number
    street: string
    houseNumber: string
    houseNumberSuffix: string
    postcode: string
    energyLabelBefore: EnergyLabel
    energyLabelAfter: EnergyLabel | null
    regionId: number
    tenantEmail: string
    emailStatus: EmailStatus
    invitations: InvitationSummary[]
    submissionRequests: SubmissionRequestSummary[]
    fixVisits: FixVisitResponse[]
}

const route = useRoute()
const router = useRouter()
const property = ref<Property>()
const errorMessage = ref('')
const isLoading = ref(true)

onMounted(async () => {
    try {
        property.value = await apiRequest('GET', `/api/properties/${route.params.id}`)
    } catch (err) {
        errorMessage.value = 'Er is iets misgegaan.'
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

function formatEnergyLabel(label: EnergyLabel | null | undefined): string {
    if (!label) return '—'
    const name = typeof label === 'string' ? label : EnergyLabel[label]
    return name.replace('_PLUS_PLUS_PLUS', '+++').replace('_PLUS_PLUS', '++').replace('_PLUS', '+')
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
</script>

<template>
    <div class="page">
        <UserNavBar />

        <main class="content">
            <div v-if="isLoading" class="state-message">Gegevens laden...</div>

            <div v-else-if="errorMessage" class="error">{{ errorMessage }}</div>

            <template v-else-if="property">
                <div class="card address-card">
                    <h1>
                        {{ property.street }} {{ property.houseNumber }}{{ property.houseNumberSuffix ?? '' }}
                    </h1>
                    <p class="subtext">{{ property.postcode }}</p>

                    <div class="meta-row">
                        <span class="tenant-email">{{ property.tenantEmail }}</span>
                        <span :class="['status-badge', `status-badge--${emailStatusInfo(property.emailStatus).modifier}`]">
                            {{ emailStatusInfo(property.emailStatus).label }}
                        </span>
                    </div>

                    <div class="labels">
                        <div class="label-item">
                            <span class="label-caption">Energielabel voor</span>
                            <span class="energy-label">{{ formatEnergyLabel(property.energyLabelBefore) }}</span>
                        </div>
                        <span class="label-arrow">→</span>
                        <div class="label-item">
                            <span class="label-caption">Energielabel na</span>
                            <span class="energy-label after">{{ formatEnergyLabel(property.energyLabelAfter) }}</span>
                        </div>
                    </div>
                </div>

                <section class="section">
                    <h2>Uitnodigingen</h2>

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
                            <span class="subtext date">Verstuurd: {{ formatDate(inv.sentAt) }}</span>
                        </div>
                    </div>
                </section>

                <section class="section">
                    <h2>Aanmeldingen</h2>

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
                            <span class="subtext date">Verloopt: {{ formatDate(req.expiresAt) }}</span>
                        </div>
                    </div>
                </section>

                <section class="section">
                    <div class="list-header">
                        <h2>Bezoeken</h2>
                        <button @click="addFixVisit">+</button>
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
                            <li v-for="mat in visit.materials" :key="mat.materialId">
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
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    padding: 1.5rem;
}

.address-card h1 {
    font-size: 1.25rem;
    color: #1a1a2e;
    margin-bottom: 0.25rem;
}

.meta-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 0.75rem 0 1.25rem;
}

.tenant-email {
    font-size: 0.875rem;
    color: #6b7280;
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

.section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.section h2 {
    font-size: 1.1rem;
    color: #1a1a2e;
}

.row-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
}

.row-main {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.row-title {
    font-weight: 500;
    color: #1a1a2e;
}

.row-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.25rem;
}

.subtext {
    font-size: 0.8rem;
    color: #6b7280;
}

.subtext.date {
    font-size: 0.75rem;
}

.status-badge {
    font-size: 0.75rem;
    font-weight: 500;
    padding: 0.2rem 0.6rem;
    border-radius: 6px;
    display: inline-block;
}

.status-badge--deliverable,
.status-badge--accepted {
    background: #f0fdf4;
    color: #16a34a;
}

.status-badge--pending {
    background: #eff6ff;
    color: #3b82f6;
}

.status-badge--expired,
.status-badge--revoked,
.status-badge--no-email {
    background: #f3f4f6;
    color: #6b7280;
}

.status-badge--opt-out {
    background: #fff7ed;
    color: #c2410c;
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
    color: #3b82f6;
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
  padding: 0.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
  font-size: 1rem;
}
</style>
