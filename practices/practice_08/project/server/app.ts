import express, { type ErrorRequestHandler } from 'express'
import { TaskStore } from './taskStore'
import type { CreateTaskInput } from './types'

function isDueDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000-')) {
    return false
  }

  const date = new Date(value)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function parseTaskInput(body: unknown): CreateTaskInput | undefined {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return undefined
  }

  const { title, subject, dueDate, priority, description } = body as Record<string, unknown>
  if (
    typeof title !== 'string' || !title.trim() ||
    typeof subject !== 'string' || !subject.trim() ||
    !isDueDate(dueDate) ||
    (priority !== 'low' && priority !== 'medium' && priority !== 'high') ||
    (description !== undefined && typeof description !== 'string')
  ) {
    return undefined
  }

  return { title: title.trim(), subject: subject.trim(), dueDate, priority, description }
}

const sendError: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  if (
    typeof error === 'object' && error !== null && 'status' in error &&
    typeof error.status === 'number' && error.status >= 400 && error.status < 500
  ) {
    response.status(error.status).json({ error: 'Could not read the request body.' })
    return
  }

  response.status(500).json({ error: 'Could not access task data.' })
}

export function createApp(store: TaskStore, clientDirectory?: string) {
  const app = express()
  app.use(express.json())

  app.get('/api/tasks', (_request, response) => {
    response.json({ tasks: store.list() })
  })

  app.post('/api/tasks', (request, response) => {
    const input = parseTaskInput(request.body)
    if (!input) {
      response.status(400).json({
        error: 'Provide a title, subject, valid due date (YYYY-MM-DD), and priority. Description can be omitted or provided as text.',
      })
      return
    }

    response.status(201).json({ task: store.create(input) })
  })

  app.get('/api/tasks/:id', (request, response) => {
    const task = store.get(request.params.id)
    if (!task) {
      response.status(404).json({ error: 'Task not found.' })
      return
    }

    response.json({ task })
  })

  app.patch('/api/tasks/:id', (request, response) => {
    const body: unknown = request.body
    if (typeof body !== 'object' || body === null || !('completed' in body) || typeof body.completed !== 'boolean') {
      response.status(400).json({ error: 'Completed must be a boolean.' })
      return
    }

    const task = store.setCompleted(request.params.id, body.completed)
    if (!task) {
      response.status(404).json({ error: 'Task not found.' })
      return
    }

    response.json({ task })
  })

  app.delete('/api/tasks/:id', (request, response) => {
    if (!store.remove(request.params.id)) {
      response.status(404).json({ error: 'Task not found.' })
      return
    }

    response.status(204).end()
  })

  app.use('/api', (_request, response) => {
    response.status(404).json({ error: 'API route not found.' })
  })

  if (clientDirectory) {
    app.use(express.static(clientDirectory))
    app.get('/{*path}', (request, response, next) => {
      if (!request.accepts('html')) {
        next()
        return
      }

      response.sendFile('index.html', { root: clientDirectory })
    })
  }

  app.use(sendError)
  return app
}
