import type { TimeBlock } from '@/types/schedule'

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 解析 YYYY-MM-DD 格式字符串为 Date
 */
export function parseDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * 获取今天的日期字符串
 */
export function getToday(): string {
  return formatDate(new Date())
}

/**
 * 获取日期的星期几 (0=周日, 1=周一, ..., 6=周六)
 */
export function getDayOfWeek(dateString: string): number {
  return parseDate(dateString).getDay()
}

/**
 * 判断日期是否为工作日 (周一到周五)
 */
export function isWeekday(dateString: string): boolean {
  const day = getDayOfWeek(dateString)
  return day >= 1 && day <= 5
}

/**
 * 判断日期是否为周末 (周六、周日)
 */
export function isWeekend(dateString: string): boolean {
  const day = getDayOfWeek(dateString)
  return day === 0 || day === 6
}

/**
 * 日期加减天数
 */
export function addDays(dateString: string, days: number): string {
  const date = parseDate(dateString)
  date.setDate(date.getDate() + days)
  return formatDate(date)
}

/**
 * 获取昨天的日期
 */
export function getYesterday(dateString: string): string {
  return addDays(dateString, -1)
}

/**
 * 获取明天的日期
 */
export function getTomorrow(dateString: string): string {
  return addDays(dateString, 1)
}

/**
 * 比较两个日期字符串
 * @returns 负数: date1 < date2, 0: date1 === date2, 正数: date1 > date2
 */
export function compareDates(date1: string, date2: string): number {
  return parseDate(date1).getTime() - parseDate(date2).getTime()
}

/**
 * 判断日期是否在范围内 (包含边界)
 */
export function isDateInRange(date: string, startDate: string, endDate?: string): boolean {
  if (compareDates(date, startDate) < 0) return false
  if (endDate && compareDates(date, endDate) > 0) return false
  return true
}

/**
 * 判断时间段是否应该在指定日期出现(根据重复规则)
 */
export function shouldTimeBlockAppear(
  timeBlock: TimeBlock,
  targetDate: string
): boolean {
  const { date: originalDate, recurrence, recurrenceEndDate } = timeBlock

  // 检查是否在重复结束日期之前
  if (recurrenceEndDate && compareDates(targetDate, recurrenceEndDate) > 0) {
    return false
  }

  // 如果目标日期是原始日期,总是显示
  if (targetDate === originalDate) {
    return true
  }

  // 如果目标日期早于原始日期,不显示
  if (compareDates(targetDate, originalDate) < 0) {
    return false
  }

  // 根据重复规则判断
  switch (recurrence) {
    case 'none':
      return targetDate === originalDate

    case 'daily':
      return true

    case 'weekdays':
      return isWeekday(targetDate)

    case 'weekends':
      return isWeekend(targetDate)

    case 'weekly': {
      // 每周同一天
      const originalDay = getDayOfWeek(originalDate)
      const targetDay = getDayOfWeek(targetDate)
      return originalDay === targetDay
    }

    default:
      return false
  }
}

/**
 * 获取指定日期应该显示的所有时间段(包括重复生成的)
 */
export function getTimeBlocksForDate(
  allTimeBlocks: TimeBlock[],
  targetDate: string
): TimeBlock[] {
  // 1. 找出该日期的所有独立副本(sourceBlockId存在)
  const independentCopies = allTimeBlocks.filter(
    block => block.date === targetDate && block.sourceBlockId
  )

  // 2. 提取被覆盖的原始时间段ID集合
  const overriddenSourceIds = new Set(
    independentCopies.map(copy => copy.sourceBlockId).filter(Boolean) as string[]
  )

  // 3. 过滤并生成时间段列表
  return allTimeBlocks
    .filter(block => {
      // 3.1 独立副本直接保留(date === targetDate)
      if (block.date === targetDate && block.sourceBlockId) {
        return true
      }

      // 3.2 对于原始时间段,如果已有独立副本则跳过
      if (!block.sourceBlockId && overriddenSourceIds.has(block.id)) {
        return false
      }

      // 3.3 其他按重复规则判断
      return shouldTimeBlockAppear(block, targetDate)
    })
    .map(block => {
      // 对于重复时间段在非原始日期,创建虚拟实例
      if (block.date !== targetDate && !block.sourceBlockId) {
        return {
          ...block,
          date: targetDate,
          sourceBlockId: block.id
        }
      }
      return block
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
}

/**
 * 格式化日期为友好显示 (今天/昨天/明天/具体日期)
 */
export function formatDateFriendly(dateString: string): string {
  const today = getToday()

  if (dateString === today) {
    return '今天'
  }

  if (dateString === getYesterday(today)) {
    return '昨天'
  }

  if (dateString === getTomorrow(today)) {
    return '明天'
  }

  const date = parseDate(dateString)
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekday = weekdays[date.getDay()]

  return `${month}月${day}日 ${weekday}`
}

/**
 * 清理过期数据 (保留最近7天)
 */
export function cleanupOldTimeBlocks(timeBlocks: TimeBlock[]): TimeBlock[] {
  const today = getToday()
  const sevenDaysAgo = addDays(today, -7)

  return timeBlocks.filter(block => {
    // 保留有重复规则的时间段
    if (block.recurrence !== 'none') {
      return true
    }

    // 保留最近7天的时间段
    return compareDates(block.date, sevenDaysAgo) >= 0
  })
}
