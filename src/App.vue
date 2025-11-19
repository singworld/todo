<script setup lang="ts">
import { ref } from 'vue'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useTheme } from '@/composables/useTheme'
import DateNavigator from '@/components/DateNavigator.vue'
import TimelineView from '@/components/TimelineView.vue'
import TimeBlockForm from '@/components/TimeBlockForm.vue'
import type { TimeBlock, TimeBlockFormData } from '@/types/schedule'
import { Plus, Download, Upload, Moon, Sun, Trash2 } from 'lucide-vue-next'

const scheduleStore = useScheduleStore()
const { theme, toggleTheme: toggleThemeComposable } = useTheme()

// 表单状态
const isFormOpen = ref(false)
const editingBlock = ref<TimeBlock | null>(null)
const editMode = ref<'single' | 'all'>('all')  // 编辑模式: single=仅此日期, all=所有重复
const editTargetDate = ref<string>('')  // 编辑的目标日期

// 文件上传引用
const fileInputRef = ref<HTMLInputElement | null>(null)

// 打开添加表单
function openAddForm() {
  editingBlock.value = null
  editMode.value = 'all'
  editTargetDate.value = ''
  isFormOpen.value = true
}

// 打开编辑表单
function openEditForm(block: TimeBlock) {
  // 如果是重复时间段,询问编辑模式
  if (block.recurrence !== 'none' || block.sourceBlockId) {
    const choice = confirm(
      '这是一个重复的时间段。\n\n' +
      '点击"确定"仅编辑今天这一次\n' +
      '点击"取消"编辑所有重复'
    )
    editMode.value = choice ? 'single' : 'all'

    // 如果是虚拟实例,获取原始时间段
    if (block.sourceBlockId) {
      const sourceBlock = scheduleStore.timeBlocks.find(b => b.id === block.sourceBlockId)
      if (sourceBlock) {
        editingBlock.value = sourceBlock
        editTargetDate.value = block.date
      }
    } else {
      editingBlock.value = block
      editTargetDate.value = block.date
    }
  } else {
    editingBlock.value = block
    editMode.value = 'all'
    editTargetDate.value = ''
  }

  isFormOpen.value = true
}

// 关闭表单
function closeForm() {
  isFormOpen.value = false
  editingBlock.value = null
}

// 提交表单
function handleFormSubmit(formData: TimeBlockFormData) {
  if (editingBlock.value) {
    if (editMode.value === 'single') {
      // 仅编辑此日期 - 创建独立副本
      scheduleStore.updateTimeBlockInstance(
        editingBlock.value.id,
        editTargetDate.value || scheduleStore.currentDate,
        formData
      )
    } else {
      // 编辑所有重复
      scheduleStore.updateTimeBlock(editingBlock.value.id, formData)
    }
  } else {
    scheduleStore.addTimeBlock(formData)
  }
}

// 切换主题
function toggleTheme() {
  toggleThemeComposable()
  scheduleStore.toggleTheme()
}

// 导出数据
function handleExport() {
  scheduleStore.exportScheduleData()
}

// 导入数据
function handleImport() {
  fileInputRef.value?.click()
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    scheduleStore.importScheduleData(file)
    // 重置文件输入
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  }
}

// 清空数据
function handleClearData() {
  scheduleStore.clearAllData()
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
    <!-- 顶部栏 -->
    <header class="bg-white dark:bg-gray-800 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <!-- 标题 -->
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
              时间段日程管理
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              规划你的每一天
            </p>
          </div>

          <!-- 右侧操作按钮 -->
          <div class="flex items-center space-x-2">
            <!-- 添加时间段 -->
            <button
              @click="openAddForm"
              class="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus class="w-4 h-4" />
              <span class="hidden sm:inline">添加时间段</span>
            </button>

            <!-- 导出 -->
            <button
              @click="handleExport"
              class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="导出数据"
              aria-label="导出数据"
            >
              <Download class="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            <!-- 导入 -->
            <button
              @click="handleImport"
              class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="导入数据"
              aria-label="导入数据"
            >
              <Upload class="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <input
              ref="fileInputRef"
              type="file"
              accept="application/json"
              class="hidden"
              @change="handleFileChange"
            />

            <!-- 清空数据 -->
            <button
              @click="handleClearData"
              class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="清空所有数据"
              aria-label="清空所有数据"
            >
              <Trash2 class="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            <!-- 主题切换 -->
            <button
              @click="toggleTheme"
              class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="切换主题"
            >
              <Moon v-if="theme === 'light'" class="w-5 h-5 text-gray-600" />
              <Sun v-else class="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 日期导航 -->
      <DateNavigator />

      <!-- 统计信息 -->
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <p class="text-sm text-blue-600 dark:text-blue-400">工作</p>
          <p class="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {{ scheduleStore.timeBlocksByActivity.work }}
          </p>
        </div>
        <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <p class="text-sm text-green-600 dark:text-green-400">学习</p>
          <p class="text-2xl font-bold text-green-700 dark:text-green-300">
            {{ scheduleStore.timeBlocksByActivity.study }}
          </p>
        </div>
        <div class="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-4">
          <p class="text-sm text-gray-600 dark:text-gray-400">其他</p>
          <p class="text-2xl font-bold text-gray-700 dark:text-gray-300">
            {{ scheduleStore.timeBlocksByActivity.other }}
          </p>
        </div>
      </div>

      <!-- 时间轴视图 -->
      <TimelineView @edit="openEditForm" />
    </main>

    <!-- 表单弹窗 -->
    <TimeBlockForm
      :is-open="isFormOpen"
      :editing-block="editingBlock"
      :edit-mode="editMode"
      @close="closeForm"
      @submit="handleFormSubmit"
    />
  </div>
</template>
