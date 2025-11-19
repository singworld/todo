<script setup lang="ts">
import { useTaskStore } from '@/stores/taskStore'
import type { TaskCategory, FilterStatus } from '@/types/task'

const taskStore = useTaskStore()

const categories: { value: TaskCategory | undefined; label: string }[] = [
  { value: undefined, label: '全部分类' },
  { value: 'work', label: '工作' },
  { value: 'study', label: '学习' },
  { value: 'none', label: '无分类' },
]

const statuses: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '未完成' },
  { value: 'completed', label: '已完成' },
]

const handleCategoryChange = (category: TaskCategory | undefined) => {
  taskStore.setFilter({ category })
}

const handleStatusChange = (status: FilterStatus) => {
  taskStore.setFilter({ status })
}

const handleClearCompleted = () => {
  if (confirm('确定要删除所有已完成任务吗?')) {
    taskStore.clearCompleted()
  }
}
</script>

<template>
  <div class="card p-4">
    <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div class="flex flex-col sm:flex-row gap-4 flex-1">
        <!-- 分类筛选 -->
        <div class="flex items-center gap-2">
          <label for="category-filter" class="text-sm font-medium text-gray-700 dark:text-gray-300">
            分类:
          </label>
          <div class="flex gap-2">
            <button
              v-for="cat in categories"
              :key="cat.value || 'all'"
              type="button"
              class="px-3 py-1 text-sm rounded-lg transition-colors"
              :class="taskStore.filter.category === cat.value
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'"
              @click="handleCategoryChange(cat.value)"
            >
              {{ cat.label }}
              <span
                v-if="cat.value && taskStore.tasksByCategory[cat.value] > 0"
                class="ml-1 opacity-75"
              >
                ({{ taskStore.tasksByCategory[cat.value] }})
              </span>
            </button>
          </div>
        </div>

        <!-- 状态筛选 -->
        <div class="flex items-center gap-2">
          <label for="status-filter" class="text-sm font-medium text-gray-700 dark:text-gray-300">
            状态:
          </label>
          <div class="flex gap-2">
            <button
              v-for="status in statuses"
              :key="status.value"
              type="button"
              class="px-3 py-1 text-sm rounded-lg transition-colors"
              :class="taskStore.filter.status === status.value
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'"
              @click="handleStatusChange(status.value)"
            >
              {{ status.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- 清除已完成 -->
      <button
        v-if="taskStore.completedTasks.length > 0"
        type="button"
        class="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
        @click="handleClearCompleted"
      >
        清除已完成 ({{ taskStore.completedTasks.length }})
      </button>
    </div>
  </div>
</template>
