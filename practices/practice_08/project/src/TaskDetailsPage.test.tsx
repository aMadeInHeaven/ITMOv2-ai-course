import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { expect, test } from 'vitest'
import { renderApp } from './test/renderApp'
import { server } from './test/server'
import { getLocalToday } from './utils/taskDisplay'

const task = {
  id: 'equations', title: 'Solve equations', subject: 'Math', dueDate: getLocalToday(),
  priority: 'high', description: 'Solve problems 12 and 13.', completed: false,
  createdAt: '2026-11-19T12:00:00Z',
}

test('opens a dashboard card by keyboard and displays its individual task description', async () => {
  server.use(
    http.get('*/api/tasks', () => HttpResponse.json({ tasks: [task] })),
    http.get('*/api/tasks/equations', () => HttpResponse.json({ task })),
  )
  const user = userEvent.setup()
  renderApp()
  const card = await screen.findByRole('link', { name: task.title })
  card.focus()
  await user.keyboard('{Enter}')
  expect(await screen.findByText(task.description)).toBeVisible()
  expect(window.location.pathname).toBe('/tasks/equations')
  expect(screen.queryByRole('form')).not.toBeInTheDocument()
  await user.click(screen.getByRole('link', { name: 'Назад к задачам' }))
  expect(window.location.pathname).toBe('/')
  expect(screen.getByRole('heading', { name: 'Обзор' })).toBeVisible()
  expect(await screen.findByRole('link', { name: task.title })).toBeVisible()
})

test.each([
  {
    priority: 'high', label: 'Высокий приоритет',
    foreground: 'rgb(180, 35, 24)', background: 'rgb(254, 243, 242)',
    rowForeground: 'rgb(180, 35, 24)', rowBackground: 'rgb(254, 243, 242)',
  },
  {
    priority: 'medium', label: 'Средний приоритет',
    foreground: 'rgb(113, 80, 0)', background: 'rgb(255, 242, 191)',
    rowForeground: 'rgb(113, 80, 0)', rowBackground: 'rgb(255, 242, 191)',
  },
  {
    priority: 'low', label: 'Низкий приоритет',
    foreground: 'rgb(23, 101, 71)', background: 'rgb(230, 241, 235)',
    rowForeground: 'rgb(23, 101, 71)', rowBackground: 'rgb(230, 241, 235)',
  },
])('shows the $priority priority on its row and in detail', async ({ priority, label, foreground, background, rowForeground, rowBackground }) => {
  const prioritized = { ...task, priority }
  server.use(
    http.get('*/api/tasks', () => HttpResponse.json({ tasks: [prioritized] })),
    http.get('*/api/tasks/equations', () => HttpResponse.json({ task: prioritized })),
  )
  const user = userEvent.setup()
  renderApp()

  const card = await screen.findByRole('listitem')
  const priorityChip = within(card).getByText(priority)
  expect(priorityChip).toBeVisible()
  expect(priorityChip).toHaveStyle({ color: rowForeground, backgroundColor: rowBackground })
  await user.click(within(card).getByRole('link', { name: task.title }))

  const detail = await screen.findByRole('article')
  expect(within(detail).getByText(label).parentElement).toHaveStyle({ color: foreground, backgroundColor: background })
})

test('shows a recoverable not-found state when opening a missing task directly', async () => {
  server.use(
    http.get('*/api/tasks', () => HttpResponse.json({ tasks: [] })),
    http.get('*/api/tasks/missing', () => HttpResponse.json({}, { status: 404 })),
  )
  const user = userEvent.setup()
  renderApp('/tasks/missing')
  expect(await screen.findByRole('alert')).toHaveTextContent(/задача не найдена/i)
  await user.click(screen.getByRole('link', { name: 'Назад к задачам' }))
  expect(window.location.pathname).toBe('/')
  expect(screen.getByRole('heading', { name: 'Обзор' })).toBeVisible()
  expect(await screen.findByText(/задач пока нет/i)).toBeVisible()
})
