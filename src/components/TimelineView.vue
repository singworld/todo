<script setup lang="ts">
import { ref, computed } from 'vue'
import { useScheduleStore } from '@/stores/scheduleStore'
import { ACTIVITY_TYPE_META } from '@/types/schedule'
import type { TimeBlock } from '@/types/schedule'
import { Clock, Edit, Trash2 } from 'lucide-vue-next'

const scheduleStore = useScheduleStore()

const emit = defineEmits<{
  edit: [timeBlock: TimeBlock]
}>()

// 工作时间范围配置
const START_HOUR = 10  // 开始小时 (10:00)
const END_HOUR = 18    // 结束小时 (18:00)
const WORK_HOURS = END_HOUR - START_HOUR  // 工作小时数 (8小时)

// 时间轴小时数组 (10-18)
const hours = Array.from({ length: WORK_HOURS + 1 }, (_, i) => START_HOUR + i)

// 当前时间 (用于高亮当前时间线)
const currentTime = ref(new Date())
setInterval(() => {
  currentTime.value = new Date()
}, 60000) // 每分钟更新一次

// 当前时间的位置百分比 (0-100, 相对于工作时间段)
const currentTimePosition = computed(() => {
  const now = currentTime.value
  const hours = now.getHours()
  const minutes = now.getMinutes()
  const currentMinutes = hours * 60 + minutes
  const startMinutes = START_HOUR * 60
  const workMinutes = WORK_HOURS * 60

  // 如果当前时间不在工作时间范围内,不显示
  if (hours < START_HOUR || hours >= END_HOUR) {
    return -1
  }

  return ((currentMinutes - startMinutes) / workMinutes) * 100
})

// 是否显示当前时间线 (仅当查看今天且在工作时间内)
const showCurrentTimeLine = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return scheduleStore.currentDate === today && currentTimePosition.value >= 0
})

// 将时间字符串转换为分钟数 (00:00 = 0, 23:59 = 1439)
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// 计算时间段的位置和高度 (相对于工作时间段)
function getTimeBlockStyle(block: TimeBlock) {
  const start = timeToMinutes(block.startTime)
  const end = timeToMinutes(block.endTime)
  const duration = end - start

  const startMinutes = START_HOUR * 60
  const workMinutes = WORK_HOURS * 60

  // 相对于工作时间段的位置
  const top = ((start - startMinutes) / workMinutes) * 100
  const height = (duration / workMinutes) * 100

  return {
    top: `${top}%`,
    height: `${height}%`
  }
}

// 删除时间段
function handleDelete(block: TimeBlock) {
  if (confirm(`确定要删除"${block.description}"吗?`)) {
    if (block.sourceBlockId) {
      // 这是一个重复生成的实例
      scheduleStore.deleteTimeBlockInstance(block.sourceBlockId, block.date)
    } else {
      scheduleStore.deleteTimeBlock(block.id)
    }
  }
}

// 编辑时间段
function handleEdit(block: TimeBlock) {
  // 如果是重复生成的实例,编辑原始时间段
  if (block.sourceBlockId) {
    const sourceBlock = scheduleStore.timeBlocks.find(b => b.id === block.sourceBlockId)
    if (sourceBlock) {
      emit('edit', sourceBlock)
    }
  } else {
    emit('edit', block)
  }
}
</script>

<template>
  <div class="relative bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
    <!-- 时间轴容器 (8小时 = 480分钟 = 480px 高度) -->
    <div class="relative" style="height: 640px;">
      <!-- 小时刻度线和标签 -->
      <div class="absolute inset-0">
        <div
          v-for="(hour, index) in hours"
          :key="hour"
          class="absolute w-full border-t border-gray-200 dark:border-gray-700"
          :style="{ top: `${(index / WORK_HOURS) * 100}%` }"
        >
          <span class="absolute -top-3 left-2 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-1">
            {{ hour.toString().padStart(2, '0') }}:00
          </span>
        </div>
      </div>

      <!-- 当前时间线 -->
      <div
        v-if="showCurrentTimeLine"
        class="absolute w-full z-20 pointer-events-none"
        :style="{ top: `${currentTimePosition}%` }"
      >
        <div class="flex items-center">
          <div class="w-2 h-2 bg-red-500 rounded-full -ml-1"></div>
          <div class="flex-1 h-0.5 bg-red-500"></div>
        </div>
      </div>

      <!-- 时间段容器 -->
      <div class="absolute inset-0 left-16 right-4">
        <!-- 时间段卡片 -->
        <div
          v-for="block in scheduleStore.currentDayTimeBlocks"
          :key="block.id + block.date"
          class="absolute left-0 right-0 px-2 group"
          :style="getTimeBlockStyle(block)"
        >
          <div
            :class="[
              'h-full rounded-lg border-l-4 p-3 shadow-sm hover:shadow-md transition-all',
              ACTIVITY_TYPE_META[block.activityType].bgColor,
              ACTIVITY_TYPE_META[block.activityType].borderColor
            ]"
          >
            <!-- 时间和活动类型 -->
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center space-x-2">
                <Clock :class="['w-3 h-3', ACTIVITY_TYPE_META[block.activityType].color]" />
                <span :class="['text-xs font-medium', ACTIVITY_TYPE_META[block.activityType].color]">
                  {{ block.startTime }} - {{ block.endTime }}
                </span>
                <span :class="['text-xs', ACTIVITY_TYPE_META[block.activityType].color]">
                  {{ ACTIVITY_TYPE_META[block.activityType].label }}
                </span>
              </div>

              <!-- 操作按钮 (hover 显示) -->
              <div class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  @click="handleEdit(block)"
                  class="p-1 rounded hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors"
                  aria-label="编辑"
                >
                  <Edit class="w-3 h-3 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  @click="handleDelete(block)"
                  class="p-1 rounded hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors"
                  aria-label="删除"
                >
                  <Trash2 class="w-3 h-3 text-red-600 dark:text-red-400" />
                </button>
              </div>
            </div>

            <!-- 描述 -->
            <p :class="['text-sm font-medium line-clamp-2', ACTIVITY_TYPE_META[block.activityType].color]">
              {{ block.description }}
            </p>

            <!-- 重复标识 -->
            <div v-if="block.recurrence !== 'none'" class="mt-1">
              <span class="text-xs text-gray-500 dark:text-gray-400">
                🔄 {{ block.sourceBlockId ? '重复' : '重复(原始)' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div
        v-if="scheduleStore.currentDayTimeBlocks.length === 0"
        class="absolute inset-0 flex items-center justify-center"
      >
        <div class="text-center text-gray-400 dark:text-gray-500">
          <Clock class="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p class="text-sm">今天还没有安排</p>
          <p class="text-xs mt-1">点击"添加时间段"开始规划</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
