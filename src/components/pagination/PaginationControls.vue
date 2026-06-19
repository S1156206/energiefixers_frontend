<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: number
  totalPages: number
}>()

const emit = defineEmits<{
  'update:modelValue': [page: number]
}>()

const pagesToShow = computed<(number | '...')[]>(() => {
  const total = props.totalPages
  const current = props.modelValue

  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages = new Set<number>([1, total, current])
  if (current > 1) pages.add(current - 1)
  if (current < total) pages.add(current + 1)

  const sorted = [...pages].sort((a, b) => a - b)
  const result: (number | '...')[] = []
  let prev = 0
  for (const page of sorted) {
    if (prev && page - prev > 1) result.push('...')
    result.push(page)
    prev = page
  }
  return result
})

function go(page: number) {
  const clamped = Math.min(Math.max(page, 1), props.totalPages)
  if (clamped !== props.modelValue) emit('update:modelValue', clamped)
}
</script>

<template>
  <nav class="pagination" aria-label="Paginering">
    <button
      type="button"
      class="page-arrow"
      :disabled="modelValue === 1"
      @click="go(modelValue - 1)"
    >
      <i class="pi pi-angle-left"></i>
    </button>

    <template v-for="(page, idx) in pagesToShow" :key="idx">
      <span v-if="page === '...'" class="page-ellipsis">...</span>
      <button
        v-else
        type="button"
        class="page-number"
        :class="{ 'page-number--active': page === modelValue }"
        @click="go(page)"
      >
        {{ page }}
      </button>
    </template>

    <button
      type="button"
      class="page-arrow"
      :disabled="modelValue === totalPages"
      @click="go(modelValue + 1)"
    >
      <i class="pi pi-angle-right"></i>
    </button>
  </nav>
</template>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-button-bg);
  margin: 0 5rem;
  gap: 0.4rem;
  padding: 1rem 0;
  border-radius: 1rem;
}

.page-arrow,
.page-number {
  display: flex;
  color: black;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  height: 2rem;
  padding: 0 0.5rem;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--color-text-muted, #374151);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.page-arrow:hover:not(:disabled),
.page-number:hover:not(.page-number--active) {
  background: rgba(241, 90, 34, 0.1);
}

.page-arrow:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-number--active {
  font-weight: bold;
}

.page-ellipsis {
  color: var(--color-text-muted, #374151);
  padding: 0 0.25rem;
}
</style>
