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
