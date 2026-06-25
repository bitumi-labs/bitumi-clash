import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import React, { useEffect, useState } from 'react'
import { useRoutes } from 'react-router-dom'
import useSWR from 'swr'
import './i18n'
import { useTranslation } from 'react-i18next'
import routes from '@renderer/routes'
import { useAppConfig } from '@renderer/hooks/use-app-config'
import {
  applyTheme,
  checkUpdate,
  getForeignCoreWarning,
  needsFirstRunAdmin,
  restartAsAdmin,
  setNativeTheme
} from '@renderer/utils/ipc'
import { platform } from '@renderer/utils/init'
import { useControledMihomoConfig } from '@renderer/hooks/use-controled-mihomo-config'
import { useForeignCoreStore, type ForeignCoreWarning } from '@renderer/store/foreign-core-store'
import ConfirmModal from '@renderer/components/base/base-confirm'
import ForeignCoreAlert from '@renderer/components/base/foreign-core-alert'
import { SidebarProvider } from '@renderer/components/ui/sidebar'
import HwidLimitAlert from '@renderer/components/profiles/hwid-limit-alert'
import WindowControls from '@renderer/components/window-controls'
import { attachConnectionsStore } from '@renderer/store/connections-store'
import { attachTrafficStore } from '@renderer/store/traffic-store'
import { attachLogsStore } from '@renderer/store/logs-store'
import { attachCoreLifecycleStore } from '@renderer/store/core-lifecycle-store'
import { attachStatusLogStore } from '@renderer/store/status-log-store'
import { attachUpdaterStore } from '@renderer/store/updater-store'
import UpdateBanner from '@renderer/components/updater/update-banner'

const App: React.FC = () => {
  const { t } = useTranslation()
  const { appConfig } = useAppConfig()
  const { patchControledMihomoConfig } = useControledMihomoConfig()
  const { appTheme = 'system', customTheme, autoCheckUpdate } = appConfig || {}
  const { setTheme, systemTheme } = useTheme()
  const page = useRoutes(routes)
  const { data: latest } = useSWR(
    autoCheckUpdate ? ['checkUpdate'] : undefined,
    autoCheckUpdate ? checkUpdate : (): undefined => {},
    {
      refreshInterval: 1000 * 60 * 10
    }
  )

  useEffect(() => {
    const detachConnections = attachConnectionsStore()
    const detachTraffic = attachTrafficStore()
    const detachLogs = attachLogsStore()
    const detachCoreLifecycle = attachCoreLifecycleStore()
    const detachStatusLog = attachStatusLogStore()
    const detachUpdater = attachUpdaterStore()
    return (): void => {
      detachConnections()
      detachTraffic()
      detachLogs()
      detachCoreLifecycle()
      detachStatusLog()
      detachUpdater()
    }
  }, [])

  useEffect(() => {
    setNativeTheme(appTheme)
    setTheme(appTheme)
  }, [appTheme, systemTheme])

  useEffect(() => {
    // Wait for the real config before applying — the main process already injects the
    // resolved theme before showing the window, and applying 'default.css' on the initial
    // undefined render would re-inject a transient default and flash for disk-theme users.
    if (!appConfig) return
    applyTheme(customTheme || 'default.css')
  }, [appConfig, customTheme])

  const [showQuitConfirm, setShowQuitConfirm] = useState(false)
  const [showAdminRequired, setShowAdminRequired] = useState(false)

  useEffect(() => {
    const handleShowQuitConfirm = (): void => {
      setShowQuitConfirm(true)
    }

    window.electron.ipcRenderer.on('show-quit-confirm', handleShowQuitConfirm)

    const handleShowError = (_event: unknown, title: string, message: string): void => {
      toast.error(title, { description: message })
    }
    window.electron.ipcRenderer.on('showError', handleShowError)

    const handleNeedsAdminSetup = (): void => {
      setShowAdminRequired(true)
    }
    window.electron.ipcRenderer.on('needs-admin-setup', handleNeedsAdminSetup)

    const handleForeignCoreWarning = (_event: unknown, payload: ForeignCoreWarning): void => {
      // Pushed by the main-process gate (tray / shortcut enable), which kept TUN *off* because
      // another core is running. "Ignore" enables it anyway (bypassing the gate); "Cancel"
      // leaves it off — TUN was never brought up.
      useForeignCoreStore.getState().open({
        warning: payload,
        onProceed: () =>
          void patchControledMihomoConfig(
            { tun: { enable: true }, dns: { enable: true } },
            { bypassForeignCoreCheck: true }
          )
      })
    }
    window.electron.ipcRenderer.on('foreign-core-warning', handleForeignCoreWarning)

    if (platform === 'win32') {
      needsFirstRunAdmin().then((needs) => {
        if (needs) setShowAdminRequired(true)
      })
    }

    // Pull the boot-time foreign-core check now that listeners are registered (a pushed
    // event at startup races the renderer load and gets dropped while it is still loading).
    // At startup we only *inform* with a non-blocking toast — no client list, just the
    // message — and never block launch. (The connect-time alert is where the user decides.)
    getForeignCoreWarning()
      .then((warning) => {
        if (warning) toast.warning(warning.title, { description: warning.message, id: 'foreign-core' })
      })
      .catch(() => {})

    return (): void => {
      window.electron.ipcRenderer.removeAllListeners('show-quit-confirm')
      window.electron.ipcRenderer.removeAllListeners('needs-admin-setup')
      window.electron.ipcRenderer.removeAllListeners('showError')
      window.electron.ipcRenderer.removeAllListeners('foreign-core-warning')
    }
  }, [])

  const handleQuitConfirm = (confirmed: boolean): void => {
    setShowQuitConfirm(false)
    window.electron.ipcRenderer.send('quit-confirm-result', confirmed)
  }

  return (
    <SidebarProvider
      defaultOpen={false}
      className="app-shell relative w-full h-screen overflow-hidden"
    >
      {showQuitConfirm && (
        <ConfirmModal
          title={t('modal.confirmQuit')}
          description={
            <div>
              <p></p>
              <p className="text-sm text-gray-500 mt-2">{t('modal.quitWarning')}</p>
              <p className="text-sm text-gray-400 mt-1">
                {t('modal.quickQuitHint')} {platform === 'darwin' ? '⌘Q' : 'Ctrl+Q'}{' '}
                {t('modal.canQuitDirectly')}
              </p>
            </div>
          }
          confirmText={t('common.quit')}
          cancelText={t('common.cancel')}
          onChange={(open) => {
            if (!open) {
              handleQuitConfirm(false)
            }
          }}
          onConfirm={() => handleQuitConfirm(true)}
        />
      )}
      {showAdminRequired && (
        <ConfirmModal
          title={t('modal.adminRequired')}
          description={
            <div>
              <p className="text-sm">{t('modal.adminRequiredDesc')}</p>
            </div>
          }
          confirmText={t('modal.restartAsAdmin')}
          onChange={(open) => {
            if (!open) {
              setShowAdminRequired(false)
            }
          }}
          onConfirm={async () => {
            await restartAsAdmin()
          }}
          className="guide-admin-required-modal"
        />
      )}
      <HwidLimitAlert />
      <ForeignCoreAlert />
      {latest?.version && <UpdateBanner latest={latest} />}
      {platform === 'darwin' && (
        <div className="fixed top-0.5 -left-1 h-10 flex items-center pl-3 z-100 app-drag">
          <WindowControls />
        </div>
      )}
      <div className="relative z-10 main grow h-full overflow-y-auto">{page}</div>
    </SidebarProvider>
  )
}

export default App
