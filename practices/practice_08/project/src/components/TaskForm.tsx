import { Alert, Box, Button, CircularProgress, Stack, TextField } from '@mui/material'
import { useEffect, useId, useState, type FormEvent } from 'react'
import { listTasks, type CreateTaskInput } from '../api'
import type { Task } from '../types'
import { getLocalToday } from '../utils/taskDisplay'

interface TaskFormProps {
  headingId: string
  pending: boolean
  failed: boolean
  onSubmit: (input: CreateTaskInput) => void
  onCancel: () => void
  onDirtyChange: (dirty: boolean) => void
}

type FormValues = Omit<CreateTaskInput, 'priority'> & { priority: string }
type FieldErrors = Partial<Record<keyof FormValues, string>>

const emptyValues: FormValues = { title: '', subject: '', dueDate: '', priority: '', description: '' }

const descriptionLimit = 1000

function normalizeText(text: string) {
  return text.trim().replace(/\s+/g, ' ')
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000-')) {
    return false
  }

  const date = new Date(value)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export default function TaskForm({ headingId, pending, failed, onSubmit, onCancel, onDirtyChange }: TaskFormProps) {
  const id = useId()
  const [values, setValues] = useState(emptyValues)
  const [errors, setErrors] = useState<FieldErrors>({})

  const [existingTasks, setExistingTasks] = useState<Task[]>([])
  const [duplicateWarning, setDuplicateWarning] = useState(false)
  const descriptionLength = values.description?.length ?? 0
  const descriptionOverflow = descriptionLength > descriptionLimit

  useEffect(() => {
    const controller = new AbortController()
    void listTasks(controller.signal).then(
      (tasks) => { if (!controller.signal.aborted) setExistingTasks(tasks) },
      () => { /* Duplicate hints are advisory when the catalogue is unavailable. */ },
    )
    return () => controller.abort()
  }, [])

  function updateField(field: keyof FormValues, value: string) {
    const next = { ...values, [field]: value }
    setValues(next)
    onDirtyChange(Object.values(next).some(Boolean))
    setDuplicateWarning(false)
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return

    const form = event.currentTarget
    const title = normalizeText(values.title)
    const subject = normalizeText(values.subject)
    const { dueDate, priority } = values
    const validPriority = priority === 'low' || priority === 'medium' || priority === 'high'
    const dateInput = form.elements.namedItem('dueDate')
    const badDateInput = dateInput instanceof HTMLInputElement && dateInput.validity.badInput

    const nextErrors: FieldErrors = {}
    if (!title) nextErrors.title = 'Введите название.'
    if (!subject) nextErrors.subject = 'Введите тему.'
    if (badDateInput || (dueDate && !isValidDate(dueDate))) {
      nextErrors.dueDate = 'Введите корректную дату.'
    } else if (!dueDate) {
      nextErrors.dueDate = 'Укажите дату.'
    } else if (dueDate < getLocalToday()) {
      nextErrors.dueDate = 'Выберите сегодняшнюю или более позднюю дату.'
    }
    if (!validPriority) nextErrors.priority = 'Выберите приоритет.'
    if (descriptionOverflow) nextErrors.description = 'Сократите описание.'
    setErrors(nextErrors)

    const firstInvalidField = Object.keys(nextErrors)[0]
    if (firstInvalidField || !validPriority) {
      const field = form.elements.namedItem(firstInvalidField ?? 'priority')
      if (field instanceof HTMLElement) field.focus()
      return
    }

    const duplicate = existingTasks.some((task) =>
      task.dueDate === dueDate && normalizeText(task.title).toLowerCase() === title.toLowerCase() &&
      normalizeText(task.subject).toLowerCase() === subject.toLowerCase(),
    )
    if (duplicate && !duplicateWarning) {
      setDuplicateWarning(true)
      return
    }

    const description = values.description?.trim().split(/\r?\n/).map(normalizeText).join('\n').replace(/\n{3,}/g, '\n\n')
    onSubmit({ title, subject, dueDate, priority, description: description || undefined })
  }

  return (
    <Box component="form" aria-labelledby={headingId} noValidate onSubmit={submit} sx={{ pt: 1 }}>
      <div className="task-form-grid">
        <TextField
          id={`${id}-title`}
          name="title"
          autoFocus
          label="Название"
          value={values.title}
          onChange={(event) => updateField('title', event.target.value)}
          error={Boolean(errors.title)}
          helperText={errors.title}
          disabled={pending}
          required
        />
        <TextField
          id={`${id}-subject`}
          name="subject"
          label="Тема"
          value={values.subject}
          onChange={(event) => updateField('subject', event.target.value)}
          error={Boolean(errors.subject)}
          helperText={errors.subject}
          disabled={pending}
          required
        />
        <TextField
          id={`${id}-due-date`}
          name="dueDate"
          label="Дата"
          type="date"
          value={values.dueDate}
          onChange={(event) => updateField('dueDate', event.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          error={Boolean(errors.dueDate)}
          helperText={errors.dueDate}
          disabled={pending}
          required
        />
        <TextField
          id={`${id}-priority`}
          name="priority"
          label="Приоритет"
          value={values.priority}
          onChange={(event) => updateField('priority', event.target.value)}
          select
          slotProps={{ inputLabel: { shrink: true }, select: { native: true } }}
          error={Boolean(errors.priority)}
          helperText={errors.priority}
          disabled={pending}
          required
        >
          <option value="">Выберите приоритет</option>
          <option value="low">Низкий</option>
          <option value="medium">Средний</option>
          <option value="high">Высокий</option>
        </TextField>
        <TextField
          id={`${id}-description`}
          name="description"
          label="Описание"
          value={values.description}
          onChange={(event) => updateField('description', event.target.value)}
          disabled={pending}
          error={descriptionOverflow}
          helperText={`${descriptionLength} / ${descriptionLimit}${descriptionOverflow ? ' — Сократите описание.' : ''}`}
          multiline
          minRows={2}
        />
        {duplicateWarning && <Alert severity="warning">Задача с таким названием, темой и датой уже существует.</Alert>}
        <Stack className="form-actions" direction="row" spacing={1.5} alignItems="center" justifyContent="flex-end">
          <Button type="button" variant="outlined" onClick={onCancel} disabled={pending}>Отмена</Button>
          <Button type="submit" variant="contained" disabled={pending}>
            {pending ? 'Добавление задачи…' : duplicateWarning ? 'Всё равно добавить' : 'Добавить задачу'}
          </Button>
          {pending && <CircularProgress size={20} aria-label="Добавление задачи" />}
        </Stack>
        {failed && (
          <Alert
            severity="error"
            action={<Button type="submit" color="inherit">Повторить</Button>}
            sx={{ alignItems: 'center' }}
          >
            Не удалось добавить задачу.
          </Alert>
        )}
      </div>
    </Box>
  )
}
