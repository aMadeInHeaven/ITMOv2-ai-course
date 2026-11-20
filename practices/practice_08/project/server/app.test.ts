import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from './app'
import { TaskStore } from './taskStore'

const input = {
  title: 'Read chapter three',
  subject: 'Physics',
  dueDate: '2027-02-28',
  priority: 'high',
}

describe('tasks API', () => {
  let directory: string
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'focusboard-api-'))
    app = createApp(new TaskStore(join(directory, 'tasks.json')))
  })

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true })
  })

  it('returns an empty list for a fresh store', async () => {
    const response = await request(app).get('/api/tasks').expect(200)

    expect(response.body).toEqual({ tasks: [] })
  })

  it('creates a task and returns the persisted record', async () => {
    const response = await request(app).post('/api/tasks').send(input).expect(201)
    const list = await request(app).get('/api/tasks').expect(200)

    expect(response.body).toEqual({
      task: { ...input, description: '', completed: false, id: expect.any(String), createdAt: expect.any(String) },
    })
    expect(response.body.task.id).not.toBe('')
    expect(new Date(response.body.task.createdAt).toISOString()).toBe(response.body.task.createdAt)
    expect(list.body).toEqual({ tasks: [response.body.task] })
  })

  it.each([
    ['blank title', { ...input, title: ' ' }],
    ['missing title', { ...input, title: undefined }],
    ['numeric title', { ...input, title: 15 }],
    ['blank subject', { ...input, subject: ' ' }],
    ['missing due date', { ...input, dueDate: undefined }],
    ['impossible due date', { ...input, dueDate: '2027-02-29' }],
    ['non-ISO due date', { ...input, dueDate: '02/28/2027' }],
    ['unsupported priority', { ...input, priority: 'urgent' }],
    ['array payload', [input]],
  ])('rejects a payload with %s without creating a task', async (_label, payload) => {
    await request(app).post('/api/tasks').send(payload).expect(400)
    const list = await request(app).get('/api/tasks').expect(200)

    expect(list.body).toEqual({ tasks: [] })
  })

  it('rejects malformed JSON with a JSON error response', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .type('json')
      .send('{')
      .expect(400)
      .expect('Content-Type', /json/)

    expect(response.body).toEqual({ error: expect.any(String) })
  })
})
