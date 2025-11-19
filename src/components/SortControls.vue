<script setup lang="ts">
import { useTaskStore } from '@/stores/taskStore'
import type { SortMode } from '@/types/task'

const taskStore = useTaskStore()

const sortModes: { value: SortMode; label: string; icon: string }[] = [
  { value: 'manual', label: '手动排序', icon: 'M4 6h16M4 12h16M4 18h16' },
  { value: 'priority', label: '优先级', icon: 'M5 3l3.057-3L11 3l3-3 3 3-3 3-3-3-2.943 3L5 3z' },
  { value: 'dueDate', label: '截止日期', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { value: 'createdAt', label: '创建时间', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
]

const handleSortChange = (mode: SortMode) => {
  taskStore.setSortMode(mode)
}
</script>

<template>
  <div class="card p-4">
    <div class="flex items-center gap-2">
      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
        排序:
      </span>
      <div class="flex gap-2 flex-wrap">
        <button
          v-for="mode in sortModes"
          :key="mode.value"
          type="button"
          class="px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-2"
          :class="taskStore.sortMode === mode.value
            ? 'bg-primary-600 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'"
          @click="handleSortChange(mode.value)"
          :aria-label="`按${mode.label}排序`"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="mode.icon" />
          </svg>
          {{ mode.label }}
        </button>
      </div>
    </div>

    <p
      v-if="taskStore.sortMode !== 'manual'"
      class="text-xs text-gray-500 dark:text-gray-400 mt-2"
    >
      自动排序模式下拖拽操作将被禁用
    </p>
  </div>
</template>
