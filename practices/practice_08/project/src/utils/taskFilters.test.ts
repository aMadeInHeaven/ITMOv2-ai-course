import { expect, test } from 'vitest'
import type { Task } from '../types'
import { filterTasks } from './taskFilters'

const calendar = [
  ['2025-12-28', 'high', false], ['2025-12-29', 'medium', false],
  ['2026-01-01', 'low', true], ['2026-01-04', 'low', false],
  ['2026-01-05', 'high', true],
] as const
const tasks: Task[] = calendar.map(([dueDate, priority, completed], index) => ({
  id: String(index), dueDate, priority, completed, title: 'Study', subject: 'Math', description: '',
  createdAt: '2025-12-27T12:00:00Z',
}))

test.each([
  ['all', ['0', '1', '2', '3', '4']], ['overdue', ['0', '1']],
  ['today', ['2']], ['week', ['1', '2', '3']],
] as const)('matches the %s period across ISO week and year boundaries', (due, ids) => {
  expect(filterTasks(tasks, { due, priority: 'all', status: 'all' }, '2026-01-01').map(t => t.id)).toEqual(ids)
})

test.each([
  ['high', 'completed', ['4']], ['medium', 'active', ['1']], ['low', 'completed', ['2']],
] as const)('intersects priority %s with status %s', (priority, status, ids) => {
  expect(filterTasks(tasks, { due: 'all', priority, status }, '2026-01-01').map(t => t.id)).toEqual(ids)
})
