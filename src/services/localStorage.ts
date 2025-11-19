import type { StorageData } from '@/types/task'

const STORAGE_KEY = 'todolist_data'
const STORAGE_VERSION = 'v1'

export class LocalStorageService {
  private getStorageKey(): string {
    return `${STORAGE_KEY}_${STORAGE_VERSION}`
  }

  private isQuotaExceeded(error: unknown): boolean {
    return error instanceof DOMException && (
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    )
  }

  load(): StorageData | null {
    try {
      const data = localStorage.getItem(this.getStorageKey())
      if (!data) return null

      const parsed = JSON.parse(data) as StorageData

      // 验证数据结构
      if (!Array.isArray(parsed.tasks)) {
        console.error('Invalid data structure in localStorage')
        return null
      }

      return parsed
    } catch (error) {
      console.error('Failed to load data from localStorage:', error)
      return null
    }
  }

  save(data: StorageData): boolean {
    try {
      const serialized = JSON.stringify(data)
      localStorage.setItem(this.getStorageKey(), serialized)
      return true
    } catch (error) {
      if (this.isQuotaExceeded(error)) {
        console.error('LocalStorage quota exceeded')
        alert('存储空间不足,请删除部分已完成任务或导出数据')
      } else {
        console.error('Failed to save data to localStorage:', error)
      }
      return false
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(this.getStorageKey())
    } catch (error) {
      console.error('Failed to clear localStorage:', error)
    }
  }

  exportData(): string {
    const data = this.load()
    return JSON.stringify(data, null, 2)
  }

  importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString) as StorageData

      // 验证数据格式
      if (!Array.isArray(data.tasks)) {
        throw new Error('Invalid data format')
      }

      return this.save(data)
    } catch (error) {
      console.error('Failed to import data:', error)
      alert('导入失败:数据格式无效')
      return false
    }
  }

  getStorageSize(): number {
    try {
      const data = localStorage.getItem(this.getStorageKey())
      return data ? new Blob([data]).size : 0
    } catch {
      return 0
    }
  }
}

export const storageService = new LocalStorageService()
