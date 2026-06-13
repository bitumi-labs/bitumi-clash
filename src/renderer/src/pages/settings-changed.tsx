import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import BasePage from '@renderer/components/base/base-page'
import SettingCard from '@renderer/components/base/base-setting-card'
import { ChevronRight, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useChangedSettings, type ChangedSetting } from '@renderer/hooks/use-changed-settings'
import { SECTION_ORDER, SECTION_LABEL_KEYS, type TrackSection } from '@renderer/utils/tracked-settings'

const SettingsChanged: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { changed } = useChangedSettings()

  const grouped = useMemo(() => {
    const map = new Map<TrackSection, ChangedSetting[]>()
    for (const item of changed) {
      const list = map.get(item.section) ?? []
      list.push(item)
      map.set(item.section, list)
    }
    return SECTION_ORDER.filter((s) => map.has(s)).map((section) => ({
      section,
      items: map.get(section)!
    }))
  }, [changed])

  return (
    <BasePage title={t('pages.changedSettings.title')} showBackButton>
      {changed.length === 0 ? (
        <div className="flex h-full w-full items-center justify-center">
          <div className="flex max-w-75 flex-col items-center gap-4 p-7 text-center">
            <CheckCircle2 className="size-16 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">
              {t('pages.changedSettings.noChanges')}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="mx-4 mb-2 mt-3 flex items-start gap-3 rounded-md border border-yellow-500/40 bg-yellow-500/10 p-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-yellow-600 dark:text-yellow-400" />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
                {t('pages.changedSettings.warningTitle')}
              </div>
              <p className="mt-0.5 text-xs text-yellow-700/80 dark:text-yellow-400/80">
                {t('pages.changedSettings.warningBody')}
              </p>
            </div>
          </div>
          {grouped.map(({ section, items }) => (
          <div key={section}>
            <h3 className="mx-4 mb-1 mt-3 text-sm font-semibold text-muted-foreground">
              {t(SECTION_LABEL_KEYS[section])}
            </h3>
            <SettingCard>
              {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.route, { state: { focusSetting: item.id } })}
                className="flex w-full items-center justify-between gap-4 rounded-md py-2 text-left transition-colors hover:bg-accent/40"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-md text-yellow-600 dark:text-yellow-400">
                    {t(item.labelKey)}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
                    <span className="text-foreground">
                      {t('pages.changedSettings.current')}: {item.current}
                    </span>
                    <span className="text-muted-foreground">
                      {t('pages.changedSettings.default')}: {item.default}
                    </span>
                  </div>
                </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </SettingCard>
          </div>
          ))}
        </>
      )}
    </BasePage>
  )
}

export default SettingsChanged
