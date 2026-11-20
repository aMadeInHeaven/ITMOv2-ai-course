import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import { useId } from 'react'

interface DeleteTaskDialogProps {
  open: boolean
  taskTitle: string
  onCancel: () => void
  onConfirm: () => void
  pending: boolean
  failed: boolean
}

export default function DeleteTaskDialog({ open, taskTitle, onCancel, onConfirm, pending, failed }: DeleteTaskDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  return (
    <Dialog open={open} onClose={pending ? undefined : onCancel} aria-labelledby={titleId} aria-describedby={descriptionId}>
      <DialogTitle id={titleId}>Точно хотите удалить?</DialogTitle>
      <DialogContent>
        <DialogContentText id={descriptionId} sx={{ overflowWrap: 'anywhere' }}>{taskTitle}</DialogContentText>
        {failed && <Alert severity="error" sx={{ mt: 2 }}>Не удалось удалить задачу. Попробуйте ещё раз.</Alert>}
      </DialogContent>
      <DialogActions>
        <Button autoFocus disabled={pending} onClick={onCancel}>Отмена</Button>
        <Button variant="contained" color="error" disabled={pending} onClick={onConfirm}>
          Удалить навсегда
        </Button>
      </DialogActions>
    </Dialog>
  )
}
