import { randomUUID } from 'node:crypto'
import { readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import type { CreateTaskInput, Task } from './types'

type StoredTask = Omit<Task, 'description' | 'completed'> & Partial<Pick<Task, 'description' | 'completed'>>

export class TaskStore {
  constructor(private readonly path: string) {}

  list(): Task[] {
    try {
      const tasks: StoredTask[] = JSON.parse(readFileSync(this.path, 'utf8'))
      if (!Array.isArray(tasks)) {
        throw new Error('Task data must contain a JSON array')
      }
      return tasks.map((task) => ({
        ...task,
        description: task.description ?? '',
        completed: task.completed ?? false,
      }))
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return []
      }
      throw error
    }
  }

  get(id: string): Task | undefined {
    return this.list().find((task) => task.id === id)
  }

  create(input: CreateTaskInput): Task {
    const tasks = this.list()
    const task: Task = {
      ...input,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      description: input.description ?? '',
      completed: false,
    }
    tasks.push(task)
    this.write(tasks)
    return task
  }

  setCompleted(id: string, completed: boolean): Task | undefined {
    const tasks = this.list()
    const task = tasks.find((item) => item.id === id)
    if (!task) {
      return undefined
    }

    task.completed = completed
    this.write(tasks)
    return task
  }

  remove(id: string): boolean {
    const tasks = this.list()
    const index = tasks.findIndex((task) => task.id === id)
    if (index === -1) {
      return false
    }

    tasks.splice(index, 1)
    this.write(tasks)
    return true
  }

  private write(tasks: Task[]): void {
    // Replace the file atomically so a failed write cannot leave partial JSON.
    const temporaryPath = `${this.path}.${randomUUID()}.tmp`
    try {
      writeFileSync(temporaryPath, JSON.stringify(tasks, null, 2) + '\n', 'utf8')
      renameSync(temporaryPath, this.path)
    } catch (error) {
      rmSync(temporaryPath, { force: true })
      throw error
    }
  }
}
