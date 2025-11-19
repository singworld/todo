<script setup lang="ts">
import { computed } from 'vue'
import type { Task } from '@/types/task'
import { formatDate, isOverdue } from '@/utils/date'

const props = defineProps<{
  task: Task
  draggable: boolean
}>()

const emit = defineEmits<{
  toggleComplete: [id: string]
  edit: [id: string]
  delete: [id: string]
}>()

const priorityColors = {
  high: 'border-l-priority-high bg-red-50 dark:bg-red-950',
  medium: 'border-l-priority-medium bg-yellow-50 dark:bg-yellow-950',
  low: 'border-l-priority-low bg-green-50 dark:bg-green-950',
}

const categoryLabels = {
  work: '工作',
  study: '学习',
  none: '无分类',
}

const priorityLabels = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级',
}

const cardClass = computed(() => {
  return [
    'card p-4 border-l-4 transition-all hover:shadow-md',
    priorityColors[props.task.priority],
    props.task.completed && 'opacity-60',
  ].join(' ')
})

const isTaskOverdue = computed(() => isOverdue(props.task.dueDate))

const formattedDueDate = computed(() => formatDate(props.task.dueDate))
</script>

<template>
  <div :class="cardClass">
    <div class="flex items-start gap-3">
      <!-- 拖拽手柄 -->
      <button
        v-if="draggable"
        type="button"
        class="drag-handle mt-1 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-move"
        aria-label="拖拽排序"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
        </svg>
      </button>

      <!-- 完成复选框 -->
      <button
        type="button"
        class="mt-1 flex-shrink-0"
        @click="emit('toggleComplete', task.id)"
        :aria-label="task.completed ? '标记为未完成' : '标记为已完成'"
      >
        <div
          class="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
          :class="task.completed
            ? 'bg-primary-600 border-primary-600'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary-500'"
        >
          <svg
            v-if="task.completed"
            class="w-3 h-3 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </button>

      <!-- 任务内容 -->
      <div class="flex-1 min-w-0">
        <h3
          class="text-base font-medium"
          :class="task.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'"
        >
          {{ task.title }}
        </h3>

        <p
          v-if="task.description"
          class="mt-1 text-sm text-gray-600 dark:text-gray-400"
          :class="task.completed && 'line-through'"
        >
          {{ task.description }}
        </p>

        <!-- 元数据 -->
        <div class="mt-2 flex flex-wrap gap-2 text-xs">
          <!-- 分类 -->
          <span
            class="px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            {{ categoryLabels[task.category] }}
          </span>

          <!-- 优先级 -->
          <span
            class="px-2 py-1 rounded-full"
            :class="{
              'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300': task.priority === 'high',
              'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300': task.priority === 'medium',
              'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300': task.priority === 'low',
            }"
          >
            {{ priorityLabels[task.priority] }}
          </span>

          <!-- 截止日期 -->
          <span
            v-if="task.dueDate"
            class="px-2 py-1 rounded-full flex items-center gap-1"
            :class="isTaskOverdue && !task.completed
              ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 font-medium'
              : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {{ formattedDueDate }}
            <span v-if="isTaskOverdue && !task.completed">(已过期)</span>
          </span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex items-center gap-1 flex-shrink-0">
        <button
          type="button"
          class="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          @click="emit('edit', task.id)"
          aria-label="编辑任务"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>

        <button
          type="button"
          class="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          @click="emit('delete', task.id)"
          aria-label="删除任务"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
