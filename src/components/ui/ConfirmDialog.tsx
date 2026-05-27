// src/components/ui/ConfirmDialog.tsx
import Modal from './Modal'

interface Props {
  open: boolean
  title?: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
  danger?: boolean
}

export default function ConfirmDialog({
  open, title = 'Confirm', message, confirmLabel = 'Confirm',
  onConfirm, onCancel, loading, danger
}: Props) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm"
      footer={
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="btn btn-outline btn-sm">Cancel</button>
          <button onClick={onConfirm} disabled={loading}
            className={`btn btn-sm ${danger ? 'btn-danger' : 'btn-primary'}`}>
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      }>
      <p className="text-sm text-gray-600">{message}</p>
    </Modal>
  )
}
