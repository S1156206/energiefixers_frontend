<script setup lang="ts">
import { apiRequest } from '@/services/api';
import { ref, onMounted } from 'vue';

interface EnergyReading {
    id: number,
    propertyId: number,
    periodStart: string,
    periodEnd: string,
    gasUsageM3: number,
    electricityUsageKwh: number,
    totalCostEuros: number,
    sourceType: string,
    submittedAt: string
}

interface EnergyRequest {
    periodStart: string,
    periodEnd: string,
    gasUsageM3: number,
    electricityUsageKwh: number,
    totalCostEuros: number,
}

const isLoading = ref(true)
const energyReadings = ref([])
const errorMessage = ref('')


onMounted(async () => {
    try{
        energyReadings.value = await apiRequest("GET", "api/energy-readings")
    }
    catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Er is iets misgegaan'
  } finally {
    isLoading.value = false
  }
})

</script>

<template>
    <h1></h1>
</template>

<style></style>