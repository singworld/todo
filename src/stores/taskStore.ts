import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import type { Task, TaskFilter, SortMode, TaskFormData } from '@/types/task'
import { storageService } from '@/services/localStorage'
import { sortTasks, reorderTasks } from '@/utils/sort'

export const useTaskStore = defineStore('task', () => {
  // State
  const tasks = ref<Task[]>([])
  const filter = ref<TaskFilter>({
    status: 'all'
  })
  const sortMode = ref<SortMode>('manual')

  // Computed
  const filteredTasks = computed(() => {
    let result = tasks.value

    // 按分类筛选
    if (filter.value.category) {
      result = result.filter(task => task.category === filter.value.category)
    }

    // 按状态筛选
    if (filter.value.status === 'active') {
      result = result.filter(task => !task.completed)
    } else if (filter.value.status === 'completed') {
      result = result.filter(task => task.completed)
    }

    return result
  })

  const sortedTasks = computed(() => {
    return sortTasks(filteredTasks.value, sortMode.value)
  })

  const activeTasks = computed(() =>
    tasks.value.filter(task => !task.completed)
  )

  const completedTasks = computed(() =>
    tasks.value.filter(task => task.completed)
  )

  const tasksByCategory = computed(() => ({
    work: tasks.value.filter(task => task.category === 'work').length,
    study: tasks.value.filter(task => task.category === 'study').length,
    none: tasks.value.filter(task => task.category === 'none').length,
  }))

  // Actions
  function addTask(formData: TaskFormData): Task {
    const now = new Date().toISOString()
    const maxOrder = tasks.value.reduce((max, task) => Math.max(max, task.order), -1)

    const task: Task = {
      id: uuidv4(),
      title: formData.title.trim(),
      description: formData.description?.trim(),
      category: formData.category,
      priority: formData.priority,
      dueDate: formData.dueDate ? formData.dueDate.toISOString() : undefined,
      completed: false,
      createdAt: now,
      updatedAt: now,
      order: maxOrder + 1
    }

    tasks.value.push(task)
    saveToStorage()
    return task
  }

  function updateTask(id: string, formData: Partial<TaskFormData>): boolean {
    const task = tasks.value.find(t => t.id === id)
    if (!task) return false

    if (formData.title !== undefined) {
      task.title = formData.title.trim()
    }
    if (formData.description !== undefined) {
      task.description = formData.description?.trim()
    }
    if (formData.category !== undefined) {
      task.category = formData.category
    }
    if (formData.priority !== undefined) {
      task.priority = formData.priority
    }
    if (formData.dueDate !== undefined) {
      task.dueDate = formData.dueDate ? formData.dueDate.toISOString() : undefined
    }

    task.updatedAt = new Date().toISOString()
    saveToStorage()
    return true
  }

  function deleteTask(id: string): boolean {
    const index = tasks.value.findIndex(t => t.id === id)
    if (index === -1) return false

    tasks.value.splice(index, 1)
    saveToStorage()
    return true
  }

  function toggleTaskComplete(id: string): boolean {
    const task = tasks.value.find(t => t.id === id)
    if (!task) return false

    task.completed = !task.completed
    task.updatedAt = new Date().toISOString()
    saveToStorage()
    return true
  }

  function reorderTasksByDrag(newOrder: Task[]): void {
    // 更新 order 字段
    const reordered = reorderTasks(newOrder)

    // 更新 tasks 数组,保持未在筛选列表中的任务不变
    reordered.forEach(task => {
      const original = tasks.value.find(t => t.id === task.id)
      if (original) {
        original.order = task.order
        original.updatedAt = new Date().toISOString()
      }
    })

    saveToStorage()
  }

  function setFilter(newFilter: Partial<TaskFilter>): void {
    filter.value = { ...filter.value, ...newFilter }
  }

  function setSortMode(mode: SortMode): void {
    sortMode.value = mode

    if (mode !== 'manual') {
      // 自动排序模式:更新所有任务的 order
      const sorted = sortTasks(tasks.value, mode)
      tasks.value = reorderTasks(sorted)
    }

    saveToStorage()
  }

  function clearCompleted(): void {
    tasks.value = tasks.value.filter(task => !task.completed)
    saveToStorage()
  }

  function saveToStorage(): void {
    storageService.save({
      tasks: tasks.value,
      sortMode: sortMode.value,
      theme: 'light' // 主题由 useTheme 管理
    })
  }

  function loadFromStorage(): void {
    const data = storageService.load()
    if (data) {
      tasks.value = data.tasks
      sortMode.value = data.sortMode
    }
  }

  function exportData(): string {
    return storageService.exportData()
  }

  function importData(jsonString: string): boolean {
    const success = storageService.importData(jsonString)
    if (success) {
      loadFromStorage()
    }
    return success
  }

  // 初始化时加载数据
  loadFromStorage()

  return {
    // State
    tasks,
    filter,
    sortMode,

    // Computed
    filteredTasks,
    sortedTasks,
    activeTasks,
    completedTasks,
    tasksByCategory,

    // Actions
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    reorderTasksByDrag,
    setFilter,
    setSortMode,
    clearCompleted,
    exportData,
    importData,
  }
})
