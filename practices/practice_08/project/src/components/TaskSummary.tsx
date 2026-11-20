import type { Task } from '../types'
import PlannerIcon from './PlannerIcon'

interface TaskSummaryProps {
  tasks: Task[]
  today: string
}

export default function TaskSummary({ tasks, today }: TaskSummaryProps) {
  const metrics = [
    { label: 'Всего задач', value: tasks.length, icon: 'list' },
    { label: 'На сегодня', value: tasks.filter(task => !task.completed && task.dueDate === today).length, icon: 'today' },
    { label: 'Выполнено', value: tasks.filter(task => task.completed).length, icon: 'completed' },
  ] as const
  return (
    <section aria-label="Сводка задач">
      <dl className="metrics">
        {metrics.map(({ label, value, icon }) => (
          <div key={label} className="metric">
            <dt><span className="metric-icon"><PlannerIcon name={icon} size={22} /></span>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
