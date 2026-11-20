import { Alert, Button } from '@mui/material'
import { useState, useSyncExternalStore } from 'react'
import { isCompletionPending, setTaskCompleted, subscribeToTaskChanges } from '../api'
import type { Task } from '../types'

export default function TaskCompletionButton({ task }: { task: Task }) {
  const [failed, setFailed] = useState(false)
  const pending = useSyncExternalStore(subscribeToTaskChanges, () => isCompletionPending(task.id))
  const label = task.completed ? 'Вернуть в работу' : 'Отметить выполненной'

  async function toggle() {
    setFailed(false)
    try {
      await setTaskCompleted(task.id, !task.completed)
    } catch {
      setFailed(true)
    }
  }

  return (
    <>
      <input className="task-checkbox" type="checkbox" disabled={pending} checked={Boolean(task.completed)}
        onChange={toggle} aria-label={`${label}: ${task.title}`} />
      {failed && (
        <Alert severity="error" sx={{ position: 'relative' }}
          action={<Button color="inherit" onClick={toggle}>Повторить</Button>}>
          Не удалось обновить статус задачи.
        </Alert>
      )}
    </>
  )
}
