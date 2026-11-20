import { Stack } from '@mui/material'
import { useSearchParams } from 'react-router-dom'
import TaskSummary from '../components/TaskSummary'
import TaskFilters from '../components/TaskFilters'
import TaskList, { type TaskListState } from '../components/TaskList'
import type { Task } from '../types'
import { getLocalToday } from '../utils/taskDisplay'
import { filterTasks, readFilters, type Filters } from '../utils/taskFilters'

export default function AllTasksPage({ state, onRefresh }: {
  state: TaskListState
  onRefresh: () => void
}) {
  const [params, setParams] = useSearchParams()
  const filters = readFilters(params)
  const today = getLocalToday()
  const groups = new Map<string, Task[]>()
  const visibleTasks = filterTasks(state.tasks, filters, today)
  for (const task of visibleTasks) {
    const group = groups.get(task.subject)
    if (group) group.push(task)
    else groups.set(task.subject, [task])
  }

  function updateFilter(key: keyof Filters, value: string) {
    const next = new URLSearchParams(params)
    if (value === 'all') next.delete(key)
    else next.set(key, value)
    setParams(next)
  }

  return (
    <Stack spacing={2}>
      <header className="page-heading"><h1>Все задачи</h1><p>Все задачи по темам и срокам.</p></header>
      {state.status === 'success' && <TaskSummary tasks={state.tasks} today={today} />}
      <TaskFilters filters={filters} onChange={updateFilter} />
      {groups.size === 0 && (
        <TaskList
          heading="Задачи"
          state={{ status: state.status, tasks: [] }}
          onRefresh={onRefresh}
          emptyMessage={state.tasks.length ? 'По выбранным фильтрам задач нет.' : 'Задач пока нет.'}
        />
      )}
      {Array.from(groups, ([subject, tasks]) => (
        <TaskList key={subject} heading={subject} state={{ status: state.status, tasks }} onRefresh={onRefresh} />
      ))}
    </Stack>
  )
}
