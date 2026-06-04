<script setup lang="ts">
import { apiRequest } from '@/services/api'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

interface InstalledMaterial {
  materialId: number
  materialName: string
  quantity: number
}

interface FixVisit {
  id: number
  visitDate: string
  notes: string
  totalMaterialCost: number
  installedMaterials: InstalledMaterial[]
}

interface Property {
  id: number
  street: string
  houseNumber: string
  houseNumberSuffix: string | null
  postcode: string
  energyLabelBefore: string
  energyLabelAfter: string | null
  fixVisits: FixVisit[]
}

const properties = ref<Property[]>([])
const errorMessage = ref('')
const isLoading =  ref(true)
const router = useRouter();

onMounted(async () => {
    try{
        properties.value = await apiRequest('GET', '/api/properties')
    }
    catch(err){
        errorMessage.value = 'Er is iets misgegaan'
    }
    finally{
        isLoading.value = false
    }
})

function addProperty(){
    router.push("/property/new")
}

// function propertyDetails(){
//     router.push("/property/details")
// }


</script>

<template></template>

<style></style>