import type { Task } from '../types'

export const options = {
  priority: { all: 'Любой приоритет', low: 'Низкий', medium: 'Средний', high: 'Высокий' },
  status: { all: 'Все статусы', active: 'В работе', completed: 'Выполнена' },
  due: { all: 'Любая дата', overdue: 'Просроченные', today: 'Сегодня', week: 'На этой неделе' },
} as const

export type Filters = { [Key in keyof typeof options]: keyof (typeof options)[Key] }

function readOption<K extends keyof Filters>(params: URLSearchParams, key: K): Filters[K] {
  const value = params.get(key)
  return value && Object.hasOwn(options[key], value) ? value as Filters[K] : 'all'
}

export function readFilters(params: URLSearchParams): Filters {
  return {
    priority: readOption(params, 'priority'),
    status: readOption(params, 'status'),
    due: readOption(params, 'due'),
  }
}

export function filterTasks(tasks: Task[], { priority, status, due }: Filters, today: string): Task[] {
  const date = new Date(today)
  const day = 86_400_000
  const monday = date.getTime() - ((date.getUTCDay() + 6) % 7) * day
  return tasks.filter((task) => {
    if (priority !== 'all' && task.priority !== priority) return false
    if (status !== 'all' && task.completed !== (status === 'completed')) return false
    switch (due) {
      case 'overdue': return task.dueDate < today
      case 'today': return task.dueDate === today
      case 'week': {
        const timestamp = Date.parse(task.dueDate)
        return timestamp >= monday && timestamp < monday + 7 * day
      }
      case 'all': return true
    }
  })
}
