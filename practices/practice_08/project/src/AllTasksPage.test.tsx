import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, expect, test } from 'vitest'
import { renderApp } from './test/renderApp'
import { server } from './test/server'

const first = {
  id: 'a', title: 'Vectors', subject: 'Math', dueDate: '2000-01-01', priority: 'high',
  completed: false, description: 'Read the chapter.', createdAt: '1999-12-31T12:00:00Z',
}
const tasks = [
  first,
  { ...first, id: 'b', title: 'Statistics', priority: 'low', completed: true },
  { ...first, id: 'c', title: 'Kinematics', subject: 'Physics', dueDate: '9999-01-01' },
]

beforeEach(() => {
  server.use(
    http.get('*/api/tasks', () => HttpResponse.json({ tasks })),
    http.get('*/api/tasks/a', () => HttpResponse.json({ task: first })),
  )
})

test('opens All tasks from the dashboard and groups every card under its subject', async () => {
  const user = userEvent.setup()
  renderApp()
  await user.click(await screen.findByRole('link', { name: /все задачи/i }))
  const math = await screen.findByRole('region', { name: 'Math' })
  expect(within(math).getAllByRole('link')).toHaveLength(2)
  expect(within(math).getByRole('link', { name: 'Vectors' })).toBeVisible()
  const physics = screen.getByRole('region', { name: 'Physics' })
  expect(within(physics).getByRole('link', { name: 'Kinematics' })).toBeVisible()
})

test('combines URL filters and restores their values with browser history', async () => {
  const user = userEvent.setup()
  renderApp('/tasks?due=overdue')
  const priority = await screen.findByRole('combobox', { name: /приоритет/i })
  await user.selectOptions(priority, 'high')
  await user.selectOptions(screen.getByRole('combobox', { name: /статус/i }), 'active')
  const search = window.location.search
  expect(Object.fromEntries(new URLSearchParams(search))).toEqual({
    due: 'overdue', priority: 'high', status: 'active',
  })
  expect(screen.queryByText('Statistics')).not.toBeInTheDocument()
  expect(screen.queryByText('Kinematics')).not.toBeInTheDocument()
  await user.click(await screen.findByRole('link', { name: first.title }))
  expect(await screen.findByText(first.description)).toBeVisible()
  expect(window.location.search).toBe(search)
  window.history.back()
  expect(await screen.findByRole('link', { name: first.title })).toBeVisible()
  expect(window.location.search).toBe(search)
  expect(screen.getByRole('combobox', { name: /дата/i })).toHaveValue('overdue')
  expect(screen.getByRole('combobox', { name: /статус/i })).toHaveValue('active')
  expect(screen.getByRole('combobox', { name: /приоритет/i })).toHaveValue('high')
})

test('the detail Back link restores the filtered catalogue', async () => {
  const user = userEvent.setup()
  renderApp('/tasks?due=overdue')
  await user.click(await screen.findByRole('link', { name: first.title }))
  expect(await screen.findByText(first.description)).toBeVisible()

  await user.click(screen.getByRole('link', { name: 'Назад к задачам' }))

  expect(window.location.pathname + window.location.search).toBe('/tasks?due=overdue')
  expect(screen.getByRole('combobox', { name: /дата/i })).toHaveValue('overdue')
})

test('announces empty filtered results and updates when the due filter changes', async () => {
  const user = userEvent.setup()
  renderApp('/tasks?priority=low&status=completed&due=today')
  expect(await screen.findByRole('status')).toHaveTextContent(/по выбранным фильтрам задач нет/i)
  await user.selectOptions(screen.getByRole('combobox', { name: /дата/i }), 'all')
  expect(await screen.findByRole('link', { name: 'Statistics' })).toBeVisible()
  expect(screen.queryByText('Vectors')).not.toBeInTheDocument()
})
