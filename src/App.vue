<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'
import { useTaskStore } from '@/stores/taskStore'
import TaskList from '@/components/TaskList.vue'
import TaskForm from '@/components/TaskForm.vue'
import FilterBar from '@/components/FilterBar.vue'
import SortControls from '@/components/SortControls.vue'
import { ref } from 'vue'

const { theme, toggleTheme } = useTheme()
const taskStore = useTaskStore()
const showForm = ref(false)
const editingTaskId = ref<string | undefined>()

const handleAddTask = () => {
  showForm.value = true
  editingTaskId.value = undefined
}

const handleEditTask = (id: string) => {
  showForm.value = true
  editingTaskId.value = id
}

const handleFormClose = () => {
  showForm.value = false
  editingTaskId.value = undefined
}

const handleExport = () => {
  const data = taskStore.exportData()
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `todolist-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const handleImport = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'application/json'
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        taskStore.importData(content)
      }
      reader.readAsText(file)
    }
  }
  input.click()
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
              待办事项
            </h1>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {{ taskStore.activeTasks.length }} 个未完成任务
            </p>
          </div>

          <div class="flex items-center gap-3">
            <!-- 导出/导入 -->
            <button
              type="button"
              class="btn-secondary text-sm"
              @click="handleExport"
              aria-label="导出数据"
            >
              导出
            </button>
            <button
              type="button"
              class="btn-secondary text-sm"
              @click="handleImport"
              aria-label="导入数据"
            >
              导入
            </button>

            <!-- 主题切换 -->
            <button
              type="button"
              class="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              @click="toggleTheme"
              :aria-label="theme === 'light' ? '切换到暗色模式' : '切换到亮色模式'"
            >
              <svg v-if="theme === 'light'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </button>

            <!-- 添加任务按钮 -->
            <button
              type="button"
              class="btn-primary flex items-center gap-2"
              @click="handleAddTask"
              aria-label="添加新任务"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              <span class="hidden sm:inline">添加任务</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div class="space-y-6">
        <!-- 筛选栏 -->
        <FilterBar />

        <!-- 排序控制 -->
        <SortControls />

        <!-- 任务列表 -->
        <TaskList @edit-task="handleEditTask" />
      </div>
    </main>

    <!-- 任务表单弹窗 -->
    <TaskForm
      v-if="showForm"
      :task-id="editingTaskId"
      @close="handleFormClose"
    />
  </div>
</template>
