import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { CARD_OF_SETTING, type SettingCardId } from '@renderer/utils/tracked-settings'

interface FocusState {
  focusSetting?: string
}

/** The tracked-setting id we were asked to deep-link to (via navigate state). */
export function useFocusSettingId(): string | undefined {
  const location = useLocation()
  return (location.state as FocusState | null)?.focusSetting
}

/** The accordion ("card") that must be expanded to reveal the focused setting. */
export function useFocusedCard(): SettingCardId | undefined {
  const id = useFocusSettingId()
  return id ? CARD_OF_SETTING[id] : undefined
}

/**
 * After arriving on a page with a focus target, scroll the matching element
 * (id=`setting-<id>`) into view and pulse it. Hosted once in BasePage so every
 * page gets it for free. The short delay lets any accordion open-animation settle.
 */
export function useScrollToFocusedSetting(): void {
  const id = useFocusSettingId()
  useEffect(() => {
    if (!id) return
    let raf = 0
    let cleanupPulse = 0
    const timer = setTimeout(() => {
      const el = document.getElementById(`setting-${id}`)
      if (!el) return
      raf = requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.classList.add('setting-focus-pulse')
        cleanupPulse = window.setTimeout(() => el.classList.remove('setting-focus-pulse'), 1800)
      })
    }, 300)
    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(raf)
      clearTimeout(cleanupPulse)
    }
  }, [id])
}
