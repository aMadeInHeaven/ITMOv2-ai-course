import type { Task } from './types'

export type { CreateTaskInput } from '../server/types'
import type { CreateTaskInput } from '../server/types'

const pendingCompletions = new Map<string, Promise<Task>>()
const taskChangeListeners = new Set<(updated?: Task, deletedId?: string) => void>()

export function isCompletionPending(id: string) {
  return pendingCompletions.has(id)
}

export function subscribeToTaskChanges(listener: (updated?: Task, deletedId?: string) => void) {
  taskChangeListeners.add(listener)
  return () => { taskChangeListeners.delete(listener) }
}

function notifyTaskChange(updated?: Task, deletedId?: string) {
  for (const listener of taskChangeListeners) listener(updated, deletedId)
}

export async function listTasks(signal: AbortSignal): Promise<Task[]> {
  const response = await fetch('/api/tasks', { signal })
  if (!response.ok) {
    throw new Error('Could not load tasks.')
  }

  const data: { tasks: Task[] } = await response.json()
  return data.tasks
}

export async function getTask(id: string, signal?: AbortSignal): Promise<Task | null> {
  const response = await fetch(`/api/tasks/${encodeURIComponent(id)}`, { signal })
  if (response.status === 404) return null
  if (!response.ok) throw new Error('Could not load task.')

  const data: { task: Task } = await response.json()
  return data.task
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const response = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    throw new Error('Could not add task.')
  }

  const data: { task: Task } = await response.json()
  notifyTaskChange(data.task)
  return data.task
}

export async function setTaskCompleted(id: string, completed: boolean): Promise<Task> {
  const request = patchCompletion(id, completed)
  pendingCompletions.set(id, request)
  notifyTaskChange()
  let updated: Task | undefined
  try {
    updated = await request
    return updated
  } finally {
    if (pendingCompletions.get(id) === request) {
      pendingCompletions.delete(id)
      notifyTaskChange(updated)
    }
  }
}

async function patchCompletion(id: string, completed: boolean): Promise<Task> {
  const response = await fetch(`/api/tasks/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed }),
  })
  if (!response.ok) throw new Error('Could not update task status.')
  const data: { task: Task } = await response.json()
  return data.task
}

export async function deleteTask(id: string): Promise<void> {
  const response = await fetch(`/api/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' })
  if (!response.ok) throw new Error('Could not delete task.')
  // An older PATCH can arrive after the server has confirmed deletion.
  pendingCompletions.delete(id)
  notifyTaskChange(undefined, id)
}
