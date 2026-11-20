import type { Task } from '../types'
import { filterTasks } from './taskFilters'

export type TaskView = 'overview' | 'today' | 'week' | 'completed'

export function tasksForView(tasks: Task[], view: TaskView, today: string): Task[] {
  if (view === 'overview') {
    // Date-only strings parse at UTC midnight, so daylight-saving changes never shorten this window.
    const lastDay = new Date(today)
    lastDay.setUTCDate(lastDay.getUTCDate() + 3)
    return tasks.filter((task) => !task.completed && task.dueDate >= today && Date.parse(task.dueDate) <= lastDay.getTime())
  }
  return filterTasks(tasks, {
    priority: 'all',
    due: view === 'completed' ? 'all' : view,
    status: view === 'completed' ? 'completed' : 'active',
  }, today)
}
