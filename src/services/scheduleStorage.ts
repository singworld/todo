import type { TimeBlock, StorageData } from '@/types/schedule'
import { cleanupOldTimeBlocks } from '@/utils/schedule'

const STORAGE_KEY = 'schedule_data_v1'

/**
 * 验证时间段数据结构
 */
function isValidTimeBlock(data: unknown): data is TimeBlock {
  if (typeof data !== 'object' || data === null) return false

  const block = data as Record<string, unknown>

  return (
    typeof block.id === 'string' &&
    typeof block.date === 'string' &&
    typeof block.startTime === 'string' &&
    typeof block.endTime === 'string' &&
    typeof block.activityType === 'string' &&
    typeof block.description === 'string' &&
    typeof block.recurrence === 'string' &&
    typeof block.createdAt === 'string' &&
    typeof block.updatedAt === 'string'
  )
}

/**
 * 从 LocalStorage 加载数据
 */
export function loadFromStorage(): StorageData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)

    if (!stored) {
      return {
        timeBlocks: [],
        theme: 'light'
      }
    }

    const parsed = JSON.parse(stored)

    // 验证数据结构
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      Array.isArray(parsed.timeBlocks)
    ) {
      // 过滤无效数据
      const validTimeBlocks = parsed.timeBlocks.filter(isValidTimeBlock)

      // 清理过期数据
      const cleanedTimeBlocks = cleanupOldTimeBlocks(validTimeBlocks)

      return {
        timeBlocks: cleanedTimeBlocks,
        theme: parsed.theme === 'dark' ? 'dark' : 'light'
      }
    }

    return {
      timeBlocks: [],
      theme: 'light'
    }
  } catch (error) {
    console.error('加载数据失败:', error)
    return {
      timeBlocks: [],
      theme: 'light'
    }
  }
}

/**
 * 保存数据到 LocalStorage
 */
export function saveToStorage(data: StorageData): boolean {
  try {
    // 清理过期数据后再保存
    const cleanedData = {
      ...data,
      timeBlocks: cleanupOldTimeBlocks(data.timeBlocks)
    }

    const serialized = JSON.stringify(cleanedData)
    localStorage.setItem(STORAGE_KEY, serialized)
    return true
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.error('LocalStorage 存储空间不足')
      alert('存储空间不足,请删除一些旧的时间段或导出数据后清空')
    } else {
      console.error('保存数据失败:', error)
    }
    return false
  }
}

/**
 * 清空所有数据
 */
export function clearStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('清空数据失败:', error)
  }
}

/**
 * 导出数据为 JSON
 */
export function exportData(data: StorageData): void {
  try {
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `schedule-backup-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('导出数据失败:', error)
    alert('导出数据失败,请重试')
  }
}

/**
 * 导入数据从 JSON
 */
export function importData(file: File): Promise<StorageData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const parsed = JSON.parse(text)

        if (
          typeof parsed === 'object' &&
          parsed !== null &&
          Array.isArray(parsed.timeBlocks)
        ) {
          const validTimeBlocks = parsed.timeBlocks.filter(isValidTimeBlock)

          resolve({
            timeBlocks: validTimeBlocks,
            theme: parsed.theme === 'dark' ? 'dark' : 'light'
          })
        } else {
          reject(new Error('无效的数据格式'))
        }
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file)
  })
}
