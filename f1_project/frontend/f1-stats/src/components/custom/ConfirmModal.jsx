import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function ConfirmModal({ isOpen, onClose, onConfirm }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleOpenChange = (open) => {
    if (!open && !isSubmitting) {
      setError("")
      onClose()
    }
  }

  const handleConfirm = async (event) => {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    setError("")
    setIsSubmitting(true)

    try {
      await onConfirm()
    } catch (confirmError) {
      setError(
        typeof confirmError?.message === "string" && confirmError.message
          ? confirmError.message
          : "No se pudo eliminar la cuenta. Inténtalo de nuevo."
      )
      setIsSubmitting(false)
      return
    }

    setIsSubmitting(false)
    onClose()
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Seguro que quieres eliminar tu cuenta?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminarán permanentemente tu cuenta
            y los datos asociados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel className="cursor-pointer" disabled={isSubmitting}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction className="cursor-pointer hover:bg-red-600/75" onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Eliminando..." : "Eliminar cuenta"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
