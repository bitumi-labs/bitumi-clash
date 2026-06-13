import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import SettingCard from '../base/base-setting-card'
import SettingItem from '../base/base-setting-item'
import { Switch } from '@renderer/components/ui/switch'
import { useAppConfig } from '@renderer/hooks/use-app-config'
import { LogsIcon } from '@renderer/components/icons/sidebar-icons'
import { ChevronRight } from 'lucide-react'

const TabSwitches: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { appConfig, patchAppConfig } = useAppConfig()
  const { enableLogsTab = false } = appConfig || {}

  return (
    <SettingCard>
      <SettingItem
        title={
          <span className="inline-flex items-center">
            <Trans
              i18nKey="settings.tabs.enableLogs"
              components={{ icon: <LogsIcon className="size-4 mx-1.5 shrink-0" /> }}
            />
          </span>
        }
        divider
      >
        <Switch
          checked={enableLogsTab}
          onCheckedChange={(enable: boolean) => {
            patchAppConfig({ enableLogsTab: enable })
          }}
        />
      </SettingItem>
      <button type="button" className="w-full" onClick={() => navigate('/settings/tabs')}>
        <SettingItem title={t('settings.tabs.seeMore')}>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </SettingItem>
      </button>
    </SettingCard>
  )
}

export default TabSwitches
