import { create } from 'zustand'

export interface ForeignCoreWarning {
  title: string
  message: string
  /** Real client names of the other running cores (e.g. "clashapp"); shown in the alert. */
  clients?: string[]
}

interface ForeignCoreStore {
  warning: ForeignCoreWarning | null
  /** Run when the user chooses to proceed despite the conflict ("Ignore"). */
  onProceed: (() => void) | null
  /** Run when the user backs out ("Cancel" / Escape) without proceeding. */
  onCancel: (() => void) | null
  open: (args: {
    warning: ForeignCoreWarning
    onProceed?: () => void
    onCancel?: () => void
  }) => void
  close: () => void
}

export const useForeignCoreStore = create<ForeignCoreStore>((set) => ({
  warning: null,
  onProceed: null,
  onCancel: null,
  open: ({ warning, onProceed, onCancel }): void =>
    set({ warning, onProceed: onProceed ?? null, onCancel: onCancel ?? null }),
  close: (): void => set({ warning: null, onProceed: null, onCancel: null })
}))

// Promise-based confirm: show the full-screen warning and resolve true if the user proceeds
// ("Ignore"), false if they back out ("Cancel" / Escape). Lets a caller suspend its flow
// inline and continue (with its own status logging, etc.) only when the user accepts.
export function confirmForeignCore(warning: ForeignCoreWarning): Promise<boolean> {
  return new Promise((resolve) => {
    useForeignCoreStore.getState().open({
      warning,
      onProceed: () => resolve(true),
      onCancel: () => resolve(false)
    })
  })
}
