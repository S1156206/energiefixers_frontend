<script setup lang="ts">
import { apiRequest } from '@/services/api'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'


enum EnergyLabel { A_PLUS_PLUS_PLUS, A_PLUS_PLUS, A_PLUS, A, B, C, D, E, F, G }

enum EmailStatus { NO_EMAIL, OPT_OUT, DELIVERABLE }

enum InvitationType { REGISTRATION, ANNUAL_REMINDER }

enum InvitationStatus { PENDING, ACCEPTED, EXPIRED, REVOKED }

interface InvitationSummary {
    id: number,
    type: InvitationType,
    status: InvitationStatus,
    recipientEmail: string,
    sentAt: string,
    expiresAt: string,
    acceptedAt: string
}

interface SubmissionRequestSummary{
    id: number,
    recipientEmail: string,
    createdAt: string,
    expiresAt: string,
    submittedAt: string
}

interface InstalledMaterial {
    materialId: number,
    materialName: string,
    quantity: number
}

interface FixVisitResponse{
    id: number,
    propertyId: number,
    visitDate: string,
    notes: string,
    totalMaterialCost: number,
    materials: InstalledMaterial[]

}

interface Property {
    id: number,
    street: string,
    houseNumber: string,
    houseNumberSuffix: string,
    postcode: string,
    energyLabelBefore: EnergyLabel,
    energyLabelAfter: EnergyLabel,
    regionId: number,
    tenantEmail: string,
    emailStatus: EmailStatus,
    invitations: InvitationSummary[],
    submissionRequests: SubmissionRequestSummary[],
    fixVisits: FixVisitResponse[]

}

const route = useRoute()

const property = ref<Property>()
const errorMessage = ref('')
const isLoading = ref(true)

onMounted(async () => {
    try{
        property.value = await apiRequest('GET', '/api/properties/${route.params.id}')
    }
    catch(err){
        errorMessage.value = "Er is iets misgegaan."
    }
    finally {
        isLoading.value = false
    }
})

</script>

<template>
    <div>{{ property?.id }}</div>
</template>

<style></style>