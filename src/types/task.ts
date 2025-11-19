export type TaskCategory = 'work' | 'study' | 'none'
export type TaskPriority = 'high' | 'medium' | 'low'
export type SortMode = 'manual' | 'priority' | 'dueDate' | 'createdAt'
export type FilterStatus = 'all' | 'active' | 'completed'
export type Theme = 'light' | 'dark'

export interface Task {
  id: string
  title: string
  description?: string
  category: TaskCategory
  priority: TaskPriority
  dueDate?: string // ISO 8601 格式
  completed: boolean
  createdAt: string
  updatedAt: string
  order: number
}

export interface TaskFilter {
  category?: TaskCategory
  status: FilterStatus
}

export interface AppState {
  tasks: Task[]
  filter: TaskFilter
  sortMode: SortMode
  theme: Theme
}

export interface TaskFormData {
  title: string
  description?: string
  category: TaskCategory
  priority: TaskPriority
  dueDate?: Date | null
}

export interface StorageData {
  tasks: Task[]
  sortMode: SortMode
  theme: Theme
}
