<script setup lang="ts">
import { computed } from 'vue'
import { useScheduleStore } from '@/stores/scheduleStore'
import { getWeekDates, formatDate, parseDate, getTimeBlocksForDate } from '@/utils/schedule'
import { ACTIVITY_TYPE_META } from '@/types/schedule'

const scheduleStore = useScheduleStore()

// 事件
const emit = defineEmits<{
  selectDate: [date: string]
}>()

// 星期标签
const weekdayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

// 计算周日期及其时间段（合并数据避免模板中重复调用）
const weekDatesWithBlocks = computed(() => {
  const currentDate = parseDate(scheduleStore.currentDate)
  const dates = getWeekDates(currentDate)

  return dates.map((date, index) => {
    const dateKey = formatDate(date)
    const blocks = getTimeBlocksForDate(scheduleStore.timeBlocks, dateKey)

    return {
      date: dateKey,
      dateDisplay: `${date.getMonth() + 1}/${date.getDate()}`,
      weekday: weekdayLabels[index],
      blocks,
      isSelected: dateKey === scheduleStore.currentDate
    }
  })
})

// 处理日期点击
function handleDateClick(date: string) {
  emit('selectDate', date)
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
    <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">周视图</h2>

    <!-- 周日期网格 -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
      <div
        v-for="item in weekDatesWithBlocks"
        :key="item.date"
        role="button"
        tabindex="0"
        :aria-label="`${item.weekday} ${item.dateDisplay}，${item.blocks.length} 个时间段${item.isSelected ? '，当前选中' : ''}`"
        class="border border-gray-200 dark:border-gray-700 rounded-lg p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        :class="{
          'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700': item.isSelected
        }"
        @click="handleDateClick(item.date)"
        @keydown.enter="handleDateClick(item.date)"
        @keydown.space.prevent="handleDateClick(item.date)"
      >
        <!-- 日期标题 -->
        <div class="mb-2">
          <div class="text-xs text-gray-500 dark:text-gray-400">{{ item.weekday }}</div>
          <div class="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {{ item.dateDisplay }}
          </div>
        </div>

        <!-- 时间段列表 -->
        <div class="space-y-1">
          <div
            v-for="block in item.blocks"
            :key="block.id"
            class="text-xs p-1.5 rounded border-l-2"
            :class="[
              ACTIVITY_TYPE_META[block.activityType].bgColor,
              ACTIVITY_TYPE_META[block.activityType].borderColor
            ]"
          >
            <div class="font-medium truncate" :class="ACTIVITY_TYPE_META[block.activityType].color">
              {{ block.startTime }} - {{ block.endTime }}
            </div>
            <div class="text-gray-600 dark:text-gray-400 truncate">
              {{ block.description }}
            </div>
          </div>

          <!-- 空状态 -->
          <div
            v-if="item.blocks.length === 0"
            class="text-xs text-gray-400 dark:text-gray-500 italic"
          >
            无安排
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
