import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import BasePage from '@renderer/components/base/base-page'
import SettingCard from '@renderer/components/base/base-setting-card'
import SettingItem from '@renderer/components/base/base-setting-item'
import { Switch } from '@renderer/components/ui/switch'
import { useAppConfig } from '@renderer/hooks/use-app-config'
import {
  ProfileIcon,
  ProxiesIcon,
  ConnectionsIcon,
  RulesIcon
} from '@renderer/components/icons/sidebar-icons'

const SettingsTabs: React.FC = () => {
  const { t } = useTranslation()
  const { appConfig, patchAppConfig } = useAppConfig()
  const {
    enableProfilesTab = false,
    enableProxiesTab = false,
    enableConnectionsTab = false,
    enableRulesTab = false
  } = appConfig || {}

  return (
    <BasePage title={t('settings.tabs.title')} showBackButton>
      <SettingCard>
        <SettingItem
          title={
            <span className="inline-flex items-center">
              <Trans
                i18nKey="settings.tabs.enableProfiles"
                components={{ icon: <ProfileIcon className="size-4 mx-1.5 shrink-0" /> }}
              />
            </span>
          }
          divider
        >
          <Switch
            checked={enableProfilesTab}
            onCheckedChange={(enable: boolean) => {
              patchAppConfig({ enableProfilesTab: enable })
            }}
          />
        </SettingItem>
        <SettingItem
          title={
            <span className="inline-flex items-center">
              <Trans
                i18nKey="settings.tabs.enableProxies"
                components={{ icon: <ProxiesIcon className="size-4 mx-1.5 shrink-0" /> }}
              />
            </span>
          }
          divider
        >
          <Switch
            checked={enableProxiesTab}
            onCheckedChange={(enable: boolean) => {
              patchAppConfig({ enableProxiesTab: enable })
            }}
          />
        </SettingItem>
        <SettingItem
          title={
            <span className="inline-flex items-center">
              <Trans
                i18nKey="settings.tabs.enableConnections"
                components={{ icon: <ConnectionsIcon className="size-4 mx-1.5 shrink-0" /> }}
              />
            </span>
          }
          divider
        >
          <Switch
            checked={enableConnectionsTab}
            onCheckedChange={(enable: boolean) => {
              patchAppConfig({ enableConnectionsTab: enable })
            }}
          />
        </SettingItem>
        <SettingItem
          title={
            <span className="inline-flex items-center">
              <Trans
                i18nKey="settings.tabs.enableRules"
                components={{ icon: <RulesIcon className="size-4 mx-1.5 shrink-0" /> }}
              />
            </span>
          }
        >
          <Switch
            checked={enableRulesTab}
            onCheckedChange={(enable: boolean) => {
              patchAppConfig({ enableRulesTab: enable })
            }}
          />
        </SettingItem>
      </SettingCard>
    </BasePage>
  )
}

export default SettingsTabs
