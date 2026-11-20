import { Stack, TextField } from '@mui/material'
import { options, type Filters } from '../utils/taskFilters'

interface Props {
  filters: Filters
  onChange: (key: keyof Filters, value: string) => void
}

const fields = [
  ['priority', 'Приоритет'], ['status', 'Статус'], ['due', 'Дата'],
] as const

export default function TaskFilters({ filters, onChange }: Props) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
      {fields.map(([key, label]) => (
        <TextField
          key={key}
          id={`filter-${key}`}
          select
          fullWidth
          label={label}
          value={filters[key]}
          onChange={(event) => onChange(key, event.target.value)}
          slotProps={{ inputLabel: { shrink: true }, select: { native: true } }}
        >
          {Object.entries(options[key]).map(([value, text]) => (
            <option key={value} value={value}>{text}</option>
          ))}
        </TextField>
      ))}
    </Stack>
  )
}
