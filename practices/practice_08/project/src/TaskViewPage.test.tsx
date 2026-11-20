import { screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { renderApp } from './test/renderApp'
import { server } from './test/server'
import type { Task } from './types'

const tasks: Task[] = [
  ['Monday', '2025-12-29'], ['Today', '2026-01-01'], ['Sunday', '2026-01-04'],
  ['Next week', '2026-01-05'], ['Finished', '2026-01-01'],
].map(([title, dueDate]) => ({
  id: title, title, dueDate, completed: title === 'Finished', priority: 'low',
  subject: 'Math', description: '', createdAt: '2025-12-28T12:00:00Z',
}))

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 0, 1, 0, 15))
})
afterEach(() => vi.useRealTimers())

test.each([
  { path: '/', titles: ['Today', 'Sunday'] },
  { path: '/today', titles: ['Today'] },
  { path: '/week', titles: ['Monday', 'Today', 'Sunday'] },
  { path: '/completed', titles: ['Finished'] },
])('$path shows matching task cards with links to the details', async ({ path, titles }) => {
  server.use(http.get('*/api/tasks', () => HttpResponse.json({ tasks })))
  renderApp(path)

  const main = within(screen.getByRole('main'))
  const lists = await main.findAllByRole('list')
  expect(lists.flatMap(list => within(list).getAllByRole('link').map(link => link.textContent))).toEqual(titles)
  if (path === '/') {
    expect(within(main.getByRole('region', { name: 'Сегодня' })).getByRole('link', { name: 'Today' })).toBeVisible()
    expect(within(main.getByRole('region', { name: 'Далее на неделе' })).getByRole('link', { name: 'Sunday' })).toBeVisible()
  }
  for (const title of titles) {
    expect(main.getByRole('link', { name: title })).toHaveAttribute('href', '/tasks/' + title)
  }
})

test.each(['/', '/today', '/week', '/completed'])('%s announces when no task matches', async (path) => {
  server.use(http.get('*/api/tasks', () => HttpResponse.json({ tasks: [tasks[3]] })))
  renderApp(path)

  expect(await screen.findByRole('status')).toHaveTextContent(/задач.*нет/i)
  expect(screen.queryByRole('link', { name: 'Next week' })).not.toBeInTheDocument()
})

test.each(['/', '/today', '/week', '/completed', '/tasks?status=active'])('%s summarizes all tasks, today and completed', async path => {
  server.use(http.get('*/api/tasks', () => HttpResponse.json({ tasks })))
  renderApp(path)
  const summary = within(await screen.findByRole('region', { name: 'Сводка задач' }))
  for (const [label, value] of [['Всего задач', 5], ['На сегодня', 1], ['Выполнено', 1]] as const) {
    expect(summary.getByText(label).nextElementSibling).toHaveTextContent(String(value))
  }
})
