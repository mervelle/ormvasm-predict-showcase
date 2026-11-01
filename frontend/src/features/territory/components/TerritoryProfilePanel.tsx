import { useState } from 'react'
import type { ReactNode } from 'react'

import type {
  RankingMetric,
  RegionEditorial,
  TerritoryProfile,
  TerritoryTab,
} from '../../../types/territoryTypes'
import { TerritoryClimateTab } from './TerritoryClimateTab'
import { TerritoryOverviewTab } from './TerritoryOverviewTab'
import { TerritoryRankingsTab } from './TerritoryRankingsTab'
import {
  TerritoryDetailErrorState,
  TerritoryEmptyState,
} from './TerritoryStates'

interface TerritoryProfilePanelProps {
  eyebrow: string
  title: string
  subtitle: string
  profile: TerritoryProfile | null
  editorial?: RegionEditorial
  activeTab: TerritoryTab
  onTabChange: (tab: TerritoryTab) => void
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
}

const TABS: Array<{ value: TerritoryTab; label: string }> = [
  { value: 'overview', label: 'Aperçu' },
  { value: 'rankings', label: 'Dominantes' },
  { value: 'climate', label: 'Climat' },
]

export function TerritoryProfilePanel({
  eyebrow,
  title,
  subtitle,
  profile,
  editorial,
  activeTab,
  onTabChange,
  isLoading = false,
  isError = false,
  onRetry,
}: TerritoryProfilePanelProps) {
  const [rankingMetric, setRankingMetric] = useState<RankingMetric>('production')

  let content: ReactNode
  if (isLoading) {
    content = <div className="territory-profile-loading" aria-busy="true" />
  } else if (isError && onRetry) {
    content = <TerritoryDetailErrorState retry={onRetry} />
  } else if (profile === null || !profile.has_data) {
    content = <TerritoryEmptyState />
  } else if (activeTab === 'overview') {
    content = <TerritoryOverviewTab profile={profile} editorial={editorial} />
  } else if (activeTab === 'rankings') {
    content = (
      <TerritoryRankingsTab
        rankings={profile.rankings}
        metric={rankingMetric}
        onMetricChange={setRankingMetric}
      />
    )
  } else {
    content = <TerritoryClimateTab climate={profile.climate_summary} />
  }

  return (
    <section className="territory-profile-panel" aria-labelledby="territory-profile-title">
      <header className="territory-profile-hero">
        <span>{eyebrow}</span>
        <h2 id="territory-profile-title">{title}</h2>
        <p>{subtitle}</p>
      </header>

      <div className="territory-profile-tabs" aria-label="Contenu de la fiche territoriale">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            aria-pressed={activeTab === tab.value}
            onClick={() => onTabChange(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="territory-profile-body" aria-live="polite">
        {content}
      </div>
    </section>
  )
}
