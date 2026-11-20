import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from './app'
import { TaskStore } from './taskStore'

const task = {
  id: 'task-1',
  title: 'Review lecture',
  subject: 'Math',
  dueDate: '2027-02-28',
  priority: 'medium',
  description: 'Review the worked examples.',
  completed: false,
  createdAt: '2027-02-25T12:00:00.000Z',
}

describe('individual tasks API', () => {
  let directory: string
  let path: string
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'focusboard-task-api-'))
    path = join(directory, 'tasks.json')
    writeFileSync(path, JSON.stringify([task]))
    app = createApp(new TaskStore(path))
  })

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true })
  })

  it('returns the task with the requested ID', async () => {
    const response = await request(app).get('/api/tasks/task-1').expect(200)

    expect(response.body).toEqual({ task })
  })

  it('persists completion changes in both directions', async () => {
    const completed = await request(app).patch('/api/tasks/task-1').send({ completed: true }).expect(200)

    expect(completed.body).toEqual({ task: { ...task, completed: true } })
    expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual([{ ...task, completed: true }])

    const active = await request(app).patch('/api/tasks/task-1').send({ completed: false }).expect(200)

    expect(active.body).toEqual({ task })
    expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual([task])
  })

  it.each([{}, { completed: 'false' }, { completed: null }])(
    'rejects an invalid completion payload (%j) without changing the task',
    async (payload) => {
      await request(app).patch('/api/tasks/task-1').send(payload).expect(400)

      expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual([task])
    },
  )

  it('permanently removes only the requested task', async () => {
    const otherTask = { ...task, id: 'task-2', title: 'Outline report' }
    writeFileSync(path, JSON.stringify([otherTask, task]))

    const response = await request(app).delete('/api/tasks/task-1').expect(204)

    expect(response.text).toBe('')
    expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual([otherTask])
  })

  it.each(['get', 'patch', 'delete'] as const)('returns a JSON 404 for a missing task (%s)', async (method) => {
    const call = request(app)[method]('/api/tasks/missing')
    if (method === 'patch') call.send({ completed: true })

    const response = await call.expect(404).expect('Content-Type', /json/)

    expect(response.body).toEqual({ error: expect.any(String) })
  })

  it('persists an optional description on creation', async () => {
    const response = await request(app).post('/api/tasks').send({
      title: 'Outline report',
      subject: 'History',
      dueDate: '2027-03-01',
      priority: 'low',
      description: 'Prepare sources.',
    }).expect(201)

    expect(response.body.task).toMatchObject({ description: 'Prepare sources.', completed: false })
    expect(JSON.parse(readFileSync(path, 'utf8'))).toContainEqual(response.body.task)
  })

  it('rejects a description that is not a string', async () => {
    await request(app).post('/api/tasks').send({
      title: 'Outline report',
      subject: 'History',
      dueDate: '2027-03-01',
      priority: 'low',
      description: 42,
    }).expect(400)

    expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual([task])
  })
})

describe('built client serving', () => {
  const html = '<!doctype html><html><body>Built FocusBoard client</body></html>'
  let directory: string
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'focusboard-client-'))
    const clientDirectory = join(directory, 'dist')
    const assetsDirectory = join(clientDirectory, 'assets')
    mkdirSync(assetsDirectory, { recursive: true })
    writeFileSync(join(clientDirectory, 'index.html'), html)
    writeFileSync(join(assetsDirectory, 'index.js'), 'export const build = true;')
    app = createApp(new TaskStore(join(directory, 'tasks.json')), clientDirectory)
  })

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true })
  })

  it.each(['/', '/tasks/task-1'])('serves the built client HTML at %s', async (path) => {
    const response = await request(app).get(path).accept('html').expect(200).expect('Content-Type', /html/)

    expect(response.text).toBe(html)
  })

  it('serves built client assets', async () => {
    const response = await request(app).get('/assets/index.js').expect(200).expect('Content-Type', /javascript/)

    expect(response.text).toBe('export const build = true;')
  })

  it('keeps the task API available when serving the client', async () => {
    const response = await request(app).get('/api/tasks').expect(200).expect('Content-Type', /json/)

    expect(response.body).toEqual({ tasks: [] })
  })

  it('returns a JSON 404 for an unknown API path', async () => {
    const response = await request(app).get('/api/unknown').accept('html').expect(404).expect('Content-Type', /json/)

    expect(response.body).toEqual({ error: expect.any(String) })
  })
})
