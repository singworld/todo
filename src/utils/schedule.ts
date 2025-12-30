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

/**
 * 获取指定日期所在周的周一
 * @param date 任意日期
 * @returns 该周的周一（Date 对象）
 */
export function getWeekStartMonday(date: Date): Date {
  const result = new Date(date)
  const day = result.getDay()
  const diff = day === 0 ? -6 : 1 - day
  result.setDate(result.getDate() + diff)
  return result
}

/**
 * 获取指定日期所在周的所有日期（周一到周日）
 * @param date 任意日期
 * @returns 包含7天的 Date 数组（周一到周日）
 */
export function getWeekDates(date: Date): Date[] {
  const monday = getWeekStartMonday(date)
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday)
    day.setDate(monday.getDate() + i)
    return day
  })
}

/**
 * 时间转分钟数 (HH:MM -> 分钟)
 * 包含防御性检查,非法输入返回 0
 */
export function timeToMinutes(time: string): number {
  const parts = time.split(':')
  if (parts.length !== 2) return 0

  const hours = parseInt(parts[0], 10)
  const minutes = parseInt(parts[1], 10)

  if (isNaN(hours) || isNaN(minutes)) return 0
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return 0

  return hours * 60 + minutes
}

/**
 * 分钟数转时间字符串
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * 检测两个时间段是否重叠
 */
export function isOverlapping(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = timeToMinutes(start1)
  const e1 = timeToMinutes(end1)
  const s2 = timeToMinutes(start2)
  const e2 = timeToMinutes(end2)
  return s1 < e2 && s2 < e1
}

/**
 * 计算时间段的布局信息 (处理重叠显示)
 *
 * 算法思路:
 * 1. 按开始时间排序所有时间段
 * 2. 使用贪心策略为每个时间段分配列位置
 * 3. 对于每个时间段,找出所有与其重叠的已布局时间段
 * 4. 分配第一个未被占用的列号
 * 5. 动态更新重叠组的总列数,确保所有重叠时间段共享相同的列数
 *
 * 时间复杂度: O(n^2) - 每个时间段需要检查已处理的时间段
 * 空间复杂度: O(n) - 存储所有布局信息
 *
 * 边界情况:
 * - 空数组: 返回空数组
 * - 无重叠: 所有时间段 column=0, totalColumns=1
 * - 完全重叠: 多个时间段并排显示,totalColumns = 重叠数量
 */
export interface TimeBlockLayout {
  block: TimeBlock
  column: number
  totalColumns: number
}

export function calculateTimeBlockLayouts(blocks: TimeBlock[]): TimeBlockLayout[] {
  if (blocks.length === 0) return []

  // 按开始时间排序
  const sorted = [...blocks].sort((a, b) =>
    timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  )

  // 存储每个时间段的布局信息
  const layouts: TimeBlockLayout[] = []

  // 贪心算法: 为每个时间段分配列
  for (const block of sorted) {
    // 找到所有与当前块重叠的块
    const overlapping = layouts.filter(layout =>
      isOverlapping(
        block.startTime,
        block.endTime,
        layout.block.startTime,
        layout.block.endTime
      )
    )

    if (overlapping.length === 0) {
      // 无重叠, 放在第0列
      layouts.push({ block, column: 0, totalColumns: 1 })
    } else {
      // 有重叠, 找到第一个可用的列
      const usedColumns = new Set(overlapping.map(o => o.column))
      let column = 0
      while (usedColumns.has(column)) {
        column++
      }

      // 更新总列数
      const maxColumns = Math.max(column + 1, ...overlapping.map(o => o.totalColumns))
      overlapping.forEach(o => { o.totalColumns = maxColumns })

      layouts.push({ block, column, totalColumns: maxColumns })
    }
  }

  return layouts
}

/**
 * 查找当天第一个空闲时段
 * @param blocks 当天的所有时间段
 * @param workStart 工作开始时间 (分钟)
 * @param workEnd 工作结束时间 (分钟)
 * @param duration 期望的时段长度 (分钟), 默认60分钟
 * @returns { startTime, endTime } 或 null
 */
export function findFirstFreeSlot(
  blocks: TimeBlock[],
  workStart: number = 10 * 60,  // 10:00
  workEnd: number = 18 * 60,    // 18:00
  duration: number = 60
): { startTime: string; endTime: string } | null {
  if (blocks.length === 0) {
    // 没有任何时间段, 返回工作开始时间
    return {
      startTime: minutesToTime(workStart),
      endTime: minutesToTime(workStart + duration)
    }
  }

  // 按开始时间排序
  const sorted = [...blocks].sort((a, b) =>
    timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  )

  // 尝试从工作开始时间开始找空闲
  let currentTime = workStart

  for (const block of sorted) {
    const blockStart = timeToMinutes(block.startTime)
    const blockEnd = timeToMinutes(block.endTime)

    // 如果当前位置到下一个块之间有足够空间
    if (currentTime + duration <= blockStart) {
      return {
        startTime: minutesToTime(currentTime),
        endTime: minutesToTime(currentTime + duration)
      }
    }

    // 移动到当前块结束后
    currentTime = Math.max(currentTime, blockEnd)
  }

  // 检查最后一个块之后是否有空间
  if (currentTime + duration <= workEnd) {
    return {
      startTime: minutesToTime(currentTime),
      endTime: minutesToTime(currentTime + duration)
    }
  }

  // 没有找到合适的空闲时段
  return null
}
