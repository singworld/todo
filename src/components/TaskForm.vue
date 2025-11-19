<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTaskStore } from '@/stores/taskStore'
import type { TaskCategory, TaskPriority, TaskFormData } from '@/types/task'
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { fromISODateString } from '@/utils/date'

const props = defineProps<{
  taskId?: string
}>()

const emit = defineEmits<{
  close: []
}>()

const taskStore = useTaskStore()

const formData = ref<TaskFormData>({
  title: '',
  description: '',
  category: 'none',
  priority: 'medium',
  dueDate: null,
})

const errors = ref<Record<string, string>>({})

const isEditMode = computed(() => !!props.taskId)

const categories: { value: TaskCategory; label: string }[] = [
  { value: 'work', label: '工作' },
  { value: 'study', label: '学习' },
  { value: 'none', label: '无分类' },
]

const priorities: { value: TaskPriority; label: string }[] = [
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
]

onMounted(() => {
  if (isEditMode.value && props.taskId) {
    const task = taskStore.tasks.find(t => t.id === props.taskId)
    if (task) {
      formData.value = {
        title: task.title,
        description: task.description || '',
        category: task.category,
        priority: task.priority,
        dueDate: fromISODateString(task.dueDate),
      }
    }
  }
})

const validate = (): boolean => {
  errors.value = {}

  if (!formData.value.title.trim()) {
    errors.value.title = '任务标题不能为空'
  } else if (formData.value.title.length > 200) {
    errors.value.title = '任务标题不能超过 200 个字符'
  }

  if (formData.value.description && formData.value.description.length > 1000) {
    errors.value.description = '任务描述不能超过 1000 个字符'
  }

  if (formData.value.dueDate) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const selectedDate = new Date(formData.value.dueDate)
    selectedDate.setHours(0, 0, 0, 0)

    if (selectedDate < today) {
      errors.value.dueDate = '截止日期不能早于今天'
    }
  }

  return Object.keys(errors.value).length === 0
}

const handleSubmit = () => {
  if (!validate()) return

  if (isEditMode.value && props.taskId) {
    taskStore.updateTask(props.taskId, formData.value)
  } else {
    taskStore.addTask(formData.value)
  }

  emit('close')
}

const handleCancel = () => {
  emit('close')
}

const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    handleCancel()
  }
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
    @click="handleBackdropClick"
  >
    <div
      class="card w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      role="dialog"
      :aria-label="isEditMode ? '编辑任务' : '添加任务'"
    >
      <div class="p-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          {{ isEditMode ? '编辑任务' : '添加新任务' }}
        </h2>

        <form @submit.prevent="handleSubmit" class="space-y-5">
          <!-- 任务标题 -->
          <div>
            <label for="task-title" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              任务标题 <span class="text-red-500">*</span>
            </label>
            <input
              id="task-title"
              v-model="formData.title"
              type="text"
              class="input-field"
              placeholder="输入任务标题..."
              maxlength="200"
              required
              :aria-invalid="!!errors.title"
              :aria-describedby="errors.title ? 'title-error' : undefined"
            />
            <p v-if="errors.title" id="title-error" class="mt-1 text-sm text-red-600 dark:text-red-400">
              {{ errors.title }}
            </p>
          </div>

          <!-- 任务描述 -->
          <div>
            <label for="task-description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              任务描述
            </label>
            <textarea
              id="task-description"
              v-model="formData.description"
              class="input-field resize-none"
              placeholder="输入任务描述..."
              rows="4"
              maxlength="1000"
              :aria-invalid="!!errors.description"
              :aria-describedby="errors.description ? 'description-error' : undefined"
            ></textarea>
            <p v-if="errors.description" id="description-error" class="mt-1 text-sm text-red-600 dark:text-red-400">
              {{ errors.description }}
            </p>
          </div>

          <!-- 分类和优先级 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- 分类 -->
            <div>
              <label for="task-category" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                分类
              </label>
              <select
                id="task-category"
                v-model="formData.category"
                class="select-field"
              >
                <option v-for="cat in categories" :key="cat.value" :value="cat.value">
                  {{ cat.label }}
                </option>
              </select>
            </div>

            <!-- 优先级 -->
            <div>
              <label for="task-priority" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                优先级
              </label>
              <select
                id="task-priority"
                v-model="formData.priority"
                class="select-field"
              >
                <option v-for="priority in priorities" :key="priority.value" :value="priority.value">
                  {{ priority.label }}
                </option>
              </select>
            </div>
          </div>

          <!-- 截止日期 -->
          <div>
            <label for="task-duedate" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              截止日期
            </label>
            <VueDatePicker
              v-model="formData.dueDate"
              :enable-time-picker="false"
              :min-date="new Date()"
              placeholder="选择截止日期..."
              format="yyyy-MM-dd"
              auto-apply
              :dark="false"
              input-class-name="input-field"
            />
            <p v-if="errors.dueDate" class="mt-1 text-sm text-red-600 dark:text-red-400">
              {{ errors.dueDate }}
            </p>
          </div>

          <!-- 表单按钮 -->
          <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              class="btn-secondary"
              @click="handleCancel"
            >
              取消
            </button>
            <button
              type="submit"
              class="btn-primary"
            >
              {{ isEditMode ? '保存' : '添加' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style>
/* VueDatePicker 暗色模式适配 */
.dp__theme_dark {
  --dp-background-color: #1f2937;
  --dp-text-color: #f3f4f6;
  --dp-hover-color: #374151;
  --dp-hover-text-color: #ffffff;
  --dp-hover-icon-color: #ffffff;
  --dp-primary-color: #0ea5e9;
  --dp-primary-text-color: #ffffff;
  --dp-secondary-color: #4b5563;
  --dp-border-color: #4b5563;
  --dp-menu-border-color: #4b5563;
  --dp-border-color-hover: #6b7280;
  --dp-disabled-color: #6b7280;
  --dp-scroll-bar-background: #374151;
  --dp-scroll-bar-color: #6b7280;
  --dp-success-color: #10b981;
  --dp-success-color-disabled: #065f46;
  --dp-icon-color: #9ca3af;
  --dp-danger-color: #ef4444;
  --dp-highlight-color: rgba(14, 165, 233, 0.1);
}
</style>
