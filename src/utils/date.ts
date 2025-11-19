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
