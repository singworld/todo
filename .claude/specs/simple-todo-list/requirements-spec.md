# Todo List 技术实现规格

**生成时间**: 2025-11-18
**目标**: 代码生成优化规格,直接映射到可执行代码
**设计原则**: KISS、YAGNI、DRY

---

## 问题陈述

### 业务问题
个人用户需要一个简单的待办事项管理工具,支持任务分类(工作/学习)、优先级管理、截止日期设置,以便更有效地组织和跟踪日常任务。

### 当前状态
- 空白项目,无现有代码
- 用户在 todolist.md 中手动记录任务(无结构化管理)
- 缺少任务优先级、截止日期、完成状态跟踪

### 预期结果
用户打开浏览器访问应用后能够:
1. 添加任务并设置标题、描述、分类、优先级、截止日期
2. 编辑或删除已有任务
3. 标记任务为完成/未完成
4. 按分类筛选任务(工作/学习/全部)
5. 按优先级、截止日期或创建时间排序任务
6. 手动拖拽调整任务顺序
7. 刷新页面后数据保留(LocalStorage)
8. 切换亮色/暗色主题
9. 在桌面、平板、手机上正常使用

---

## 解决方案概述

### 方案
构建一个单页应用(SPA),使用 Vue 3 Composition API + TypeScript + Vite + Tailwind CSS,所有数据存储在浏览器 LocalStorage 中,无需后端服务器。

### 核心修改
1. 初始化 Vite + Vue 3 + TypeScript 项目
2. 配置 Tailwind CSS(含暗色模式)
3. 安装依赖:Pinia、VueDatePicker、VueDraggable Next
4. 实现 Pinia store 管理任务状态
5. 创建 LocalStorage 服务层
6. 开发 UI 组件:任务列表、任务卡片、添加/编辑表单、筛选栏、排序控制
7. 实现拖拽排序和自动排序逻辑
8. 实现暗色模式切换

### 成功标准
- 所有 CRUD 操作功能正常
- 任务数据在浏览器刷新后保留
- 拖拽排序流畅(延迟 < 100ms)
- 响应式布局在手机/平板/桌面正常显示
- Lighthouse 性能评分 > 90
- TypeScript 严格模式无类型错误
- 支持 1000+ 任务数据量

---

## 技术实现

### 1. 项目初始化

#### 1.1 创建 Vite 项目
```bash
npm create vite@latest . -- --template vue-ts
```

#### 1.2 安装依赖
```bash
# 核心依赖
npm install pinia
npm install @vuepic/vue-datepicker
npm install vuedraggable@next

# Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 工具库
npm install uuid
npm install -D @types/uuid

# 开发依赖
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier eslint-config-prettier eslint-plugin-vue
```

#### 1.3 目录结构
```
/srv/projects/todolist/
├── public/
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── TaskList.vue          # 任务列表容器
│   │   ├── TaskItem.vue           # 单个任务卡片
│   │   ├── TaskForm.vue           # 添加/编辑表单
│   │   ├── FilterBar.vue          # 筛选栏
│   │   ├── SortControls.vue       # 排序控制
│   │   └── EmptyState.vue         # 空状态提示
│   ├── stores/
│   │   └── taskStore.ts           # Pinia 任务状态管理
│   ├── services/
│   │   └── localStorage.ts        # LocalStorage 封装
│   ├── types/
│   │   └── task.ts                # TypeScript 类型定义
│   ├── utils/
│   │   ├── date.ts                # 日期工具函数
│   │   └── sort.ts                # 排序工具函数
│   ├── composables/
│   │   └── useTheme.ts            # 主题切换逻辑
│   ├── App.vue                    # 根组件
│   ├── main.ts                    # 入口文件
│   └── style.css                  # Tailwind 导入
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── .eslintrc.cjs
└── package.json
```

---

### 2. 配置文件

#### 2.1 vite.config.ts
```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'pinia'],
          'datepicker': ['@vuepic/vue-datepicker'],
          'draggable': ['vuedraggable']
        }
      }
    }
  }
})
```

#### 2.2 tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

#### 2.3 tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        priority: {
          high: '#ef4444',
          medium: '#f59e0b',
          low: '#10b981',
        }
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      }
    },
  },
  plugins: [],
}
```

#### 2.4 postcss.config.js
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

#### 2.5 .eslintrc.cjs
```javascript
module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:vue/vue3-recommended',
    'prettier',
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 2020,
    parser: '@typescript-eslint/parser',
    sourceType: 'module',
  },
  rules: {
    'vue/multi-word-component-names': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
}
```

---

### 3. TypeScript 类型定义

#### 文件:/srv/projects/todolist/src/types/task.ts
```typescript
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
```

---

### 4. LocalStorage 服务

#### 文件:/srv/projects/todolist/src/services/localStorage.ts
```typescript
import type { Task, SortMode, Theme, StorageData } from '@/types/task'

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
```

---

### 5. 工具函数

#### 文件:/srv/projects/todolist/src/utils/date.ts
```typescript
export function formatDate(dateString: string | undefined): string {
  if (!dateString) return ''

  try {
    const date = new Date(dateString)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    const diffDays = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return '今天'
    if (diffDays === 1) return '明天'
    if (diffDays === -1) return '昨天'

    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } catch {
    return ''
  }
}

export function isOverdue(dateString: string | undefined): boolean {
  if (!dateString) return false

  try {
    const date = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)

    return date < today
  } catch {
    return false
  }
}

export function toISODateString(date: Date | null | undefined): string | undefined {
  if (!date) return undefined

  try {
    return date.toISOString()
  } catch {
    return undefined
  }
}

export function fromISODateString(dateString: string | undefined): Date | null {
  if (!dateString) return null

  try {
    return new Date(dateString)
  } catch {
    return null
  }
}
```

#### 文件:/srv/projects/todolist/src/utils/sort.ts
```typescript
import type { Task, SortMode } from '@/types/task'

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }

export function sortTasks(tasks: Task[], mode: SortMode): Task[] {
  const sorted = [...tasks]

  switch (mode) {
    case 'manual':
      return sorted.sort((a, b) => a.order - b.order)

    case 'priority':
      return sorted.sort((a, b) => {
        const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
        if (priorityDiff !== 0) return priorityDiff
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })

    case 'dueDate':
      return sorted.sort((a, b) => {
        // 无截止日期排后面
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1

        const dateDiff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        if (dateDiff !== 0) return dateDiff
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      })

    case 'createdAt':
      return sorted.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

    default:
      return sorted
  }
}

export function reorderTasks(tasks: Task[]): Task[] {
  return tasks.map((task, index) => ({
    ...task,
    order: index
  }))
}
```

---

### 6. Pinia Store

#### 文件:/srv/projects/todolist/src/stores/taskStore.ts
```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import type { Task, TaskFilter, SortMode, TaskFormData, TaskCategory } from '@/types/task'
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
```

---

### 7. Composables

#### 文件:/srv/projects/todolist/src/composables/useTheme.ts
```typescript
import { ref, watch, onMounted } from 'vue'
import type { Theme } from '@/types/task'

const THEME_STORAGE_KEY = 'todolist_theme'

export function useTheme() {
  const theme = ref<Theme>('light')

  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement

    if (newTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    localStorage.setItem(THEME_STORAGE_KEY, newTheme)
  }

  const loadTheme = () => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null

    if (saved === 'light' || saved === 'dark') {
      theme.value = saved
    } else {
      // 检测系统偏好
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      theme.value = prefersDark ? 'dark' : 'light'
    }

    applyTheme(theme.value)
  }

  watch(theme, (newTheme) => {
    applyTheme(newTheme)
  })

  onMounted(() => {
    loadTheme()
  })

  return {
    theme,
    toggleTheme,
  }
}
```

---

### 8. 组件实现

#### 8.1 入口文件

##### 文件:/srv/projects/todolist/src/main.ts
```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
```

##### 文件:/srv/projects/todolist/src/style.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100;
  }
}

@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700
           focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
           disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
  }

  .btn-secondary {
    @apply px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100
           rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600
           focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2
           transition-colors;
  }

  .input-field {
    @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600
           rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
           focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
           disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .select-field {
    @apply input-field cursor-pointer;
  }

  .card {
    @apply bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
           rounded-lg shadow-sm;
  }
}
```

#### 8.2 根组件

##### 文件:/srv/projects/todolist/src/App.vue
```vue
<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'
import { useTaskStore } from '@/stores/taskStore'
import TaskList from '@/components/TaskList.vue'
import TaskForm from '@/components/TaskForm.vue'
import FilterBar from '@/components/FilterBar.vue'
import SortControls from '@/components/SortControls.vue'
import { ref } from 'vue'

const { theme, toggleTheme } = useTheme()
const taskStore = useTaskStore()
const showForm = ref(false)
const editingTaskId = ref<string | undefined>()

const handleAddTask = () => {
  showForm.value = true
  editingTaskId.value = undefined
}

const handleEditTask = (id: string) => {
  showForm.value = true
  editingTaskId.value = id
}

const handleFormClose = () => {
  showForm.value = false
  editingTaskId.value = undefined
}

const handleExport = () => {
  const data = taskStore.exportData()
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `todolist-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const handleImport = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'application/json'
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        taskStore.importData(content)
      }
      reader.readAsText(file)
    }
  }
  input.click()
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
              待办事项
            </h1>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {{ taskStore.activeTasks.length }} 个未完成任务
            </p>
          </div>

          <div class="flex items-center gap-3">
            <!-- 导出/导入 -->
            <button
              type="button"
              class="btn-secondary text-sm"
              @click="handleExport"
              aria-label="导出数据"
            >
              导出
            </button>
            <button
              type="button"
              class="btn-secondary text-sm"
              @click="handleImport"
              aria-label="导入数据"
            >
              导入
            </button>

            <!-- 主题切换 -->
            <button
              type="button"
              class="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              @click="toggleTheme"
              :aria-label="theme === 'light' ? '切换到暗色模式' : '切换到亮色模式'"
            >
              <svg v-if="theme === 'light'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </button>

            <!-- 添加任务按钮 -->
            <button
              type="button"
              class="btn-primary flex items-center gap-2"
              @click="handleAddTask"
              aria-label="添加新任务"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              <span class="hidden sm:inline">添加任务</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div class="space-y-6">
        <!-- 筛选栏 -->
        <FilterBar />

        <!-- 排序控制 -->
        <SortControls />

        <!-- 任务列表 -->
        <TaskList @edit-task="handleEditTask" />
      </div>
    </main>

    <!-- 任务表单弹窗 -->
    <TaskForm
      v-if="showForm"
      :task-id="editingTaskId"
      @close="handleFormClose"
    />
  </div>
</template>
```

#### 8.3 筛选栏组件

##### 文件:/srv/projects/todolist/src/components/FilterBar.vue
```vue
<script setup lang="ts">
import { useTaskStore } from '@/stores/taskStore'
import type { TaskCategory, FilterStatus } from '@/types/task'

const taskStore = useTaskStore()

const categories: { value: TaskCategory | undefined; label: string }[] = [
  { value: undefined, label: '全部分类' },
  { value: 'work', label: '工作' },
  { value: 'study', label: '学习' },
  { value: 'none', label: '无分类' },
]

const statuses: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '未完成' },
  { value: 'completed', label: '已完成' },
]

const handleCategoryChange = (category: TaskCategory | undefined) => {
  taskStore.setFilter({ category })
}

const handleStatusChange = (status: FilterStatus) => {
  taskStore.setFilter({ status })
}

const handleClearCompleted = () => {
  if (confirm('确定要删除所有已完成任务吗?')) {
    taskStore.clearCompleted()
  }
}
</script>

<template>
  <div class="card p-4">
    <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div class="flex flex-col sm:flex-row gap-4 flex-1">
        <!-- 分类筛选 -->
        <div class="flex items-center gap-2">
          <label for="category-filter" class="text-sm font-medium text-gray-700 dark:text-gray-300">
            分类:
          </label>
          <div class="flex gap-2">
            <button
              v-for="cat in categories"
              :key="cat.value || 'all'"
              type="button"
              class="px-3 py-1 text-sm rounded-lg transition-colors"
              :class="taskStore.filter.category === cat.value
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'"
              @click="handleCategoryChange(cat.value)"
            >
              {{ cat.label }}
              <span
                v-if="cat.value && taskStore.tasksByCategory[cat.value] > 0"
                class="ml-1 opacity-75"
              >
                ({{ taskStore.tasksByCategory[cat.value] }})
              </span>
            </button>
          </div>
        </div>

        <!-- 状态筛选 -->
        <div class="flex items-center gap-2">
          <label for="status-filter" class="text-sm font-medium text-gray-700 dark:text-gray-300">
            状态:
          </label>
          <div class="flex gap-2">
            <button
              v-for="status in statuses"
              :key="status.value"
              type="button"
              class="px-3 py-1 text-sm rounded-lg transition-colors"
              :class="taskStore.filter.status === status.value
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'"
              @click="handleStatusChange(status.value)"
            >
              {{ status.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- 清除已完成 -->
      <button
        v-if="taskStore.completedTasks.length > 0"
        type="button"
        class="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
        @click="handleClearCompleted"
      >
        清除已完成 ({{ taskStore.completedTasks.length }})
      </button>
    </div>
  </div>
</template>
```

#### 8.4 排序控制组件

##### 文件:/srv/projects/todolist/src/components/SortControls.vue
```vue
<script setup lang="ts">
import { useTaskStore } from '@/stores/taskStore'
import type { SortMode } from '@/types/task'

const taskStore = useTaskStore()

const sortModes: { value: SortMode; label: string; icon: string }[] = [
  { value: 'manual', label: '手动排序', icon: 'M4 6h16M4 12h16M4 18h16' },
  { value: 'priority', label: '优先级', icon: 'M5 3l3.057-3L11 3l3-3 3 3-3 3-3-3-2.943 3L5 3z' },
  { value: 'dueDate', label: '截止日期', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { value: 'createdAt', label: '创建时间', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
]

const handleSortChange = (mode: SortMode) => {
  taskStore.setSortMode(mode)
}
</script>

<template>
  <div class="card p-4">
    <div class="flex items-center gap-2">
      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
        排序:
      </span>
      <div class="flex gap-2 flex-wrap">
        <button
          v-for="mode in sortModes"
          :key="mode.value"
          type="button"
          class="px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-2"
          :class="taskStore.sortMode === mode.value
            ? 'bg-primary-600 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'"
          @click="handleSortChange(mode.value)"
          :aria-label="`按${mode.label}排序`"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="mode.icon" />
          </svg>
          {{ mode.label }}
        </button>
      </div>
    </div>

    <p
      v-if="taskStore.sortMode !== 'manual'"
      class="text-xs text-gray-500 dark:text-gray-400 mt-2"
    >
      自动排序模式下拖拽操作将被禁用
    </p>
  </div>
</template>
```

#### 8.5 任务列表组件

##### 文件:/srv/projects/todolist/src/components/TaskList.vue
```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useTaskStore } from '@/stores/taskStore'
import TaskItem from './TaskItem.vue'
import EmptyState from './EmptyState.vue'
import draggable from 'vuedraggable'
import type { Task } from '@/types/task'

const emit = defineEmits<{
  editTask: [id: string]
}>()

const taskStore = useTaskStore()

const isDraggable = computed(() => taskStore.sortMode === 'manual')

const handleDragEnd = (event: { newIndex: number; oldIndex: number }) => {
  // draggable 已经更新了数组顺序,只需保存
  taskStore.reorderTasksByDrag(taskStore.sortedTasks)
}

const handleToggleComplete = (id: string) => {
  taskStore.toggleTaskComplete(id)
}

const handleEdit = (id: string) => {
  emit('editTask', id)
}

const handleDelete = (id: string) => {
  if (confirm('确定要删除这个任务吗?')) {
    taskStore.deleteTask(id)
  }
}
</script>

<template>
  <div>
    <EmptyState v-if="taskStore.sortedTasks.length === 0" />

    <draggable
      v-else
      v-model="taskStore.sortedTasks"
      :disabled="!isDraggable"
      item-key="id"
      class="space-y-3"
      @end="handleDragEnd"
      handle=".drag-handle"
      ghost-class="opacity-50"
    >
      <template #item="{ element: task }">
        <TaskItem
          :task="task"
          :draggable="isDraggable"
          @toggle-complete="handleToggleComplete"
          @edit="handleEdit"
          @delete="handleDelete"
        />
      </template>
    </draggable>
  </div>
</template>
```

#### 8.6 任务卡片组件

##### 文件:/srv/projects/todolist/src/components/TaskItem.vue
```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { Task } from '@/types/task'
import { formatDate, isOverdue } from '@/utils/date'

const props = defineProps<{
  task: Task
  draggable: boolean
}>()

const emit = defineEmits<{
  toggleComplete: [id: string]
  edit: [id: string]
  delete: [id: string]
}>()

const priorityColors = {
  high: 'border-l-priority-high bg-red-50 dark:bg-red-950',
  medium: 'border-l-priority-medium bg-yellow-50 dark:bg-yellow-950',
  low: 'border-l-priority-low bg-green-50 dark:bg-green-950',
}

const categoryLabels = {
  work: '工作',
  study: '学习',
  none: '无分类',
}

const priorityLabels = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级',
}

const cardClass = computed(() => {
  return [
    'card p-4 border-l-4 transition-all hover:shadow-md',
    priorityColors[props.task.priority],
    props.task.completed && 'opacity-60',
  ].join(' ')
})

const isTaskOverdue = computed(() => isOverdue(props.task.dueDate))

const formattedDueDate = computed(() => formatDate(props.task.dueDate))
</script>

<template>
  <div :class="cardClass">
    <div class="flex items-start gap-3">
      <!-- 拖拽手柄 -->
      <button
        v-if="draggable"
        type="button"
        class="drag-handle mt-1 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-move"
        aria-label="拖拽排序"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
        </svg>
      </button>

      <!-- 完成复选框 -->
      <button
        type="button"
        class="mt-1 flex-shrink-0"
        @click="emit('toggleComplete', task.id)"
        :aria-label="task.completed ? '标记为未完成' : '标记为已完成'"
      >
        <div
          class="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
          :class="task.completed
            ? 'bg-primary-600 border-primary-600'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary-500'"
        >
          <svg
            v-if="task.completed"
            class="w-3 h-3 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </button>

      <!-- 任务内容 -->
      <div class="flex-1 min-w-0">
        <h3
          class="text-base font-medium"
          :class="task.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'"
        >
          {{ task.title }}
        </h3>

        <p
          v-if="task.description"
          class="mt-1 text-sm text-gray-600 dark:text-gray-400"
          :class="task.completed && 'line-through'"
        >
          {{ task.description }}
        </p>

        <!-- 元数据 -->
        <div class="mt-2 flex flex-wrap gap-2 text-xs">
          <!-- 分类 -->
          <span
            class="px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            {{ categoryLabels[task.category] }}
          </span>

          <!-- 优先级 -->
          <span
            class="px-2 py-1 rounded-full"
            :class="{
              'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300': task.priority === 'high',
              'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300': task.priority === 'medium',
              'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300': task.priority === 'low',
            }"
          >
            {{ priorityLabels[task.priority] }}
          </span>

          <!-- 截止日期 -->
          <span
            v-if="task.dueDate"
            class="px-2 py-1 rounded-full flex items-center gap-1"
            :class="isTaskOverdue && !task.completed
              ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 font-medium'
              : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {{ formattedDueDate }}
            <span v-if="isTaskOverdue && !task.completed">(已过期)</span>
          </span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex items-center gap-1 flex-shrink-0">
        <button
          type="button"
          class="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          @click="emit('edit', task.id)"
          aria-label="编辑任务"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>

        <button
          type="button"
          class="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          @click="emit('delete', task.id)"
          aria-label="删除任务"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
```

#### 8.7 空状态组件

##### 文件:/srv/projects/todolist/src/components/EmptyState.vue
```vue
<script setup lang="ts">
import { useTaskStore } from '@/stores/taskStore'

const taskStore = useTaskStore()

const hasFilters = () => {
  return taskStore.filter.category !== undefined || taskStore.filter.status !== 'all'
}
</script>

<template>
  <div class="card p-12 text-center">
    <svg
      class="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      />
    </svg>

    <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
      {{ hasFilters() ? '没有匹配的任务' : '还没有任务' }}
    </h3>

    <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
      {{ hasFilters() ? '尝试调整筛选条件' : '点击右上角"添加任务"按钮创建第一个任务' }}
    </p>
  </div>
</template>
```

#### 8.8 任务表单组件

##### 文件:/srv/projects/todolist/src/components/TaskForm.vue
```vue
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
```

---

### 9. HTML 入口文件

#### 文件:/srv/projects/todolist/index.html
```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="简洁的待办事项管理应用" />
    <meta name="theme-color" content="#0ea5e9" />
    <title>待办事项</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

---

## 实现顺序

### Phase 1: 项目初始化和配置
1. 创建 Vite + Vue 3 + TypeScript 项目
2. 安装所有依赖包
3. 配置 Tailwind CSS(包含暗色模式)
4. 配置 TypeScript 严格模式
5. 配置 ESLint 和 Prettier
6. 创建项目目录结构

**输出**: 完整的开发环境,可运行 `npm run dev`

### Phase 2: 核心基础设施
1. 创建 TypeScript 类型定义 (`src/types/task.ts`)
2. 实现 LocalStorage 服务 (`src/services/localStorage.ts`)
3. 实现工具函数 (`src/utils/date.ts`, `src/utils/sort.ts`)
4. 实现主题切换 Composable (`src/composables/useTheme.ts`)

**输出**: 可复用的服务层和工具函数

### Phase 3: 状态管理
1. 创建 Pinia store (`src/stores/taskStore.ts`)
2. 实现所有 CRUD 操作
3. 实现筛选和排序逻辑
4. 集成 LocalStorage 持久化

**输出**: 完整的状态管理系统

### Phase 4: UI 组件开发
1. 创建根组件 App.vue
2. 创建筛选栏组件 FilterBar.vue
3. 创建排序控制组件 SortControls.vue
4. 创建空状态组件 EmptyState.vue
5. 创建任务卡片组件 TaskItem.vue
6. 创建任务列表组件 TaskList.vue(集成拖拽)
7. 创建任务表单组件 TaskForm.vue(集成日期选择器)

**输出**: 完整的 UI 组件库

### Phase 5: 集成和测试
1. 集成所有组件到 App.vue
2. 测试所有 CRUD 操作
3. 测试筛选和排序功能
4. 测试拖拽排序
5. 测试暗色模式切换
6. 测试响应式布局(手机/平板/桌面)
7. 测试 LocalStorage 持久化
8. 测试数据导出/导入功能

**输出**: 功能完整的应用

### Phase 6: 优化和部署
1. 性能优化(代码分割、懒加载)
2. 可访问性检查(ARIA 标签、键盘导航)
3. 浏览器兼容性测试
4. Lighthouse 性能评分
5. 构建生产版本 (`npm run build`)
6. 部署到静态托管服务(Vercel/Netlify)

**输出**: 生产就绪的应用

---

## 验证计划

### 单元测试场景
1. **LocalStorage 服务**:
   - 保存和加载数据
   - 处理 QuotaExceededError
   - 处理损坏的 JSON 数据
   - 导出/导入功能

2. **工具函数**:
   - 日期格式化(今天/明天/昨天/具体日期)
   - 过期日期检测
   - ISO 日期字符串转换
   - 任务排序(手动/优先级/截止日期/创建时间)

3. **Pinia Store**:
   - 添加任务(生成 UUID、设置时间戳)
   - 更新任务(更新 updatedAt)
   - 删除任务
   - 切换完成状态
   - 筛选逻辑(分类/状态)
   - 排序逻辑
   - 拖拽重排序

### 集成测试场景
1. **任务生命周期**:
   - 添加任务 → 刷新页面 → 数据保留
   - 编辑任务 → 保存 → 更新成功
   - 删除任务 → 确认 → 任务移除
   - 完成任务 → 切换状态 → UI 更新

2. **筛选和排序**:
   - 切换分类筛选 → 列表更新
   - 切换状态筛选 → 显示对应任务
   - 切换排序模式 → 任务重新排序
   - 手动拖拽 → 保存顺序 → 刷新保留

3. **主题切换**:
   - 切换到暗色模式 → 保存偏好 → 刷新保留
   - 跟随系统主题

4. **表单验证**:
   - 空标题 → 显示错误
   - 超长标题/描述 → 显示错误
   - 过去日期 → 显示错误

### 业务逻辑验证
1. **任务添加**:
   - 打开表单 → 填写字段 → 提交 → 任务出现在列表顶部
   - 默认优先级为中,默认分类为无分类

2. **任务编辑**:
   - 点击编辑按钮 → 表单预填数据 → 修改 → 保存 → 任务更新

3. **任务删除**:
   - 点击删除按钮 → 确认对话框 → 确认 → 任务从列表消失

4. **完成状态**:
   - 点击复选框 → 任务标记为已完成 → 文本划线,卡片半透明
   - 再次点击 → 恢复未完成状态

5. **筛选功能**:
   - 点击"工作"分类 → 仅显示工作任务
   - 点击"已完成"状态 → 仅显示已完成任务

6. **排序功能**:
   - 切换到"优先级"排序 → 高优先级在前
   - 切换到"截止日期"排序 → 最近截止在前
   - 切换回"手动排序" → 可拖拽调整顺序

7. **过期提示**:
   - 创建过期任务 → 显示红色高亮和"已过期"标签

8. **数据导出/导入**:
   - 点击导出 → 下载 JSON 文件
   - 点击导入 → 选择文件 → 数据恢复

9. **空状态**:
   - 无任务时 → 显示引导提示
   - 筛选无结果时 → 显示"没有匹配的任务"

10. **LocalStorage 满**:
    - 模拟存储满 → 显示警告对话框

### 性能验证
1. **加载时间**: 首次加载 < 2 秒
2. **大数据量**: 添加 1000 个任务 → 列表流畅滚动
3. **拖拽性能**: 拖拽延迟 < 100ms
4. **存储大小**: 1000 任务 < 5MB

### 可访问性验证
1. **键盘导航**: Tab/Enter/Esc 正常工作
2. **屏幕阅读器**: ARIA 标签完整
3. **颜色对比度**: WCAG 2.1 AA 达标
4. **焦点管理**: 表单打开/关闭焦点正确

### 响应式验证
1. **桌面**: ≥1024px → 正常布局
2. **平板**: 768px-1023px → 自适应布局
3. **手机**: <768px → 移动优化布局

---

## 错误处理策略

### 1. 输入验证错误
**触发条件**: 表单提交时字段不符合要求

**处理**:
- 在字段下方显示红色错误提示
- 阻止表单提交
- 聚焦到第一个错误字段

**示例**:
```typescript
if (!formData.value.title.trim()) {
  errors.value.title = '任务标题不能为空'
}
```

### 2. LocalStorage 错误
**触发条件**: 存储空间不足或浏览器禁用 LocalStorage

**处理**:
- 捕获 `QuotaExceededError`
- 显示 alert 提示用户清理数据
- 降级到内存存储(可选)

**示例**:
```typescript
try {
  localStorage.setItem(key, data)
} catch (error) {
  if (isQuotaExceeded(error)) {
    alert('存储空间不足,请删除部分已完成任务或导出数据')
  }
}
```

### 3. JSON 解析错误
**触发条件**: LocalStorage 数据损坏或导入无效 JSON

**处理**:
- 使用 try-catch 包裹 JSON.parse
- 返回空数组作为默认值
- 记录错误到 console

**示例**:
```typescript
try {
  return JSON.parse(data)
} catch (error) {
  console.error('Failed to parse JSON:', error)
  return { tasks: [], sortMode: 'manual', theme: 'light' }
}
```

### 4. 日期解析错误
**触发条件**: 无效的日期字符串

**处理**:
- 返回 null 或空字符串
- 不显示日期标签

**示例**:
```typescript
export function formatDate(dateString: string | undefined): string {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleDateString('zh-CN')
  } catch {
    return ''
  }
}
```

### 5. 拖拽失败
**触发条件**: 拖拽操作中断或异常

**处理**:
- VueDraggable 自动回退到原始位置
- 不需要额外处理

### 6. 导入失败
**触发条件**: 导入的 JSON 格式无效

**处理**:
- 验证数据结构
- 显示 alert 错误提示
- 不修改现有数据

**示例**:
```typescript
importData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString)
    if (!Array.isArray(data.tasks)) {
      throw new Error('Invalid data format')
    }
    return this.save(data)
  } catch (error) {
    alert('导入失败:数据格式无效')
    return false
  }
}
```

---

## 可访问性要求

### 1. 语义化 HTML
- 使用 `<header>`, `<main>`, `<button>`, `<form>` 等语义标签
- 避免使用 `<div>` 模拟按钮

### 2. ARIA 标签
- 所有按钮包含 `aria-label` 或可见文本
- 表单错误使用 `aria-invalid` 和 `aria-describedby`
- 模态框使用 `role="dialog"`

**示例**:
```vue
<button
  type="button"
  aria-label="切换到暗色模式"
  @click="toggleTheme"
>
  <svg>...</svg>
</button>
```

### 3. 键盘导航
- 所有交互元素支持 Tab 聚焦
- Enter 提交表单
- Esc 关闭模态框

### 4. 颜色对比度
- 文本与背景对比度 ≥ 4.5:1
- 大文本对比度 ≥ 3:1
- 使用 Tailwind 预设颜色确保达标

### 5. 焦点管理
- 打开模态框时聚焦到第一个输入框
- 关闭模态框时聚焦回触发按钮
- 焦点可见(outline 或 ring)

### 6. 屏幕阅读器
- 图标按钮包含文本描述
- 动态内容更新使用 live regions(可选)

---

## 部署配置

### 1. 构建生产版本
```bash
npm run build
```

输出目录: `/srv/projects/todolist/dist/`

### 2. 静态文件结构
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── vendor-[hash].js
└── vite.svg
```

### 3. 部署到 Vercel
```bash
npm install -g vercel
vercel --prod
```

配置文件 `vercel.json` (可选):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### 4. 部署到 Netlify
1. 连接 GitHub 仓库
2. 设置构建命令: `npm run build`
3. 设置发布目录: `dist`
4. 部署

### 5. Nginx 配置(自托管)
```nginx
server {
  listen 80;
  server_name todolist.example.com;
  root /var/www/todolist/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  gzip on;
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

### 6. 环境变量(无需配置)
此应用无需环境变量,所有数据存储在浏览器本地。

---

## 性能优化

### 1. 代码分割
- Vite 自动分割 vendor 和业务代码
- 日期选择器和拖拽库独立 chunk

### 2. 懒加载
- 组件按需加载(当前实现为同步加载,数据量小无需优化)

### 3. 虚拟滚动(可选)
如果任务数 > 500,集成 `vue-virtual-scroller`:
```bash
npm install vue-virtual-scroller
```

### 4. 防抖和节流
- LocalStorage 保存操作已内置防抖(每次操作立即保存,无需额外优化)
- 搜索功能(如果添加)使用防抖

### 5. 资源压缩
- Vite 自动压缩 JS/CSS
- 图片使用 WebP 格式
- 启用 Gzip/Brotli 压缩

### 6. 缓存策略
- 静态资源设置长缓存(1 年)
- index.html 设置短缓存(5 分钟)

---

## 技术约束

### 必须遵守
1. **TypeScript 严格模式**: 所有代码无类型错误
2. **Composition API**: 禁止使用 Options API
3. **Tailwind Utility Classes**: 避免自定义 CSS
4. **LocalStorage 前缀**: 所有 key 使用 `todolist_` 前缀
5. **单一职责**: 每个函数/组件只做一件事
6. **最大缩进**: 3 层以内

### 禁止使用
1. **Options API**: 统一使用 Composition API
2. **内联样式**: 使用 Tailwind classes
3. **any 类型**: 使用具体类型或 unknown
4. **魔法数字**: 使用命名常量
5. **全局状态**: 使用 Pinia store

---

## 文件清单

### 配置文件(7 个)
1. `/srv/projects/todolist/package.json`
2. `/srv/projects/todolist/vite.config.ts`
3. `/srv/projects/todolist/tsconfig.json`
4. `/srv/projects/todolist/tailwind.config.js`
5. `/srv/projects/todolist/postcss.config.js`
6. `/srv/projects/todolist/.eslintrc.cjs`
7. `/srv/projects/todolist/index.html`

### 源代码文件(18 个)
1. `/srv/projects/todolist/src/main.ts`
2. `/srv/projects/todolist/src/style.css`
3. `/srv/projects/todolist/src/App.vue`
4. `/srv/projects/todolist/src/types/task.ts`
5. `/srv/projects/todolist/src/services/localStorage.ts`
6. `/srv/projects/todolist/src/utils/date.ts`
7. `/srv/projects/todolist/src/utils/sort.ts`
8. `/srv/projects/todolist/src/composables/useTheme.ts`
9. `/srv/projects/todolist/src/stores/taskStore.ts`
10. `/srv/projects/todolist/src/components/TaskList.vue`
11. `/srv/projects/todolist/src/components/TaskItem.vue`
12. `/srv/projects/todolist/src/components/TaskForm.vue`
13. `/srv/projects/todolist/src/components/FilterBar.vue`
14. `/srv/projects/todolist/src/components/SortControls.vue`
15. `/srv/projects/todolist/src/components/EmptyState.vue`

**总计**: 25 个文件

---

## 依赖清单

### 运行时依赖
```json
{
  "vue": "^3.4.0",
  "pinia": "^2.1.7",
  "@vuepic/vue-datepicker": "^8.0.0",
  "vuedraggable": "^4.1.0",
  "uuid": "^9.0.1"
}
```

### 开发依赖
```json
{
  "@vitejs/plugin-vue": "^5.0.0",
  "vite": "^5.0.0",
  "typescript": "^5.3.0",
  "@types/uuid": "^9.0.7",
  "tailwindcss": "^3.4.0",
  "postcss": "^8.4.32",
  "autoprefixer": "^10.4.16",
  "eslint": "^8.55.0",
  "@typescript-eslint/parser": "^6.15.0",
  "@typescript-eslint/eslint-plugin": "^6.15.0",
  "eslint-plugin-vue": "^9.19.2",
  "eslint-config-prettier": "^9.1.0",
  "prettier": "^3.1.1"
}
```

---

## 风险和限制

### 技术风险
1. **LocalStorage 限制**: 5-10MB 存储上限
   - **缓解**: 实现存储大小检查,超过 80% 时警告

2. **浏览器兼容性**: 老版本浏览器不支持某些 ES2020 特性
   - **缓解**: Vite 自动转译,目标浏览器已覆盖

3. **数据丢失**: 用户清除浏览器缓存导致数据丢失
   - **缓解**: 提供导出功能,定期提醒备份

### 功能限制
1. **单设备**: 无跨设备同步
2. **无协作**: 单用户使用
3. **无搜索**: 未实现任务搜索功能(可后续添加)
4. **无提醒**: 无截止日期提醒通知

### 性能限制
1. **大数据量**: 超过 1000 任务可能影响性能
   - **缓解**: 建议用户定期清理已完成任务

---

## 后续优化方向(可选)

### P3 功能
1. **任务搜索**: 按标题/描述搜索
2. **键盘快捷键**: Ctrl+N 添加任务,Ctrl+F 搜索
3. **多标签页同步**: 使用 storage 事件
4. **任务统计**: 完成率、分类分布图表
5. **重复任务**: 每日/每周重复
6. **子任务**: 嵌套任务结构
7. **标签系统**: 多标签分类
8. **附件上传**: 支持图片/文件附件

### 技术优化
1. **PWA**: Service Worker 离线支持
2. **IndexedDB**: 替换 LocalStorage 支持更大数据
3. **虚拟滚动**: 优化大数据量渲染
4. **国际化**: i18n 多语言支持
5. **单元测试**: Vitest 测试覆盖率 > 90%
6. **E2E 测试**: Playwright 端到端测试

---

**规格文档结束**

此文档包含所有实现待办事项应用所需的技术细节,可直接用于代码生成和开发。所有文件路径、函数签名、数据结构、配置参数均已明确指定,无需额外的架构设计决策。
