import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { TimeBlock, Theme, TimeBlockFormData } from '@/types/schedule'
import {
  loadFromStorage,
  saveToStorage,
  exportData,
  importData
} from '@/services/scheduleStorage'
import {
  getToday,
  getYesterday,
  getTomorrow,
  getTimeBlocksForDate
} from '@/utils/schedule'
import { v4 as uuidv4 } from 'uuid'

export const useScheduleStore = defineStore('schedule', () => {
  // 状态
  const timeBlocks = ref<TimeBlock[]>([])
  const currentDate = ref<string>(getToday())
  const theme = ref<Theme>('light')

  // 计算属性: 当前日期的时间段(包括重复生成的)
  const currentDayTimeBlocks = computed(() => {
    return getTimeBlocksForDate(timeBlocks.value, currentDate.value)
  })

  // 计算属性: 按活动类型统计
  const timeBlocksByActivity = computed(() => {
    const blocks = currentDayTimeBlocks.value
    return {
      work: blocks.filter(b => b.activityType === 'work').length,
      study: blocks.filter(b => b.activityType === 'study').length,
      other: blocks.filter(b => b.activityType === 'other').length
    }
  })

  // 初始化: 从 LocalStorage 加载数据
  function initializeStore() {
    const data = loadFromStorage()
    timeBlocks.value = data.timeBlocks
    theme.value = data.theme
  }

  // 保存到 LocalStorage
  function persistToStorage() {
    saveToStorage({
      timeBlocks: timeBlocks.value,
      theme: theme.value
    })
  }

  // 添加时间段
  function addTimeBlock(formData: TimeBlockFormData): void {
    const now = new Date().toISOString()

    const newBlock: TimeBlock = {
      id: uuidv4(),
      date: currentDate.value,
      startTime: formData.startTime,
      endTime: formData.endTime,
      activityType: formData.activityType,
      description: formData.description,
      recurrence: formData.recurrence,
      recurrenceEndDate: formData.recurrenceEndDate
        ? formData.recurrenceEndDate.toISOString().split('T')[0]
        : undefined,
      createdAt: now,
      updatedAt: now
    }

    timeBlocks.value.push(newBlock)
    persistToStorage()
  }

  // 编辑时间段
  function updateTimeBlock(id: string, formData: Partial<TimeBlockFormData>): void {
    const index = timeBlocks.value.findIndex(b => b.id === id)

    if (index === -1) return

    const block = timeBlocks.value[index]

    timeBlocks.value[index] = {
      ...block,
      startTime: formData.startTime ?? block.startTime,
      endTime: formData.endTime ?? block.endTime,
      activityType: formData.activityType ?? block.activityType,
      description: formData.description ?? block.description,
      recurrence: formData.recurrence ?? block.recurrence,
      recurrenceEndDate: formData.recurrenceEndDate !== undefined
        ? (formData.recurrenceEndDate
            ? formData.recurrenceEndDate.toISOString().split('T')[0]
            : undefined)
        : block.recurrenceEndDate,
      updatedAt: new Date().toISOString()
    }

    persistToStorage()
  }

  // 仅编辑某一天的重复时间段实例 (创建独立副本)
  function updateTimeBlockInstance(
    sourceBlockId: string,
    targetDate: string,
    formData: Partial<TimeBlockFormData>
  ): void {
    // 查找原始时间段
    const sourceBlock = timeBlocks.value.find(b => b.id === sourceBlockId)

    if (!sourceBlock) return

    // 检查是否已有该日期的独立副本
    const existingCopy = timeBlocks.value.find(
      b => b.sourceBlockId === sourceBlockId && b.date === targetDate
    )

    const now = new Date().toISOString()

    if (existingCopy) {
      // 更新已存在的副本
      const index = timeBlocks.value.findIndex(b => b.id === existingCopy.id)
      if (index !== -1) {
        timeBlocks.value[index] = {
          ...existingCopy,
          startTime: formData.startTime ?? existingCopy.startTime,
          endTime: formData.endTime ?? existingCopy.endTime,
          activityType: formData.activityType ?? existingCopy.activityType,
          description: formData.description ?? existingCopy.description,
          updatedAt: now
        }
      }
    } else {
      // 创建新的独立副本
      const newBlock: TimeBlock = {
        id: uuidv4(),
        date: targetDate,
        startTime: formData.startTime ?? sourceBlock.startTime,
        endTime: formData.endTime ?? sourceBlock.endTime,
        activityType: formData.activityType ?? sourceBlock.activityType,
        description: formData.description ?? sourceBlock.description,
        recurrence: 'none',  // 副本不重复
        sourceBlockId: sourceBlockId,  // 标记来源
        createdAt: now,
        updatedAt: now
      }
      timeBlocks.value.push(newBlock)
    }

    persistToStorage()
  }

  // 删除时间段
  function deleteTimeBlock(id: string): void {
    const index = timeBlocks.value.findIndex(b => b.id === id)

    if (index !== -1) {
      timeBlocks.value.splice(index, 1)
      persistToStorage()
    }
  }

  // 删除重复时间段的某一天实例
  function deleteTimeBlockInstance(sourceBlockId: string, targetDate: string): void {
    // 查找原始时间段
    const sourceBlock = timeBlocks.value.find(b => b.id === sourceBlockId)

    if (!sourceBlock || sourceBlock.recurrence === 'none') {
      // 如果是非重复时间段,直接删除
      deleteTimeBlock(sourceBlockId)
      return
    }

    // 对于重复时间段,我们需要:
    // 1. 如果删除的是原始日期,则整个删除
    if (sourceBlock.date === targetDate) {
      deleteTimeBlock(sourceBlockId)
      return
    }

    // 2. 如果删除的是未来某天,需要调整 recurrenceEndDate 为删除日期的前一天
    // 注意: 这里简化处理,实际可能需要更复杂的逻辑(例如添加排除日期列表)
    // 为了简化,我们暂时不支持删除重复时间段的单个实例,只能删除整个重复时间段
    alert('无法删除重复时间段的单个实例,请编辑时间段的重复规则')
  }

  // 日期导航: 切换到今天
  function goToToday(): void {
    currentDate.value = getToday()
  }

  // 日期导航: 切换到昨天
  function goToPreviousDay(): void {
    currentDate.value = getYesterday(currentDate.value)
  }

  // 日期导航: 切换到明天
  function goToNextDay(): void {
    currentDate.value = getTomorrow(currentDate.value)
  }

  // 日期导航: 切换到指定日期
  function goToDate(date: string): void {
    currentDate.value = date
  }

  // 主题切换
  function toggleTheme(): void {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    persistToStorage()
  }

  // 导出数据
  function exportScheduleData(): void {
    exportData({
      timeBlocks: timeBlocks.value,
      theme: theme.value
    })
  }

  // 导入数据
  async function importScheduleData(file: File): Promise<void> {
    try {
      const data = await importData(file)
      timeBlocks.value = data.timeBlocks
      theme.value = data.theme
      persistToStorage()
      alert('数据导入成功!')
    } catch (error) {
      console.error('导入失败:', error)
      alert('数据导入失败,请检查文件格式')
    }
  }

  // 清空所有数据
  function clearAllData(): void {
    if (confirm('确定要清空所有数据吗?此操作无法撤销!')) {
      timeBlocks.value = []
      persistToStorage()
    }
  }

  // 初始化
  initializeStore()

  return {
    // 状态
    timeBlocks,
    currentDate,
    theme,

    // 计算属性
    currentDayTimeBlocks,
    timeBlocksByActivity,

    // 方法
    addTimeBlock,
    updateTimeBlock,
    updateTimeBlockInstance,
    deleteTimeBlock,
    deleteTimeBlockInstance,
    goToToday,
    goToPreviousDay,
    goToNextDay,
    goToDate,
    toggleTheme,
    exportScheduleData,
    importScheduleData,
    clearAllData
  }
})
