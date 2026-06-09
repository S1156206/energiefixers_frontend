<script setup lang="ts">
import { apiRequest } from '@/services/api'
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
enum Category {
    INSULATION,
    LIGHTING,
    WATER,
    VENTILATION,
    OTHER
}

interface InstalledMaterial {
    materialId: number
    materialName: string
    quantity: number
}

interface Material {
    id: number,
    name: string,
    description: string,
    priceEuros: number,
    estimatedGasSavingM3: number,
    estimatedElectricitySavingKwh: number,
    category: Category
}

interface FixVisitRequest {
    visitDate: string,
    notes: string,
    totalMaterialCost: number
    materials: InstalledMaterial[]
}

const router = useRouter() 
const route = useRoute();

const materials = ref<Material[]>([])
const isLoading = ref(true)
const errorMessage = ref('')

const notes = ref('')
const totalMaterialCost = ref(0)
const visitDate = ref('')
const installedMaterials = ref<InstalledMaterial[]>([])

onMounted(async () => {
    try {
        materials.value = await apiRequest('GET', '/api/materials')
    } catch (err) {
        errorMessage.value = err instanceof Error ? err.message : 'Fout bij ophalen materialen'
    } finally {
        isLoading.value = false
    }
})

function calculateMaterialCosts() {
    let totalCosts = 0 

    for (const installed of installedMaterials.value) {
        const materialDetails = materials.value.find(m => m.id === installed.materialId)
        
        if (materialDetails) {
            totalCosts += materialDetails.priceEuros * installed.quantity
        }
    }
    totalMaterialCost.value = totalCosts
}

async function handleSubmit() {
  errorMessage.value = ''
  isLoading.value = true
  
  calculateMaterialCosts() 

  try {
    const body: FixVisitRequest = {
      visitDate: Date.now().toString(), 
      notes: notes.value,
      totalMaterialCost: totalMaterialCost.value,
      materials: installedMaterials.value 
    }
    await apiRequest('POST', `/api/properties/${route.params.id}/fix-visit`, body)
    router.push(`/properties${route.params.id}`)
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Er is iets misgegaan'
  } finally {
    isLoading.value = false
  }
}

function addInstalledMaterial(material: Material) {
    const existingMaterial = installedMaterials.value.find(m => m.materialId === material.id)

    if (existingMaterial) {
        existingMaterial.quantity += 1
    } else {
        installedMaterials.value.push({
            materialId: material.id,
            materialName: material.name,
            quantity: 1
        })
    }
    calculateMaterialCosts()
}

function addExistingMaterial(material: InstalledMaterial){
    const existingMaterial = installedMaterials.value.find(m => m.materialId === material.materialId)
    if(existingMaterial){
        existingMaterial.quantity += 1
    }
}
</script>