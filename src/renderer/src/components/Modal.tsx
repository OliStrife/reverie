import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { MAX_PLAYLIST_NAME } from '../../../shared/playlists'

type ModalProps = {
  title: string
  onClose: () => void
  className?: string
  children: React.ReactNode
}

export function Modal({ title, onClose, className = '', children }: ModalProps): React.JSX.Element {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal glass-card ${className}`} role="dialog" aria-label={title}>
        <h2 className="modal-title">{title}</h2>
        {children}
      </div>
    </div>,
    document.body
  )
}

type NameDialogProps = {
  title: string
  submitLabel: string
  initialName?: string
  onSubmit: (name: string) => void
  onClose: () => void
}

export function NameDialog({
  title,
  submitLabel,
  initialName = '',
  onSubmit,
  onClose
}: NameDialogProps): React.JSX.Element {
  const [name, setName] = useState(initialName)
  const clean = name.trim()

  return (
    <Modal title={title} onClose={onClose}>
      <form
        className="modal-form"
        onSubmit={(event) => {
          event.preventDefault()
          if (clean) onSubmit(clean)
        }}
      >
        <input
          className="text-input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Playlist name"
          maxLength={MAX_PLAYLIST_NAME}
          autoFocus
          onFocus={(event) => event.target.select()}
        />
        <div className="modal-actions">
          <button type="button" className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary-btn" disabled={!clean}>
            {submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  )
}

type ConfirmDialogProps = {
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose
}: ConfirmDialogProps): React.JSX.Element {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="modal-text">{message}</p>
      <div className="modal-actions">
        <button type="button" className="secondary-btn" onClick={onClose} autoFocus>
          Cancel
        </button>
        <button type="button" className="primary-btn danger" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
