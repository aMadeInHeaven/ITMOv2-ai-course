import type { Priority } from '../types'

export const priorities = {
  high: {
    label: 'Высокий приоритет',
    sx: { color: '#b42318', bgcolor: '#fef3f2', borderColor: '#f5aaa3' },
  },
  medium: {
    label: 'Средний приоритет',
    sx: { color: '#715000', bgcolor: '#fff2bf', borderColor: '#e9c857' },
  },
  low: {
    label: 'Низкий приоритет',
    sx: { color: '#176547', bgcolor: '#e6f1eb', borderColor: '#94c9ac' },
  },
} satisfies Record<Priority, { label: string; sx: { color: string; bgcolor: string; borderColor: string } }>

export const completedTaskSx = { bgcolor: '#edf7ed', borderColor: '#a6d4a9' }

export function getLocalToday() {
  const now = new Date()
  const year = String(now.getFullYear()).padStart(4, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return [year, month, day].join('-')
}

export const dateFormat = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric', month: 'long',
  timeZone: 'UTC',
})
