import { Alert, Button, Chip, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { deleteTask, getTask, subscribeToTaskChanges } from '../api'
import DeleteTaskDialog from '../components/DeleteTaskDialog'
import TaskCompletionButton from '../components/TaskCompletionButton'
import { completedTaskSx, dateFormat, priorities } from '../utils/taskDisplay'
import type { Task } from '../types'

type DetailState = { status: 'loading' | 'not-found' | 'error' } | { status: 'ready'; task: Task }

export default function TaskDetailsPage() {
  const { id = '' } = useParams()
  return <TaskDetails key={id} id={id} />
}

function TaskDetails({ id }: { id: string }) {
  const { search, state: navigationState } = useLocation()
  const origin = navigationState?.from
  const navigate = useNavigate()
  const [deletion, setDeletion] = useState<'closed' | 'confirm' | 'pending' | 'error'>('closed')
  const active = useRef(false)
  const [state, setState] = useState<DetailState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    active.current = true
    const controller = new AbortController()
    let receivedUpdate = false
    const unsubscribe = subscribeToTaskChanges((updated) => {
      if (updated?.id === id) {
        receivedUpdate = true
        setState({ status: 'ready', task: updated })
      }
    })
    setState({ status: 'loading' })
    void getTask(id, controller.signal).then(
      (task) => {
        if (!controller.signal.aborted && !receivedUpdate) setState(task ? { status: 'ready', task } : { status: 'not-found' })
      },
      () => {
        if (!controller.signal.aborted && !receivedUpdate) setState({ status: 'error' })
      },
    )
    return () => {
      active.current = false
      controller.abort()
      unsubscribe()
    }
  }, [id, attempt])

  async function confirmDelete() {
    setDeletion('pending')
    try {
      await deleteTask(id)
      if (active.current) navigate(origin ?? { pathname: '/tasks', search }, { replace: true })
    } catch {
      setDeletion('error')
    }
  }

  return (
    <Stack spacing={2}>
      <Button component={Link} to={origin ?? '/'} sx={{ alignSelf: 'flex-start' }}>
        Назад к задачам
      </Button>
      {state.status === 'loading' && <CircularProgress aria-label="Загрузка задачи" />}
      {state.status === 'not-found' && <Alert severity="warning">Задача не найдена.</Alert>}
      {state.status === 'error' && (
        <Alert severity="error" action={<Button onClick={() => setAttempt(attempt + 1)}>Повторить</Button>}>
          Не удалось загрузить задачу.
        </Alert>
      )}
      {state.status === 'ready' && (
        <Paper
          component="article"
          variant="outlined"
          sx={{ p: { xs: 2, sm: 4 }, overflowWrap: 'anywhere', ...(state.task.completed && completedTaskSx) }}
        >
          <Stack spacing={2}>
            <Typography variant="h4" component="h2">{state.task.title}</Typography>
            <Typography color="text.secondary">{state.task.subject}</Typography>
            <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1}>
              <Chip label={state.task.completed ? 'Выполнена' : 'В работе'} color={state.task.completed ? 'success' : 'default'} />
              <Chip variant="outlined" {...priorities[state.task.priority]} />
            </Stack>
            <Typography>Срок <time dateTime={state.task.dueDate}>{dateFormat.format(new Date(state.task.dueDate))}</time></Typography>
            <Typography variant="h6" component="h3">Описание</Typography>
            <Typography sx={{ whiteSpace: 'pre-wrap' }}>{state.task.description || 'Описание отсутствует.'}</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <TaskCompletionButton task={state.task} />
              <Button color="error" onClick={() => setDeletion('confirm')}>Удалить задачу</Button>
            </Stack>
            <DeleteTaskDialog
              open={deletion !== 'closed'}
              taskTitle={state.task.title}
              pending={deletion === 'pending'}
              failed={deletion === 'error'}
              onCancel={() => setDeletion('closed')}
              onConfirm={confirmDelete}
            />
          </Stack>
        </Paper>
      )}
    </Stack>
  )
}
