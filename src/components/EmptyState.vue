<script setup lang="ts">
import { useTaskStore } from '@/stores/taskStore'

const taskStore = useTaskStore()

const hasFilters = () => {
  return taskStore.filter.category !== undefined || taskStore.filter.status !== 'all'
}
</script>

<template>
  <div class="card p-12 text-center">
    <svg
      class="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      />
    </svg>

    <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
      {{ hasFilters() ? '没有匹配的任务' : '还没有任务' }}
    </h3>

    <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
      {{ hasFilters() ? '尝试调整筛选条件' : '点击右上角"添加任务"按钮创建第一个任务' }}
    </p>
  </div>
</template>
