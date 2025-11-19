// 活动类型
export type ActivityType = 'work' | 'study' | 'other'

// 重复规则
export type RecurrencePattern = 'none' | 'daily' | 'weekdays' | 'weekends' | 'weekly'

// 主题
export type Theme = 'light' | 'dark'

// 时间段
export interface TimeBlock {
  id: string                       // UUID
  date: string                     // 日期 YYYY-MM-DD
  startTime: string                // 开始时间 HH:mm
  endTime: string                  // 结束时间 HH:mm
  activityType: ActivityType       // 活动类型
  description: string              // 具体描述
  recurrence: RecurrencePattern    // 重复规则
  recurrenceEndDate?: string       // 重复结束日期 YYYY-MM-DD (可选)
  sourceBlockId?: string           // 来源时间段ID(循环生成的记录引用原始ID)
  createdAt: string                // 创建时间 ISO 8601
  updatedAt: string                // 更新时间 ISO 8601
}

// 时间段表单数据
export interface TimeBlockFormData {
  startTime: string                // HH:mm
  endTime: string                  // HH:mm
  activityType: ActivityType
  description: string
  recurrence: RecurrencePattern
  recurrenceEndDate?: Date | null
}

// 应用状态
export interface AppState {
  timeBlocks: TimeBlock[]          // 所有时间段
  currentDate: string              // 当前查看的日期 YYYY-MM-DD
  theme: Theme
}

// 存储数据
export interface StorageData {
  timeBlocks: TimeBlock[]
  theme: Theme
}

// 活动类型元数据
export interface ActivityTypeMeta {
  label: string
  color: string                    // Tailwind 颜色类
  bgColor: string
  borderColor: string
}

// 活动类型映射
export const ACTIVITY_TYPE_META: Record<ActivityType, ActivityTypeMeta> = {
  work: {
    label: '工作',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-l-blue-500'
  },
  study: {
    label: '学习',
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-l-green-500'
  },
  other: {
    label: '其他',
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    borderColor: 'border-l-gray-500'
  }
}

// 重复规则元数据
export interface RecurrencePatternMeta {
  label: string
  description: string
}

export const RECURRENCE_PATTERN_META: Record<RecurrencePattern, RecurrencePatternMeta> = {
  none: {
    label: '不重复',
    description: '仅在当天有效'
  },
  daily: {
    label: '每天',
    description: '每天重复此时间段'
  },
  weekdays: {
    label: '工作日',
    description: '周一到周五重复'
  },
  weekends: {
    label: '周末',
    description: '周六和周日重复'
  },
  weekly: {
    label: '每周',
    description: '每周同一天重复'
  }
}
