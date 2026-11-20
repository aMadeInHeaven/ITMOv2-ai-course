import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, it } from 'vitest'
import { TaskStore } from './taskStore'

it('persists tasks across store instances without losing earlier writes', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'focusboard-store-'))
  const path = join(directory, 'tasks.json')
  writeFileSync(path, '[]\n')

  try {
    const firstStore = new TaskStore(path)
    const secondStore = new TaskStore(path)
    const first = await firstStore.create({
      title: 'Review lecture',
      subject: 'Math',
      dueDate: '2027-02-28',
      priority: 'medium',
    })
    const second = await secondStore.create({
      title: 'Outline report',
      subject: 'History',
      dueDate: '2027-03-01',
      priority: 'low',
    })
    const tasks = await new TaskStore(path).list()

    expect(first.id).not.toEqual(second.id)
    expect(tasks).toHaveLength(2)
    expect(tasks).toEqual(expect.arrayContaining([first, second]))
    expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual(tasks)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

it('loads legacy tasks with defaults and preserves fields already stored', () => {
  const directory = mkdtempSync(join(tmpdir(), 'focusboard-store-'))
  const path = join(directory, 'tasks.json')
  const legacyTask = {
    id: 'legacy-task',
    title: 'Review lecture',
    subject: 'Math',
    dueDate: '2027-02-28',
    priority: 'medium',
    createdAt: '2027-02-25T12:00:00.000Z',
  }
  const currentTask = { ...legacyTask, id: 'current-task', description: 'Bring notes.', completed: true }

  try {
    writeFileSync(path, JSON.stringify([legacyTask, currentTask]))

    expect(new TaskStore(path).list()).toEqual([
      { ...legacyTask, description: '', completed: false },
      currentTask,
    ])
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
