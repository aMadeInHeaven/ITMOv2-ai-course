import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { renderApp } from './test/renderApp'
import { server } from './test/server'

const task = {
  id: 'draft', title: 'Revise photosynthesis', subject: 'Biology', dueDate: '2026-11-19',
  priority: 'medium', completed: false, createdAt: '2026-11-19T12:00:00Z',
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 19, 12))
  server.use(
    http.get('*/api/tasks', () => HttpResponse.json({ tasks: [] })),
    http.get('*/api/tasks/draft', () => HttpResponse.json({ task })),
  )
})
afterEach(() => vi.useRealTimers())

test.each(['/', '/today', '/week', '/tasks', '/completed', '/tasks/draft'])(
  'opens a labelled creation dialog from %s and returns keyboard focus on dismissal',
  async (path) => {
    const user = userEvent.setup()
    renderApp(path)
    const add = screen.getByRole('button', { name: /^добавить задачу$/i })
    expect(screen.queryByRole('form')).not.toBeInTheDocument()
    await user.click(add)
    const dialog = screen.getByRole('dialog', { name: 'Новая задача' })
    expect(within(dialog).getByRole('textbox', { name: /название/i })).toHaveFocus()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(add).toHaveFocus()
    expect(window.location.pathname).toBe(path)
  },
)

test.each([
  { path: '/today', matches: true },
  { path: '/week', matches: true },
  { path: '/tasks?priority=medium', matches: true },
  { path: '/tasks?priority=high', matches: false },
  { path: '/completed', matches: false },
])('reflects a created record in $path according to the active filters', async ({ path, matches }) => {
  server.use(http.post('*/api/tasks', () => HttpResponse.json({ task }, { status: 201 })))
  const user = userEvent.setup()
  renderApp(path)
  await user.click(screen.getByRole('button', { name: /^добавить задачу$/i }))
  const dialog = within(screen.getByRole('dialog', { name: 'Новая задача' }))
  await user.type(dialog.getByRole('textbox', { name: /название/i }), task.title)
  await user.type(dialog.getByRole('textbox', { name: /тема/i }), task.subject)
  await user.type(dialog.getByLabelText(/дата/i), task.dueDate)
  await user.selectOptions(dialog.getByRole('combobox', { name: /приоритет/i }), task.priority)
  await user.click(dialog.getByRole('button', { name: 'Добавить задачу' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect(window.location.pathname + window.location.search).toBe(path)
  const card = screen.queryByRole('link', { name: task.title })
  if (matches) expect(card).toBeVisible()
  else expect(card).not.toBeInTheDocument()
})

test('keeps a changed draft on Escape and discards it only after confirmation', async () => {
  const user = userEvent.setup()
  renderApp()
  const add = screen.getByRole('button', { name: /^добавить задачу$/i })
  await user.click(add)
  const form = within(screen.getByRole('dialog'))
  const title = form.getByRole('textbox', { name: /название/i })
  await user.type(title, 'Keep my draft')
  await user.keyboard('{Escape}')
  const confirm = within(screen.getByRole('dialog', { name: /отменить изменения/i }))
  await user.click(confirm.getByRole('button', { name: /продолжить редактирование/i }))
  expect(title).toHaveValue('Keep my draft')
  await user.click(await form.findByRole('button', { name: 'Отмена' }))
  await user.click(within(screen.getByRole('dialog', { name: /отменить изменения/i })).getByRole('button', { name: /^отбросить$/i }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  await user.click(add)
  expect(screen.getByRole('textbox', { name: /название/i })).toHaveValue('')
})
