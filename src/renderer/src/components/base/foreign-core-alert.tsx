import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { TriangleAlert } from 'lucide-react'
import { useForeignCoreStore } from '@renderer/store/foreign-core-store'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle
} from '@renderer/components/ui/alert-dialog'

// Full-screen, blocking warning (background blur) shown when another mihomo core is already
// running and the user tries to bring the VPN/TUN up. "Ignore" (gray) proceeds — the caller
// resumes its connect; "Cancel" (red) leaves the VPN off. Escape = Cancel. The detected
// client name(s) are listed under the message. (App startup uses a non-blocking toast instead.)
const ForeignCoreAlert = () => {
  const { t } = useTranslation()
  const warning = useForeignCoreStore((s) => s.warning)
  const onProceed = useForeignCoreStore((s) => s.onProceed)
  const onCancel = useForeignCoreStore((s) => s.onCancel)
  const close = useForeignCoreStore((s) => s.close)

  // Ensure exactly one of proceed/cancel runs per prompt — a button's onClick and the dialog's
  // onOpenChange both fire for a single interaction.
  const decided = useRef(false)
  useEffect(() => {
    if (warning) decided.current = false
  }, [warning])

  const decide = (action?: (() => void) | null): void => {
    if (decided.current) return
    decided.current = true
    action?.()
    close()
  }

  const clients = warning?.clients ?? []

  return (
    <AlertDialog open={warning !== null} onOpenChange={(open) => !open && decide(onCancel)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <TriangleAlert className="size-8 text-amber-500" />
          </AlertDialogMedia>
          <AlertDialogTitle>{warning?.title}</AlertDialogTitle>
          <AlertDialogDescription className="whitespace-pre-line break-words">
            {warning?.message}
            {clients.length > 0 && (
              <span className="mt-2 block font-medium text-foreground/80">
                {clients.join(', ')}
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction variant="secondary" onClick={() => decide(onProceed)}>
            {t('common.ignore')}
          </AlertDialogAction>
          <AlertDialogCancel variant="destructive" onClick={() => decide(onCancel)}>
            {t('common.cancel')}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ForeignCoreAlert
