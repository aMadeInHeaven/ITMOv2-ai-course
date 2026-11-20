export type Priority = 'low' | 'medium' | 'high'

export interface CreateTaskInput {
  title: string
  subject: string
  dueDate: string
  priority: Priority
  description?: string
}

export interface Task extends CreateTaskInput {
  id: string
  createdAt: string
  description: string
  completed: boolean
}
