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

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

interface EnergyReading {
  periodStart: string
  periodEnd: string
  totalCostEuros: number
  gasUsageM3: number
  electricityUsageKwh: number
}

const props = defineProps<{ readings: EnergyReading[] }>()

type Metric = 'kosten' | 'gas' | 'elektriciteit'
const activeMetric = ref<Metric>('kosten')

const metrics: { key: Metric; label: string; unit: string; color: string }[] = [
  { key: 'kosten', label: 'Kosten', unit: '€', color: '#3b82f6' },
  { key: 'gas', label: 'Gas', unit: 'm³', color: '#f97316' },
  { key: 'elektriciteit', label: 'Elektriciteit', unit: 'kWh', color: '#22c55e' },
]

const sortedReadings = computed(() => props.readings.toReversed())

const labels = computed(() =>
  sortedReadings.value.map((r) => {
    const start = new Date(r.periodStart).toLocaleDateString('nl-NL', { month: 'short', year: '2-digit' })
    const end = new Date(r.periodEnd).toLocaleDateString('nl-NL', { month: 'short', year: '2-digit' })
    return `${start} – ${end}`
  })
)

const chartData = computed(() => {
  const metric = metrics.find((m) => m.key === activeMetric.value)!
  const values = sortedReadings.value.map((r) => {
    if (activeMetric.value === 'kosten') return r.totalCostEuros
    if (activeMetric.value === 'gas') return r.gasUsageM3
    return r.electricityUsageKwh
  })
  return {
    labels: labels.value,
    datasets: [
      {
        label: `${metric.label} (${metric.unit})`,
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
            ` ${(ctx.parsed.y ?? 0).toLocaleString('nl-NL')} ${metric.unit}`,
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
</script>

<template>
  <div class="chart-card">
    <div class="chart-header">
      <span class="chart-title">Verbruik per periode</span>
      <div class="metric-toggle">
        <button
          v-for="m in metrics"
          :key="m.key"
          :class="['toggle-btn', { active: activeMetric === m.key }]"
          :style="activeMetric === m.key ? { backgroundColor: m.color } : {}"
          @click="activeMetric = m.key"
        >
          {{ m.label }}
        </button>
      </div>
    </div>
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>

<style scoped>
.chart-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 1.25rem 1.5rem;
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
  border-color: transparent;
}

.toggle-btn:not(.active):hover {
  background: #f3f4f6;
}
</style>
