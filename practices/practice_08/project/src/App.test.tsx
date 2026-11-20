import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { renderApp } from './test/renderApp'
import { server } from './test/server'

const tasksUrl = new URL('/api/tasks', window.location.origin).href

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 25, 12))
})
afterEach(() => vi.useRealTimers())

const task = {
  id: 'task-1',
  title: 'Practice integration by parts',
  subject: 'Calculus',
  dueDate: '2026-11-25',
  priority: 'high',
  createdAt: '2026-11-19T12:00:00.000Z',
}

test('shows a named progress indicator while tasks are loading', async () => {
  let finishRequest!: () => void
  const pendingRequest = new Promise<void>((resolve) => {
    finishRequest = resolve
  })
  server.use(http.get(tasksUrl, async () => {
    await pendingRequest
    return HttpResponse.json({ tasks: [] })
  }))

  renderApp()

  try {
    expect(screen.getByRole('progressbar', { name: /загрузка задач/i })).toBeVisible()
  } finally {
    finishRequest()
  }
  await screen.findByText(/задач пока нет/i)
  expect(screen.queryByRole('progressbar', { name: /загрузка задач/i })).not.toBeInTheDocument()
})

test('shows an empty state when the server has no tasks', async () => {
  server.use(http.get(tasksUrl, () => HttpResponse.json({ tasks: [] })))

  renderApp()

  expect(await screen.findByText(/задач пока нет/i)).toBeVisible()
  expect(screen.getByText('Выполнено').nextElementSibling).toHaveTextContent('0')
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('renders a task card with its title, due date and priority', async () => {
  server.use(http.get(tasksUrl, () => HttpResponse.json({ tasks: [task] })))

  renderApp()

  const list = await screen.findByRole('list', { name: /^сегодня$/i })
  const card = within(list).getByRole('listitem')
  expect(within(card).getByRole('heading', { name: 'Practice integration by parts' })).toBeVisible()
  expect(within(card).queryByText('Calculus')).not.toBeInTheDocument()
  const dueDate = within(card).getByText('Сегодня')
  expect(dueDate).toHaveAttribute('datetime', '2026-11-25')
  expect(within(card).getByText('high')).toBeVisible()
  expect(within(card).getByTitle(/высокий приоритет/i)).toBeVisible()
})

test('recovers from a failed request when the user retries', async () => {
  let requests = 0
  server.use(http.get(tasksUrl, () => {
    requests += 1
    if (requests === 1) {
      return HttpResponse.json({ error: 'Could not access task data.' }, { status: 500 })
    }
    return HttpResponse.json({ tasks: [task] })
  }))
  const user = userEvent.setup()
  renderApp()

  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent(/не удалось загрузить задачи/i)
  await user.click(within(alert).getByRole('button', { name: /повторить/i }))

  expect(await screen.findByRole('heading', { name: task.title })).toBeVisible()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('shows Overview and its task list in the main region', async () => {
  server.use(http.get(tasksUrl, () => HttpResponse.json({ tasks: [] })))

  renderApp()

  const main = screen.getByRole('main')
  expect(within(main).getByRole('heading', { name: 'Обзор' })).toBeVisible()
  expect(await within(main).findByText(/задач пока нет/i)).toBeVisible()
})
