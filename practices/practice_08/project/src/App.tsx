import { CssBaseline, ThemeProvider } from '@mui/material'
import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import AllTasksPage from './pages/AllTasksPage'
import TaskDetailsPage from './pages/TaskDetailsPage'
import { listTasks, subscribeToTaskChanges } from './api'
import AppShell from './components/AppShell'
import type { TaskListState } from './components/TaskList'
import { theme } from './theme'
import type { Task } from './types'

import TaskViewPage from './pages/TaskViewPage'

export default function App() {
  const [state, setState] = useState<TaskListState>({ status: 'loading', tasks: [] })
  const [requestCount, setRequestCount] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const changes = new Map<string, Task | null>()
    const unsubscribe = subscribeToTaskChanges((updated, deletedId) => {
      if (updated) {
        changes.set(updated.id, updated)
        saveTask(updated)
      } else if (deletedId) {
        changes.set(deletedId, null)
        setState(current => ({ ...current, tasks: current.tasks.filter(task => task.id !== deletedId) }))
      }
    })

    void listTasks(controller.signal).then(
      (tasks) => {
        if (controller.signal.aborted) return
        const catalogue = new Map(tasks.map(task => [task.id, task]))
        for (const [id, updated] of changes) {
          if (updated) catalogue.set(id, updated)
          else catalogue.delete(id)
        }
        setState({ status: 'success', tasks: Array.from(catalogue.values()) })
      },
      () => {
        if (!controller.signal.aborted) {
          setState((current) => ({ ...current, status: 'error' }))
        }
      },
    )

    return () => {
      controller.abort()
      unsubscribe()
    }
  }, [requestCount])

  function refresh() {
    setState((current) => ({ ...current, status: 'loading' }))
    setRequestCount((count) => count + 1)
  }

  function saveTask(task: Task) {
    setState((current) => ({
      ...current,
      tasks: current.tasks.some(({ id }) => id === task.id)
        ? current.tasks.map((existing) => existing.id === task.id ? task : existing)
        : [...current.tasks, task],
    }))
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route element={<AppShell state={state} />}>
          <Route index element={<TaskViewPage view="overview" state={state} onRefresh={refresh} />} />
          <Route path="today" element={<TaskViewPage view="today" state={state} onRefresh={refresh} />} />
          <Route path="week" element={<TaskViewPage view="week" state={state} onRefresh={refresh} />} />
          <Route path="tasks" element={<AllTasksPage state={state} onRefresh={refresh} />} />
          <Route path="completed" element={<TaskViewPage view="completed" state={state} onRefresh={refresh} />} />
          <Route path="tasks/:id" element={<TaskDetailsPage />} />
        </Route>
      </Routes>
    </ThemeProvider>
  )
}
