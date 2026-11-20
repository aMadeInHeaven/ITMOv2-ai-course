import { Alert, Box, Button, CircularProgress } from '@mui/material'
import { useId, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { deleteTask } from '../api'
import { dateFormat, getLocalToday, priorities } from '../utils/taskDisplay'
import TaskCompletionButton from './TaskCompletionButton'
import DeleteTaskDialog from './DeleteTaskDialog'
import PlannerIcon from './PlannerIcon'
import type { Task } from '../types'

export interface TaskListState {
  status: 'loading' | 'error' | 'success'
  tasks: Task[]
}

interface TaskListProps {
  state: TaskListState
  heading?: string
  emptyMessage?: string
  onRefresh: () => void
}

const priorityChipColors = {
  low: priorities.low.sx,
  medium: priorities.medium.sx,
  high: { color: priorities.high.sx.color, bgcolor: priorities.high.sx.bgcolor },
}

export default function TaskList({ state, onRefresh, heading = 'Задачи', emptyMessage = 'Задач пока нет.' }: TaskListProps) {
  const headingId = useId()
  const { pathname, search } = useLocation()
  const [selected, setSelected] = useState<Task | null>(null)
  const [deletion, setDeletion] = useState<'idle' | 'pending' | 'error'>('idle')
  async function confirmDelete() {
    if (!selected || deletion === 'pending') return
    setDeletion('pending')
    try {
      await deleteTask(selected.id)
      setSelected(null)
      setDeletion('idle')
    } catch {
      setDeletion('error')
    }
  }

  return (
    <section className="task-section" aria-labelledby={headingId}>
      <h2 className="section-title" id={headingId}>{heading}</h2>
      {state.status === 'loading' && <div className="list-message"><CircularProgress size={18} aria-label="Загрузка задач" /> Загрузка задач…</div>}
      {state.status === 'error' && <Alert severity="error" action={<Button color="inherit" onClick={onRefresh}>Повторить</Button>}>Не удалось загрузить задачи.</Alert>}
      {state.status === 'success' && !state.tasks.length && <p className="list-message" role="status">{emptyMessage}</p>}
      {state.tasks.length > 0 && (
        <ul className="task-list" aria-labelledby={headingId}>
          {state.tasks.map(task => (
            <li key={task.id} className={'task-card' + (task.completed ? ' is-complete' : '')}>
              <TaskCompletionButton task={task} />
              <div className="task-copy">
                <h3><Link to={{ pathname: '/tasks/' + encodeURIComponent(task.id), search }}
                  state={{ from: { pathname, search } }}>{task.title}</Link></h3>
                {task.description && <p>{task.description}</p>}
              </div>
              <Box component="span" className="task-priority"
                sx={priorityChipColors[task.priority]} title={priorities[task.priority].label}>
                {task.priority}
              </Box>
              <time className="deadline" dateTime={task.dueDate}>
                <PlannerIcon name="today" size={16} />{task.dueDate === getLocalToday() ? 'Сегодня' : dateFormat.format(new Date(task.dueDate))}
              </time>
              <button className="row-delete" type="button" aria-label={'Удалить задачу: ' + task.title}
                onClick={() => { setDeletion('idle'); setSelected(task) }}><PlannerIcon name="trash" size={18} /></button>
            </li>
          ))}
        </ul>
      )}
      <DeleteTaskDialog open={Boolean(selected)} taskTitle={selected?.title ?? ''} pending={deletion === 'pending'}
        failed={deletion === 'error'} onCancel={() => setSelected(null)} onConfirm={confirmDelete} />
    </section>
  )
}
