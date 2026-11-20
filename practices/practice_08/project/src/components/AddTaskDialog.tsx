import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Fab, Snackbar } from '@mui/material'
import { useId, useRef, useState } from 'react'
import { createTask, type CreateTaskInput } from '../api'
import TaskForm from './TaskForm'

type Phase = 'closed' | 'editing' | 'pending' | 'error' | 'created'

export default function AddTaskDialog() {
  const headingId = useId()
  const [phase, setPhase] = useState<Phase>('closed')
  const confirmId = useId()
  const [dirty, setDirty] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const inFlight = useRef(false)
  const open = phase === 'editing' || phase === 'pending' || phase === 'error'

  async function save(input: CreateTaskInput) {
    // Two submit events can arrive before React disables the button.
    if (inFlight.current) return
    inFlight.current = true
    setPhase('pending')
    try {
      await createTask(input)
      setPhase('created')
    } catch {
      setPhase('error')
    } finally {
      inFlight.current = false
    }
  }

  function dismiss() {
    if (inFlight.current) return
    if (dirty) setConfirmDiscard(true)
    else setPhase('closed')
  }

  return (
    <>
      <Fab color="primary" variant="extended" aria-label="Добавить задачу" aria-haspopup="dialog"
        onClick={() => { setDirty(false); setPhase('editing') }}
        sx={{ position: 'fixed', right: { xs: 16, md: 36 }, bottom: { xs: 16, md: 28 }, borderRadius: '8px', px: 2.75, height: 48, boxShadow: '0 4px 14px #174c3a20' }}>
        <Box component="span" aria-hidden="true" sx={{ mr: 1, fontSize: 24 }}>+</Box>
        Добавить задачу
      </Fab>
      <Dialog open={open} onClose={dismiss} aria-labelledby={headingId} fullWidth maxWidth="md" className="new-task-dialog">
        <DialogTitle id={headingId}>Новая задача</DialogTitle>
        <DialogContent>
          {open && <TaskForm headingId={headingId} pending={phase === 'pending'} failed={phase === 'error'}
            onSubmit={save} onCancel={dismiss} onDirtyChange={setDirty} />}
        </DialogContent>
      </Dialog>
      <Dialog open={confirmDiscard} onClose={() => setConfirmDiscard(false)} aria-labelledby={confirmId}>
        <DialogTitle id={confirmId}>Отменить изменения?</DialogTitle>
        <DialogActions>
          <Button autoFocus onClick={() => setConfirmDiscard(false)}>Продолжить редактирование</Button>
          <Button color="error" onClick={() => { setConfirmDiscard(false); setPhase('closed') }}>Отбросить</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={phase === 'created'} autoHideDuration={4000}
        onClose={(_, reason) => { if (reason !== 'clickaway') setPhase('closed') }}>
        <Alert severity="success">Задача добавлена.</Alert>
      </Snackbar>
    </>
  )
}
