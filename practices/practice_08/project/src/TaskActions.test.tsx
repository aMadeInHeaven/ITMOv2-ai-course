import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, expect, test, vi } from 'vitest'
import * as api from './api'
import { renderApp } from './test/renderApp'
import { server } from './test/server'
import { getLocalToday } from './utils/taskDisplay'

const task = {
  id: 'algebra', title: 'Review algebra', subject: 'Math', dueDate: getLocalToday(),
  priority: 'medium', description: 'Chapter 4', completed: false, createdAt: '2026-11-19T12:00:00Z',
}
const detailUrl = '*/api/tasks/algebra'

beforeEach(() => {
  server.use(
    http.get('*/api/tasks', () => HttpResponse.json({ tasks: [task] })),
    http.get(detailUrl, () => HttpResponse.json({ task })),
  )
})

test('completes a card and reopens it from the completed filter', async () => {
  const patches: unknown[] = []
  server.use(http.patch(detailUrl, async ({ request }) => {
    const body = await request.json() as { completed: boolean }
    patches.push(body)
    return HttpResponse.json({ task: { ...task, completed: body.completed } })
  }))
  const user = userEvent.setup()
  renderApp('/tasks?status=active')
  await user.click(await screen.findByRole('checkbox', { name: /отметить выполненной/i }))
  expect(await screen.findByText(/по выбранным фильтрам задач нет/i)).toBeVisible()
  await user.selectOptions(screen.getByRole('combobox', { name: /статус/i }), 'completed')
  const card = await screen.findByRole('listitem')
  expect(within(card).getByRole('checkbox')).toBeChecked()
  expect(card).toHaveClass('is-complete')
  await user.click(within(card).getByRole('checkbox', { name: /вернуть в работу/i }))
  expect(await screen.findByText(/по выбранным фильтрам задач нет/i)).toBeVisible()
  expect(patches).toEqual([{ completed: true }, { completed: false }])
})

test('keeps detail status when completion fails and retries the same PATCH', async () => {
  const patches: unknown[] = []
  server.use(http.patch(detailUrl, async ({ request }) => {
    patches.push(await request.json())
    if (patches.length === 1) return new HttpResponse(null, { status: 503 })
    return HttpResponse.json({ task: { ...task, completed: true } })
  }))
  const user = userEvent.setup()
  renderApp('/tasks/algebra')
  await user.click(await screen.findByRole('checkbox', { name: /отметить выполненной/i }))
  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent(/не удалось обновить/i)
  expect(screen.getByText('В работе')).toBeVisible()
  await user.click(within(alert).getByRole('button', { name: /повторить/i }))
  expect((await within(screen.getByRole('article')).findByText('Выполнена')).parentElement).toHaveStyle({ backgroundColor: 'rgb(46, 125, 50)' })
  expect(screen.getByRole('article')).toHaveStyle({ backgroundColor: 'rgb(237, 247, 237)' })
  expect(screen.getByRole('checkbox', { name: /вернуть в работу/i })).toBeEnabled()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  expect(patches).toEqual([{ completed: true }, { completed: true }])
})

test('cancels deletion without sending DELETE and keeps the detail open', async () => {
  let deletes = 0
  server.use(http.delete(detailUrl, () => {
    deletes += 1
    return new HttpResponse(null, { status: 204 })
  }))
  const user = userEvent.setup()
  renderApp('/tasks/algebra')
  await user.click(await screen.findByRole('button', { name: 'Удалить задачу' }))
  const dialog = screen.getByRole('dialog', { name: 'Точно хотите удалить?' })
  expect(within(dialog).getByText(task.title)).toBeVisible()
  await user.click(within(dialog).getByRole('button', { name: 'Отмена' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect(deletes).toBe(0)
  expect(window.location.pathname).toBe('/tasks/algebra')
  expect(screen.getByRole('heading', { name: task.title })).toBeVisible()
})

test('retries a failed confirmed deletion and returns to the filtered list after success', async () => {
  let deletes = 0
  server.use(
    http.delete(detailUrl, () => {
      deletes += 1
      return new HttpResponse(null, { status: deletes === 1 ? 503 : 204 })
    }),
    http.get('*/api/tasks', () => HttpResponse.json({ tasks: deletes === 2 ? [] : [task] })),
  )
  const user = userEvent.setup()
  renderApp('/tasks/algebra?status=active')
  await user.click(await screen.findByRole('button', { name: 'Удалить задачу' }))
  const dialog = within(screen.getByRole('dialog', { name: 'Точно хотите удалить?' }))
  await user.click(dialog.getByRole('button', { name: 'Удалить навсегда' }))
  expect(await dialog.findByRole('alert')).toHaveTextContent(/не удалось удалить/i)
  expect(deletes).toBe(1)
  expect(window.location.pathname).toBe('/tasks/algebra')
  await user.click(dialog.getByRole('button', { name: 'Удалить навсегда' }))
  expect(await screen.findByText(/задач пока нет/i)).toBeVisible()
  expect(window.location.pathname + window.location.search).toBe('/tasks?status=active')
  expect(screen.queryByRole('link', { name: task.title })).not.toBeInTheDocument()
  expect(deletes).toBe(2)
})

test.each([
  { from: '/', to: '/tasks/algebra', link: task.title },
  { from: '/tasks/algebra', to: '/tasks', link: 'Все задачи' },
])('shows the committed status after moving from $from to $to during a PATCH', async ({ from, to, link }) => {
  let completed = false
  const patches: boolean[] = []
  let releasePatch!: () => void
  const delayedPatch = new Promise<void>((resolve) => { releasePatch = resolve })
  let recordSnapshot!: (value: boolean) => void
  const destinationRead = new Promise<boolean>((resolve) => { recordSnapshot = resolve })
  server.use(
    http.get('*/api/tasks', () => {
      if (to === '/tasks') recordSnapshot(completed)
      return HttpResponse.json({ tasks: [{ ...task, completed }] })
    }),
    http.get(detailUrl, () => {
      if (to === '/tasks/algebra') recordSnapshot(completed)
      return HttpResponse.json({ task: { ...task, completed } })
    }),
    http.patch(detailUrl, async ({ request }) => {
      const body = await request.json() as { completed: boolean }
      patches.push(body.completed)
      await delayedPatch
      completed = body.completed
      return HttpResponse.json({ task: { ...task, completed } })
    }),
  )

  const user = userEvent.setup()
  renderApp(from)
  try {
    await user.click(await screen.findByRole('checkbox', { name: /отметить выполненной/i }))
    await waitFor(() => expect(patches).toEqual([true]))
    await user.click(screen.getByRole('link', { name: link }))
    expect(window.location.pathname).toBe(to)
    expect(await destinationRead).toBe(false)
  } finally {
    releasePatch()
  }

  await user.click(await screen.findByRole('checkbox', { name: /вернуть в работу/i }))
  expect(await screen.findByRole('checkbox', { name: /отметить выполненной/i })).toBeEnabled()
  expect(patches).toEqual([true, false])
})

test('renders the catalogue and allows unrelated changes while one PATCH is stalled', async () => {
  const other = { ...task, id: 'history', title: 'Review history' }
  let releasePatch!: () => void
  const stalled = new Promise<void>((resolve) => { releasePatch = resolve })
  const requests: string[] = []
  server.use(
    http.get('*/api/tasks', () => HttpResponse.json({ tasks: [task, other] })),
    http.patch('*/api/tasks/:id', async ({ params }) => {
      requests.push(String(params.id))
      if (params.id === task.id) await stalled
      return HttpResponse.json({ task: { ...(params.id === task.id ? task : other), completed: true } })
    }),
  )
  const user = userEvent.setup()
  renderApp('/tasks/algebra')
  try {
    await user.click(await screen.findByRole('checkbox', { name: /отметить выполненной/i }))
    await waitFor(() => expect(requests).toEqual(['algebra']))
    await user.click(screen.getByRole('link', { name: 'Все задачи' }))
    await user.click(await screen.findByRole('checkbox', { name: 'Отметить выполненной: Review history' }))
    expect(await screen.findByRole('checkbox', { name: 'Вернуть в работу: Review history' })).toBeEnabled()
    expect(screen.getByRole('checkbox', { name: 'Отметить выполненной: Review algebra' })).toBeDisabled()
    expect(requests).toEqual(['algebra', 'history'])
  } finally {
    releasePatch()
  }
  expect(await screen.findByRole('checkbox', { name: 'Вернуть в работу: Review algebra' })).toBeEnabled()
})

test('retains a committed task when a slower catalogue GET returns an older snapshot', async () => {
  let releasePatch!: () => void
  let releaseList!: () => void
  let startList!: () => void
  const patchGate = new Promise<void>((resolve) => { releasePatch = resolve })
  const listGate = new Promise<void>((resolve) => { releaseList = resolve })
  const reading = new Promise<void>((resolve) => { startList = resolve })
  server.use(
    http.patch(detailUrl, async () => {
      await patchGate
      return HttpResponse.json({ task: { ...task, completed: true } })
    }),
    http.get('*/api/tasks', async () => {
      const snapshot = [task, { ...task, id: 'history', title: 'Review history' }]
      startList()
      await listGate
      return HttpResponse.json({ tasks: snapshot })
    }),
  )
  const user = userEvent.setup()
  renderApp('/tasks/algebra')
  try {
    await user.click(await screen.findByRole('checkbox', { name: /отметить выполненной/i }))
    await user.click(screen.getByRole('link', { name: 'Все задачи' }))
    await reading
    releasePatch()
    expect(await screen.findByRole('checkbox', { name: 'Вернуть в работу: Review algebra' })).toBeEnabled()
  } finally {
    releasePatch()
    releaseList()
  }
  expect(await screen.findByRole('link', { name: 'Review history' })).toBeVisible()
  expect(screen.getByRole('checkbox', { name: 'Вернуть в работу: Review algebra' })).toBeEnabled()
})

test('a delayed completion response cannot restore a task after confirmed deletion', async () => {
  const user = userEvent.setup()
  let releasePatch!: () => void
  const patchGate = new Promise<void>((resolve) => { releasePatch = resolve })
  let deleted = false
  const methods: string[] = []
  server.use(
    http.patch(detailUrl, async () => {
      methods.push('PATCH')
      await patchGate
      return HttpResponse.json({ task: { ...task, completed: true } })
    }),
    http.delete(detailUrl, () => {
      methods.push('DELETE')
      deleted = true
      return new HttpResponse(null, { status: 204 })
    }),
    http.get('*/api/tasks', () => HttpResponse.json({ tasks: deleted ? [] : [task] })),
  )
  // Observe the real request promise so the assertion runs after its subscriber notifications.
  const patch = vi.spyOn(api, 'setTaskCompleted')
  try {
    renderApp('/tasks/algebra')
    await user.click(await screen.findByRole('checkbox', { name: /отметить выполненной/i }))
    await waitFor(() => expect(methods).toEqual(['PATCH']))
    await user.click(screen.getByRole('button', { name: 'Удалить задачу' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Удалить навсегда' }))
    expect(await screen.findByText(/задач пока нет/i)).toBeVisible()
    expect(methods).toEqual(['PATCH', 'DELETE'])

    await act(async () => {
      releasePatch()
      await patch.mock.results[0].value
    })
    expect(screen.queryByRole('link', { name: task.title })).not.toBeInTheDocument()
    expect(screen.getByText(/задач пока нет/i)).toBeVisible()
  } finally {
    releasePatch()
    patch.mockRestore()
  }
})

test.each(['/today?sort=recent', '/week?scope=mine'])('restores %s after deleting a card', async (path) => {
  const user = userEvent.setup()
  server.use(http.delete(detailUrl, () => new HttpResponse(null, { status: 204 })))
  renderApp(path)
  const card = await screen.findByRole('listitem')
  expect(within(card).getByText('Сегодня')).toBeVisible()
  await user.click(within(card).getByRole('link', { name: task.title }))
  const detail = await screen.findByRole('article')
  expect(within(detail).getByText(/^Срок/)).toBeVisible()
  expect(screen.getByRole('link', { name: 'Назад к задачам' })).toHaveAttribute('href', path)
  await user.click(within(detail).getByRole('button', { name: 'Удалить задачу' }))
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Удалить навсегда' }))
  await waitFor(() => expect(window.location.pathname + window.location.search).toBe(path))
})

test('removes a task from its row after explicit confirmation', async () => {
  let deletes = 0
  server.use(http.delete(detailUrl, () => {
    deletes++
    return new HttpResponse(null, { status: 204 })
  }))
  const user = userEvent.setup()
  renderApp('/tasks')
  const row = within(await screen.findByRole('listitem'))
  await user.click(row.getByRole('button', { name: 'Удалить задачу: Review algebra' }))
  const dialog = within(screen.getByRole('dialog', { name: 'Точно хотите удалить?' }))
  expect(deletes).toBe(0)
  await user.click(dialog.getByRole('button', { name: 'Удалить навсегда' }))
  await waitFor(() => expect(screen.queryByRole('listitem')).not.toBeInTheDocument())
  expect(deletes).toBe(1)
  expect(window.location.pathname).toBe('/tasks')
})
