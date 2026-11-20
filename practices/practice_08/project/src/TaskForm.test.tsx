import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent, { PointerEventsCheckLevel } from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { renderApp } from './test/renderApp'
import { server } from './test/server'

const tasksUrl = new URL('/api/tasks', window.location.origin).href
const input = {
  title: 'Review thermodynamics',
  subject: 'Physics',
  dueDate: '2026-11-21',
  priority: 'high',
}
const savedTask = {
  ...input,
  id: 'task-created',
  createdAt: '2026-11-19T13:00:00.000Z',
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 19, 0, 30))
  server.use(http.get(tasksUrl, () => HttpResponse.json({ tasks: [] })))
})

afterEach(() => vi.useRealTimers())

async function openDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /^добавить задачу$/i }))
  return screen.getByRole('dialog', { name: 'Новая задача' })
}

function taskForm() {
  return screen.getByRole('form', { name: /новая задача/i })
}

function fillTaskForm() {
  const form = within(taskForm())
  fireEvent.change(form.getByRole('textbox', { name: /название/i }), { target: { value: input.title } })
  fireEvent.change(form.getByRole('textbox', { name: /тема/i }), { target: { value: input.subject } })
  fireEvent.change(form.getByLabelText(/дата/i), { target: { value: input.dueDate } })
  fireEvent.change(form.getByRole('combobox', { name: /приоритет/i }), { target: { value: input.priority } })
  return form
}

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((finish) => { resolve = finish })
  return { promise, resolve }
}

test('shows accessible field errors and sends nothing for missing values', async () => {
  const user = userEvent.setup()
  let posts = 0
  server.use(http.post(tasksUrl, () => {
    posts += 1
    return HttpResponse.json({ task: savedTask }, { status: 201 })
  }))
  renderApp()
  await screen.findByText(/задач пока нет/i)
  await openDialog(user)

  const form = within(taskForm())
  const title = form.getByRole('textbox', { name: /название/i })
  await user.type(title, '   ')
  await user.click(form.getByRole('button', { name: /добавить задачу/i }))

  const requiredFields = [
    [title, 'Введите название.'],
    [form.getByRole('textbox', { name: /тема/i }), 'Введите тему.'],
    [form.getByLabelText(/дата/i), 'Укажите дату.'],
    [form.getByRole('combobox', { name: /приоритет/i }), 'Выберите приоритет.'],
  ] as const
  for (const [field, message] of requiredFields) {
    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(field).toHaveAccessibleDescription(message)
    expect(form.getByText(message)).toBeVisible()
  }
  expect(title).toHaveFocus()
  expect(posts).toBe(0)
})

test('rejects a date outside the API calendar format before sending a request', async () => {
  const user = userEvent.setup()
  let posts = 0
  server.use(http.post(tasksUrl, () => {
    posts += 1
    return HttpResponse.json({ task: savedTask }, { status: 201 })
  }))
  renderApp()
  await screen.findByText(/задач пока нет/i)
  await openDialog(user)

  const form = fillTaskForm()
  const date = form.getByLabelText(/дата/i)
  // A native date input accepts a five-digit year, while the API requires YYYY-MM-DD.
  fireEvent.change(date, { target: { value: '10000-11-27' } })
  expect(date).toHaveValue('10000-11-27')
  await user.click(form.getByRole('button', { name: /добавить задачу/i }))

  expect(form.getByText('Введите корректную дату.')).toBeVisible()
  expect(date).toHaveAccessibleDescription('Введите корректную дату.')
  expect(date).toHaveFocus()
  expect(posts).toBe(0)
})

test('rejects yesterday and accepts today using the local calendar', async () => {
  const user = userEvent.setup()
  const posted: unknown[] = []
  server.use(http.post(tasksUrl, async ({ request }) => {
    posted.push(await request.json())
    return HttpResponse.json({ task: { ...savedTask, dueDate: '2026-11-19' } }, { status: 201 })
  }))
  renderApp()
  await screen.findByText(/задач пока нет/i)
  await openDialog(user)

  const form = fillTaskForm()
  const date = form.getByLabelText(/дата/i)
  const submit = form.getByRole('button', { name: /добавить задачу/i })
  fireEvent.change(date, { target: { value: '2026-11-18' } })
  await user.click(submit)

  expect(form.getByText(/сегодняшнюю или более позднюю/i)).toBeVisible()
  expect(date).toHaveAccessibleDescription(/сегодняшнюю или более позднюю/i)
  expect(date).toHaveAttribute('aria-invalid', 'true')
  expect(date).toHaveFocus()
  expect(posted).toHaveLength(0)

  fireEvent.change(date, { target: { value: '2026-11-19' } })
  await user.click(submit)

  expect(await screen.findByText('Задача добавлена.')).toBeVisible()
  expect(posted).toEqual([{ ...input, dueDate: '2026-11-19' }])
})

test('submits from an input with Enter after navigating labelled fields by keyboard', async () => {
  const user = userEvent.setup()
  server.use(http.post(tasksUrl, () => HttpResponse.json({ task: savedTask }, { status: 201 })))
  renderApp()
  await screen.findByText(/задач пока нет/i)
  await openDialog(user)

  const form = within(taskForm())
  expect(form.getByRole('textbox', { name: /название/i })).toHaveFocus()
  await user.keyboard(input.title)
  await user.tab()
  const subject = form.getByRole('textbox', { name: /тема/i })
  expect(subject).toHaveFocus()
  await user.keyboard(input.subject)
  fireEvent.change(form.getByLabelText(/дата/i), { target: { value: input.dueDate } })
  await user.selectOptions(form.getByRole('combobox', { name: /приоритет/i }), input.priority)
  subject.focus()
  await user.keyboard('{Enter}')

  expect(await screen.findByText('Задача добавлена.')).toBeVisible()
})

test('posts the task values, announces success, and renders the returned task', async () => {
  const user = userEvent.setup()
  const posted: unknown[] = []
  server.use(http.post(tasksUrl, async ({ request }) => {
    posted.push(await request.json())
    return HttpResponse.json({ task: { ...savedTask, title: 'Saved thermodynamics task' } }, { status: 201 })
  }))
  renderApp()
  await screen.findByText(/задач пока нет/i)
  await openDialog(user)

  const form = fillTaskForm()
  const title = form.getByRole('textbox', { name: /название/i })
  fireEvent.change(title, { target: { value: '  Review thermodynamics  ' } })
  await user.click(form.getByRole('button', { name: /добавить задачу/i }))

  const list = await screen.findByRole('list', { name: /далее на неделе/i })
  const card = within(list).getByRole('listitem')
  expect(within(card).getByRole('heading', { name: 'Saved thermodynamics task' })).toBeVisible()
  expect(within(card).getByText('high')).toBeVisible()
  expect(within(card).getByText('21 ноября')).toBeVisible()
  expect(within(card).getByTitle(/высокий приоритет/i)).toBeVisible()
  expect(await screen.findByText('Задача добавлена.')).toBeVisible()
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  const fresh = within(await openDialog(user))
  expect(fresh.getByRole('textbox', { name: /название/i })).toHaveValue('')
  expect(fresh.getByRole('textbox', { name: /тема/i })).toHaveValue('')
  expect(fresh.getByLabelText(/дата/i)).toHaveValue('')
  expect(fresh.getByRole('combobox', { name: /приоритет/i })).toHaveValue('')
  expect(posted).toEqual([{
    title: 'Review thermodynamics',
    subject: 'Physics',
    dueDate: '2026-11-21',
    priority: 'high',
  }])
})

test('keeps failed values available and retries creation from the error alert', async () => {
  const user = userEvent.setup()
  const posted: unknown[] = []
  server.use(http.post(tasksUrl, async ({ request }) => {
    posted.push(await request.json())
    if (posted.length === 1) return HttpResponse.json({ error: 'Save failed' }, { status: 500 })
    return HttpResponse.json({ task: savedTask }, { status: 201 })
  }))
  renderApp()
  await screen.findByText(/задач пока нет/i)
  await openDialog(user)

  const form = fillTaskForm()
  await user.click(form.getByRole('button', { name: /добавить задачу/i }))

  const error = await form.findByRole('alert')
  expect(error).toHaveTextContent(/не удалось добавить задачу/i)
  expect(screen.getByText(/задач пока нет/i)).toBeVisible()
  expect(form.getByRole('textbox', { name: /название/i })).toHaveValue(input.title)
  expect(form.getByRole('textbox', { name: /тема/i })).toHaveValue(input.subject)
  expect(form.getByLabelText(/дата/i)).toHaveValue(input.dueDate)
  expect(form.getByRole('combobox', { name: /приоритет/i })).toHaveValue(input.priority)
  await user.click(within(error).getByRole('button', { name: /повторить/i }))

  expect(await screen.findByRole('heading', { name: input.title })).toBeVisible()
  expect(await screen.findByText('Задача добавлена.')).toBeVisible()
  expect(posted).toEqual([input, input])
})

test('blocks overlapping submissions while the create request is pending', async () => {
  // Exercise the button's native disabled behavior independently of MUI's CSS.
  const user = userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never })
  const firstPost = deferred()
  const finishPost = deferred()
  let posts = 0
  server.use(http.post(tasksUrl, async () => {
    posts += 1
    firstPost.resolve()
    await finishPost.promise
    return HttpResponse.json({ task: savedTask }, { status: 201 })
  }))
  renderApp()
  await screen.findByText(/задач пока нет/i)
  await openDialog(user)

  const form = fillTaskForm()
  try {
    // Dispatch two form submissions before React can commit the disabled button.
    act(() => {
      fireEvent.submit(taskForm())
      fireEvent.submit(taskForm())
    })
    await firstPost.promise
    const submit = form.getByRole('button', { name: /добавление задачи/i })
    expect(submit).toBeDisabled()
    expect(form.getByRole('progressbar', { name: /добавление задачи/i })).toBeVisible()

    await user.keyboard('{Escape}')
    expect(screen.getByRole('dialog', { name: 'Новая задача' })).toBeVisible()
    await user.click(submit)
    fireEvent.submit(taskForm())
    expect(posts).toBe(1)
  } finally {
    finishPost.resolve()
  }
  expect(await screen.findByText('Задача добавлена.')).toBeVisible()
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect(screen.getByRole('button', { name: 'Добавить задачу' })).toBeEnabled()
  expect(posts).toBe(1)
})

test('keeps a created task when a delayed initial list returns its earlier snapshot', async () => {
  const user = userEvent.setup()
  const finishList = deferred()
  const earlierTask = { ...savedTask, id: 'task-earlier', title: 'Earlier study task' }
  server.use(
    http.get(tasksUrl, async () => {
      await finishList.promise
      return HttpResponse.json({ tasks: [earlierTask] })
    }),
    http.post(tasksUrl, () => HttpResponse.json({ task: savedTask }, { status: 201 })),
  )
  renderApp()
  try {
    await openDialog(user)
    const form = fillTaskForm()
    await user.click(form.getByRole('button', { name: /добавить задачу/i }))
    expect(await screen.findByRole('heading', { name: input.title })).toBeVisible()
    expect(screen.getByRole('progressbar', { name: /загрузка задач/i })).toBeVisible()
  } finally {
    finishList.resolve()
  }

  expect(await screen.findByRole('heading', { name: earlierTask.title })).toBeVisible()
  expect(screen.getByRole('heading', { name: input.title })).toBeVisible()
})

test('posts an optional multiline description and displays it when opening the created task', async () => {
  const description = 'Read chapter three.\nAnswer the practice questions.'
  let posted: Record<string, unknown> | undefined
  server.use(
    http.post(tasksUrl, async ({ request }) => {
      posted = await request.json() as Record<string, unknown>
      return HttpResponse.json({ task: { ...savedTask, description: posted.description, completed: false } }, { status: 201 })
    }),
    http.get('*/api/tasks/task-created', () =>
      HttpResponse.json({ task: { ...savedTask, description: posted?.description, completed: false } })),
  )
  const user = userEvent.setup()
  renderApp()
  await screen.findByText(/задач пока нет/i)
  await openDialog(user)
  const form = fillTaskForm()
  const field = form.getByRole('textbox', { name: /описание/i })
  fireEvent.change(field, { target: { value: description } })
  await user.click(form.getByRole('button', { name: /добавить задачу/i }))
  const link = await screen.findByRole('link', { name: input.title })
  expect(posted).toEqual({ ...input, description })
  await user.click(link)
  expect(await screen.findByText('Read chapter three. Answer the practice questions.')).toBeVisible()
})

test('counts raw description characters and blocks overflow until corrected', async () => {
  const user = userEvent.setup()
  const posted: unknown[] = []
  server.use(http.post(tasksUrl, async ({ request }) => {
    posted.push(await request.json())
    return HttpResponse.json({ task: savedTask }, { status: 201 })
  }))
  renderApp()
  await openDialog(user)
  const form = fillTaskForm()
  const description = form.getByRole('textbox', { name: /описание/i })
  expect(description).toHaveAccessibleDescription('0 / 1000')
  fireEvent.change(description, { target: { value: 'x'.repeat(1001) } })
  expect(description).toHaveAccessibleDescription(/1001 \/ 1000/)
  expect(description).toHaveAttribute('aria-invalid', 'true')
  await user.click(form.getByRole('button', { name: 'Добавить задачу' }))
  expect(description).toHaveFocus()
  expect(posted).toHaveLength(0)
  fireEvent.change(description, { target: { value: 'x'.repeat(1000) } })
  expect(description).toHaveAttribute('aria-invalid', 'false')
  const longTitle = 't'.repeat(1005)
  fireEvent.change(form.getByRole('textbox', { name: /название/i }), { target: { value: longTitle } })
  await user.click(form.getByRole('button', { name: 'Добавить задачу' }))
  await screen.findByText('Задача добавлена.')
  expect(posted).toEqual([{ ...input, title: longTitle, description: 'x'.repeat(1000) }])
})

test('warns about a normalized duplicate even on detail and allows a deliberate submission', async () => {
  const user = userEvent.setup()
  const posted: unknown[] = []
  server.use(
    http.get(tasksUrl, () => HttpResponse.json({ tasks: [{ ...savedTask, title: 'Review  thermodynamics', subject: '  Earth   Science  ' }] })),
    http.get('*/api/tasks/task-created', () => HttpResponse.json({ task: savedTask })),
    http.post(tasksUrl, async ({ request }) => {
      posted.push(await request.json())
      return HttpResponse.json({ task: savedTask }, { status: 201 })
    }),
  )
  renderApp('/tasks/task-created')
  await openDialog(user)
  const form = fillTaskForm()
  fireEvent.change(form.getByRole('textbox', { name: /название/i }), { target: { value: '  Review   thermodynamics  ' } })
  fireEvent.change(form.getByRole('textbox', { name: /тема/i }), { target: { value: ' Earth     Science ' } })
  fireEvent.change(form.getByRole('textbox', { name: /описание/i }), { target: { value: ' Read  notes   first.  ' } })
  await user.click(form.getByRole('button', { name: 'Добавить задачу' }))
  expect(await screen.findByText(/уже существует/i)).toBeVisible()
  expect(posted).toHaveLength(0)
  await user.click(screen.getByRole('button', { name: /всё равно добавить/i }))
  await screen.findByText('Задача добавлена.')
  expect(posted).toEqual([{ ...input, subject: 'Earth Science', description: 'Read notes first.' }])
})
