<script setup lang="ts">
import { useScheduleStore } from '@/stores/scheduleStore'
import { formatDateFriendly, getToday } from '@/utils/schedule'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-vue-next'

const scheduleStore = useScheduleStore()

const isToday = () => scheduleStore.currentDate === getToday()
</script>

<template>
  <div class="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
    <!-- 左侧: 日期显示 -->
    <div class="flex items-center space-x-3">
      <Calendar class="w-5 h-5 text-gray-600 dark:text-gray-400" />
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {{ formatDateFriendly(scheduleStore.currentDate) }}
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ scheduleStore.currentDate }}
        </p>
      </div>
    </div>

    <!-- 右侧: 导航按钮 -->
    <div class="flex items-center space-x-2">
      <!-- 上一天 -->
      <button
        @click="scheduleStore.goToPreviousDay"
        class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="上一天"
      >
        <ChevronLeft class="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>

      <!-- 今天 -->
      <button
        v-if="!isToday()"
        @click="scheduleStore.goToToday"
        class="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
      >
        今天
      </button>

      <!-- 下一天 -->
      <button
        @click="scheduleStore.goToNextDay"
        class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="下一天"
      >
        <ChevronRight class="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>
    </div>
  </div>
</template>
