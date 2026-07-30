import { useEffect, useRef } from 'react'
import { copyByLanguage, type Language } from '../i18n.ts'
import './ConfirmResetDialog.css'

interface ConfirmResetDialogProps {
  readonly isOpen: boolean
  readonly language: Language
  readonly onCancel: () => void
  readonly onConfirm: () => void
}

export function ConfirmResetDialog({
  isOpen,
  language,
  onCancel,
  onConfirm,
}: ConfirmResetDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const copy = copyByLanguage[language].reset

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog === null) {
      return
    }

    if (isOpen && !dialog.open) {
      dialog.showModal()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  return (
    <dialog
      ref={dialogRef}
      className="reset-dialog"
      onCancel={(event) => {
        event.preventDefault()
        onCancel()
      }}
      onClose={onCancel}
      aria-labelledby="reset-dialog-title"
    >
      <p className="section-kicker">{copy.kicker}</p>
      <h2 id="reset-dialog-title">{copy.title}</h2>
      <p>{copy.description}</p>
      <div className="reset-dialog__actions">
        <button type="button" className="text-action" onClick={onCancel}>
          {copy.cancel}
        </button>
        <button type="button" className="danger-action" onClick={onConfirm}>
          {copy.confirm}
        </button>
      </div>
    </dialog>
  )
}
