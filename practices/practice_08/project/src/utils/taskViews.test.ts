import { expect, test } from 'vitest'
import type { Task } from '../types'
import { tasksForView } from './taskViews'

const tasks: Task[] = [
  ['previous-sunday', '2025-12-28'], ['monday', '2025-12-29'], ['tuesday', '2025-12-30'],
  ['wednesday', '2025-12-31'], ['thursday', '2026-01-01'], ['friday', '2026-01-02'],
  ['sunday', '2026-01-04'], ['next-monday', '2026-01-05'], ['done', '2025-12-29'],
].map(([id, dueDate]) => ({
  id, title: id, dueDate, completed: id === 'done', subject: 'Math',
  description: '', createdAt: '2025-12-27T12:00:00Z', priority: 'medium',
}))

test.each([
  ['overview', '2025-12-29', ['monday', 'tuesday', 'wednesday', 'thursday']],
  ['today', '2025-12-29', ['monday']],
  ['week', '2026-01-04', ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'sunday']],
  ['week', '2026-01-05', ['next-monday']],
  ['completed', '2026-01-05', ['done']],
] as const)('%s selects matching tasks on %s', (view, today, ids) => {
  expect(tasksForView(tasks, view, today).map((task) => task.id)).toEqual(ids)
})
