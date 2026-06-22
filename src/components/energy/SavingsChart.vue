<script setup lang="ts">
import { ref, computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  type TooltipItem,
} from 'chart.js'

import type { EnergyReading } from '@/types'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const props = defineProps<{
  readings: EnergyReading[]
  firstVisitDate: string
}>()

type Metric = 'gas' | 'electricity' | 'cost'
const activeMetric = ref<Metric>('gas')

const metrics: { key: Metric; label: string; unit: string; color: string }[] = [
  { key: 'gas', label: 'Gas', unit: 'm³', color: '#f97316' },
  { key: 'electricity', label: 'Elektriciteit', unit: 'kWh', color: '#22c55e' },
  { key: 'cost', label: 'Kosten', unit: '€', color: '#16a34a' },
]

const visitDate = computed(() => new Date(props.firstVisitDate))

const baselineReading = computed(() =>
  props.readings
    .filter((r) => new Date(r.periodEnd) < visitDate.value)
    .sort((a, b) => new Date(b.periodEnd).getTime() - new Date(a.periodEnd).getTime())[0] ?? null
)

const postVisitReadings = computed(() =>
  props.readings
    .filter((r) => {
      const start = new Date(r.periodStart)
      const end = new Date(r.periodEnd)
      return start >= visitDate.value || end >= visitDate.value
    })
    .sort((a, b) => new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime())
)

const chartData = computed(() => {
  if (!baselineReading.value) return { labels: [], datasets: [] }

  const baseline = baselineReading.value
  const readings = postVisitReadings.value
  const metric = metrics.find((m) => m.key === activeMetric.value)!

  let cumGas = 0
  let cumElec = 0
  let cumCost = 0

  const labels: string[] = []
  const values: number[] = []

  for (const r of readings) {
    const start = new Date(r.periodStart).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
    const end = new Date(r.periodEnd).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: '2-digit' })
    labels.push(`${start} – ${end}`)

    const gasSaved = r.gasUsageM3 !== null && baseline.gasUsageM3 !== null
      ? baseline.gasUsageM3 - r.gasUsageM3 : 0
    const elecSaved = r.electricityUsageKwh !== null && baseline.electricityUsageKwh !== null
      ? baseline.electricityUsageKwh - r.electricityUsageKwh : 0
    const costSaved = r.totalCostEuros !== null && baseline.totalCostEuros !== null
      ? baseline.totalCostEuros - r.totalCostEuros : 0

    cumGas += Math.max(0, gasSaved)
    cumElec += Math.max(0, elecSaved)
    cumCost += Math.max(0, costSaved)

    if (metric.key === 'gas') values.push(cumGas)
    else if (metric.key === 'electricity') values.push(cumElec)
    else values.push(cumCost)
  }

  return {
    labels,
    datasets: [
      {
        label: `Cumulatieve besparing (${metric.unit})`,
        data: values,
        backgroundColor: metric.color,
        borderRadius: 4,
      },
    ],
  }
})

const chartOptions = computed(() => {
  const metric = metrics.find((m) => m.key === activeMetric.value)!
  return {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'bar'>) =>
            ` ${Number(ctx.parsed.y).toLocaleString('nl-NL')} ${metric.unit}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: string | number) =>
            `${Number(value).toLocaleString('nl-NL')} ${metric.unit}`,
        },
      },
    },
  }
})

const hasBaseline = computed(() => !!baselineReading.value)
const hasPostReadings = computed(() => postVisitReadings.value.length > 0)
</script>

<template>
  <div class="chart-card">
    <div class="chart-header">
      <span class="chart-title">Cumulatieve besparing over tijd</span>
      <div class="metric-toggle">
        <button
          v-for="m in metrics"
          :key="m.key"
          :class="['toggle-btn', { active: activeMetric === m.key }]"
          :style="activeMetric === m.key ? { backgroundColor: m.color, borderColor: m.color } : {}"
          @click="activeMetric = m.key"
        >
          {{ m.label }}
        </button>
      </div>
    </div>

    <div v-if="!hasBaseline" class="chart-empty">
      Geen meting vóór het fixbezoek beschikbaar. Voeg een jaarrekening in van vóór {{ new Date(props.firstVisitDate).toLocaleDateString('nl-NL') }} om een baseline te bepalen.
    </div>
    <div v-else-if="!hasPostReadings" class="chart-empty">
      Nog geen metingen na het fixbezoek ingevoerd. De cumulatieve besparing verschijnt zodra je een rekening indient met een startdatum na {{ new Date(props.firstVisitDate).toLocaleDateString('nl-NL') }}.
    </div>
    <Bar v-else :data="chartData" :options="chartOptions" />
  </div>
</template>

<style scoped>
.chart-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.chart-title {
  font-weight: 600;
  color: #1a1a2e;
  font-size: 0.95rem;
}

.metric-toggle {
  display: flex;
  gap: 0.4rem;
}

.toggle-btn {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0.3rem 0.75rem;
  font-size: 0.8rem;
  cursor: pointer;
  background: white;
  color: #374151;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.toggle-btn.active {
  color: white;
}

.toggle-btn:not(.active):hover {
  background: #f3f4f6;
}

.chart-empty {
  color: #6b7280;
  font-size: 0.9rem;
  text-align: center;
  padding: 2rem 1rem;
  line-height: 1.6;
}
</style>
