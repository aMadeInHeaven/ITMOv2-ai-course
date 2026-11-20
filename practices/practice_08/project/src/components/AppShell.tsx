import { Outlet } from 'react-router-dom'
import AddTaskDialog from './AddTaskDialog'
import SidebarNavigation from './SidebarNavigation'
import PlannerIcon from './PlannerIcon'
import type { TaskListState } from './TaskList'

export default function AppShell({ state }: { state: TaskListState }) {
  const now = new Date()
  const date = now.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
  return (
    <div className="planner">
      <header className="sidebar">
        <div className="brand"><span className="brand-icon"><PlannerIcon name="check" size={23} /></span>FocusBoard</div>
        <SidebarNavigation state={state} />
      </header>
      <main className="workspace">
        <div className="context-line"><span>Мои задачи</span><time>{date}</time></div>
        <Outlet />
      </main>
      <AddTaskDialog />
    </div>
  )
}
