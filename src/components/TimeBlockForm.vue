<script setup lang="ts">
import { ref, watch } from 'vue'
import type { TimeBlock, TimeBlockFormData, ActivityType } from '@/types/schedule'
import { ACTIVITY_TYPE_META, RECURRENCE_PATTERN_META } from '@/types/schedule'
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { X } from 'lucide-vue-next'
import { useTheme } from '@/composables/useTheme'

const props = defineProps<{
  isOpen: boolean
  editingBlock?: TimeBlock | null
}>()

const emit = defineEmits<{
  close: []
  submit: [formData: TimeBlockFormData]
}>()

const { theme } = useTheme()

// 表单数据
const formData = ref<TimeBlockFormData>({
  startTime: '09:00',
  endTime: '10:00',
  activityType: 'work',
  description: '',
  recurrence: 'none',
  recurrenceEndDate: null
})

// 错误信息
const errors = ref<Partial<Record<keyof TimeBlockFormData, string>>>({})

// 监听编辑模式
watch(() => props.editingBlock, (block) => {
  if (block) {
    formData.value = {
      startTime: block.startTime,
      endTime: block.endTime,
      activityType: block.activityType,
      description: block.description,
      recurrence: block.recurrence,
      recurrenceEndDate: block.recurrenceEndDate ? new Date(block.recurrenceEndDate) : null
    }
  } else {
    resetForm()
  }
  errors.value = {}
}, { immediate: true })

// 重置表单
function resetForm() {
  formData.value = {
    startTime: '09:00',
    endTime: '10:00',
    activityType: 'work',
    description: '',
    recurrence: 'none',
    recurrenceEndDate: null
  }
}

// 验证表单
function validateForm(): boolean {
  errors.value = {}

  // 验证描述
  if (!formData.value.description.trim()) {
    errors.value.description = '请输入活动描述'
    return false
  }

  if (formData.value.description.length > 200) {
    errors.value.description = '描述不能超过200字符'
    return false
  }

  // 验证时间
  const startMinutes = timeToMinutes(formData.value.startTime)
  const endMinutes = timeToMinutes(formData.value.endTime)

  if (endMinutes <= startMinutes) {
    errors.value.endTime = '结束时间必须晚于开始时间'
    return false
  }

  // 验证重复结束日期
  if (formData.value.recurrence !== 'none' && formData.value.recurrenceEndDate) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (formData.value.recurrenceEndDate < today) {
      errors.value.recurrenceEndDate = '重复结束日期不能早于今天'
      return false
    }
  }

  return true
}

// 时间转分钟
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// 提交表单
function handleSubmit() {
  if (validateForm()) {
    emit('submit', formData.value)
    handleClose()
  }
}

// 关闭弹窗
function handleClose() {
  resetForm()
  errors.value = {}
  emit('close')
}

// 阻止点击内容区域时关闭
function handleContentClick(e: MouseEvent) {
  e.stopPropagation()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        @click="handleClose"
      >
        <div
          class="w-full max-w-lg bg-white dark:bg-gray-800 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto"
          @click="handleContentClick"
        >
          <!-- 标题栏 -->
          <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {{ editingBlock ? '编辑时间段' : '添加时间段' }}
            </h2>
            <button
              @click="handleClose"
              class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="关闭"
            >
              <X class="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <!-- 表单内容 -->
          <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
            <!-- 时间选择 -->
            <div class="grid grid-cols-2 gap-4">
              <!-- 开始时间 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  开始时间
                </label>
                <input
                  v-model="formData.startTime"
                  type="time"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              <!-- 结束时间 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  结束时间
                </label>
                <input
                  v-model="formData.endTime"
                  type="time"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  :class="{ 'border-red-500': errors.endTime }"
                />
                <p v-if="errors.endTime" class="mt-1 text-sm text-red-600 dark:text-red-400">
                  {{ errors.endTime }}
                </p>
              </div>
            </div>

            <!-- 活动类型 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                活动类型
              </label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="(meta, type) in ACTIVITY_TYPE_META"
                  :key="type"
                  type="button"
                  @click="formData.activityType = type as ActivityType"
                  :class="[
                    'px-4 py-2 rounded-lg border-2 transition-all',
                    formData.activityType === type
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  ]"
                >
                  {{ meta.label }}
                </button>
              </div>
            </div>

            <!-- 活动描述 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                活动描述
              </label>
              <textarea
                v-model="formData.description"
                rows="3"
                placeholder="例如: 学习 Vue 3 Composition API"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 resize-none"
                :class="{ 'border-red-500': errors.description }"
              ></textarea>
              <p v-if="errors.description" class="mt-1 text-sm text-red-600 dark:text-red-400">
                {{ errors.description }}
              </p>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {{ formData.description.length }} / 200
              </p>
            </div>

            <!-- 重复规则 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                重复
              </label>
              <select
                v-model="formData.recurrence"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              >
                <option
                  v-for="(meta, pattern) in RECURRENCE_PATTERN_META"
                  :key="pattern"
                  :value="pattern"
                >
                  {{ meta.label }} - {{ meta.description }}
                </option>
              </select>
            </div>

            <!-- 重复结束日期 (仅当设置了重复时显示) -->
            <div v-if="formData.recurrence !== 'none'">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                重复结束日期 (可选)
              </label>
              <VueDatePicker
                v-model="formData.recurrenceEndDate"
                :dark="theme === 'dark'"
                :min-date="new Date()"
                :enable-time-picker="false"
                placeholder="选择结束日期"
                :format="'yyyy-MM-dd'"
                auto-apply
                :clearable="true"
              />
              <p v-if="errors.recurrenceEndDate" class="mt-1 text-sm text-red-600 dark:text-red-400">
                {{ errors.recurrenceEndDate }}
              </p>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                留空则永久重复
              </p>
            </div>
          </form>

          <!-- 底部按钮 -->
          <div class="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              @click="handleClose"
              class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              @click="handleSubmit"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {{ editingBlock ? '保存' : '添加' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
