import TaskSummary from '../components/TaskSummary'
import TaskList, { type TaskListState } from '../components/TaskList'
import { getLocalToday } from '../utils/taskDisplay'
import { tasksForView, type TaskView } from '../utils/taskViews'

const pageText = {
  overview: ['Обзор', 'Ваши задачи на сегодня и ближайшие дни.', 'На ближайшие дни задач нет.'],
  today: ['Сегодня', 'Задачи, которые нужно выполнить сегодня.', 'На сегодня задач нет.'],
  week: ['На этой неделе', 'Задачи с понедельника по воскресенье.', 'На этой неделе задач нет.'],
  completed: ['Выполненные', 'Задачи, которые вы уже завершили.', 'Выполненных задач пока нет.'],
}

export default function TaskViewPage({ view, state, onRefresh }: {
  view: TaskView
  state: TaskListState
  onRefresh: () => void
}) {
  const [title, subtitle, emptyMessage] = pageText[view]
  const today = getLocalToday()
  const tasks = tasksForView(state.tasks, view, today).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const groups = view === 'overview' && tasks.length > 0
    ? [
        { heading: 'Сегодня', tasks: tasks.filter(task => task.dueDate === today) },
        { heading: 'Далее на неделе', tasks: tasks.filter(task => task.dueDate > today) },
      ].filter(group => group.tasks.length > 0)
    : [{ heading: 'Задачи', tasks }]
  return (
    <>
      <header className="page-heading"><h1>{title}</h1><p>{subtitle}</p></header>
      {state.status === 'success' && <TaskSummary tasks={state.tasks} today={today} />}
      {groups.map(group => <TaskList key={group.heading} heading={group.heading} state={{ status: state.status, tasks: group.tasks }}
        onRefresh={onRefresh} emptyMessage={state.tasks.length ? emptyMessage : undefined} />)}
    </>
  )
}
