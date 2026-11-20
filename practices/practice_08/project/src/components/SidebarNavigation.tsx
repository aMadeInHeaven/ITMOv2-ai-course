import { NavLink } from 'react-router-dom'
import { useMediaQuery, useTheme } from '@mui/material'
import { getLocalToday } from '../utils/taskDisplay'
import { tasksForView } from '../utils/taskViews'
import type { TaskListState } from './TaskList'
import PlannerIcon from './PlannerIcon'

const destinations = [
  { to: '/', label: 'Обзор', icon: 'overview' },
  { to: '/today', label: 'Сегодня', icon: 'today' },
  { to: '/week', label: 'На этой неделе', icon: 'week' },
  { to: '/tasks', label: 'Все задачи', icon: 'list' },
  { to: '/completed', label: 'Выполненные', icon: 'completed' },
] as const

export default function SidebarNavigation({ state }: { state: TaskListState }) {
  const today = getLocalToday()
  const counts = {
    today: tasksForView(state.tasks, 'today', today).length,
    week: tasksForView(state.tasks, 'week', today).length,
    list: state.tasks.length,
    completed: state.tasks.filter(task => task.completed).length,
  }
  const compact = useMediaQuery(useTheme().breakpoints.down('md'))
  return (
    <nav className="side-nav" aria-label="Навигация по задачам"
      style={{ flexDirection: compact ? 'row' : 'column', overflowX: compact ? 'auto' : 'visible' }}>
      {destinations.map(({ to, label, icon }) => (
        <NavLink key={to} to={to} end={to !== '/tasks'} aria-label={label}>
          <PlannerIcon name={icon} /><span>{label}</span>
          {icon !== 'overview' && state.status === 'success' && <span className="nav-count">{counts[icon]}</span>}
        </NavLink>
      ))}
    </nav>
  )
}
