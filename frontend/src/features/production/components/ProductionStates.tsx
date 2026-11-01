import {
  CircleX,
  Database,
  RefreshCw,
  RotateCcw,
} from 'lucide-react'

import type { Coverage } from '../../../types/productionTypes'

interface ProductionErrorStateProps {
  title: string
  description: string
  onRetry: () => void
  compact?: boolean
}

interface ProductionEmptyStateProps {
  title: string
  description: string
  onReset?: () => void
  compact?: boolean
}

function formatCount(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value)
}

function pluralize(value: number, singular: string, plural: string) {
  return value === 1 ? singular : plural
}

export function coverageNeedsWarning(coverage: Coverage) {
  return coverage.rows_excluded > 0 || coverage.missing_production > 0
}

export function formatCoverageDescription(coverage: Coverage) {
  const used = `${formatCount(coverage.rows_used)} ${pluralize(
    coverage.rows_used,
    'observation utilisée',
    'observations utilisées',
  )}`
  const excluded = `${formatCount(coverage.rows_excluded)} ${pluralize(
    coverage.rows_excluded,
    'ligne exclue',
    'lignes exclues',
  )}`
  const missing = `${formatCount(coverage.missing_production)} ${pluralize(
    coverage.missing_production,
    'production manquante',
    'productions manquantes',
  )}`

  return `${used} · ${excluded} · ${missing}`
}

export function CoverageNotice({ coverage }: { coverage: Coverage }) {
  const hasWarning = coverageNeedsWarning(coverage)
  const observations = `${formatCount(coverage.rows_used)} ${pluralize(
    coverage.rows_used,
    'observation',
    'observations',
  )}`

  // Le badge reste neutre visuellement. Le point signale discrètement
  // que la couverture contient des exclusions ou des valeurs manquantes.

  return (
    <div
      className={`coverage-notice${
        hasWarning ? ' coverage-notice--partial' : ''
      }`}
      role="status"
      aria-label={`${
        hasWarning ? 'Couverture partielle' : 'Couverture complète'
      } : ${formatCoverageDescription(coverage)}`}
      title={formatCoverageDescription(coverage)}
    >
      <Database aria-hidden="true" />
      <span className="coverage-notice__observations">
        {observations}
      </span>

      {coverage.rows_excluded > 0 && (
        <span className="coverage-notice__detail">
          · {formatCount(coverage.rows_excluded)}{' '}
          {pluralize(coverage.rows_excluded, 'exclue', 'exclues')}
        </span>
      )}

      {coverage.missing_production > 0 && (
        <span className="coverage-notice__detail">
          · {formatCount(coverage.missing_production)}{' '}
          {pluralize(
            coverage.missing_production,
            'manquante',
            'manquantes',
          )}
        </span>
      )}

      {hasWarning && (
        <span
          className="coverage-notice__status-dot"
          aria-hidden="true"
        />
      )}
    </div>
  )
}

export function ProductionErrorState({
  title,
  description,
  onRetry,
  compact = false,
}: ProductionErrorStateProps) {
  return (
    <div
      className={`production-feedback production-feedback--error${
        compact ? ' production-feedback--compact' : ''
      }`}
      role="alert"
    >
      <CircleX aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      <button type="button" onClick={onRetry}>
        <RefreshCw aria-hidden="true" />
        Réessayer
      </button>
    </div>
  )
}

export function ProductionEmptyState({
  title,
  description,
  onReset,
  compact = false,
}: ProductionEmptyStateProps) {
  return (
    <div
      className={`production-feedback production-feedback--empty${
        compact ? ' production-feedback--compact' : ''
      }`}
      role="status"
    >
      <Database aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      {onReset && (
        <button type="button" onClick={onReset}>
          <RotateCcw aria-hidden="true" />
          Réinitialiser les filtres
        </button>
      )}
    </div>
  )
}

function SkeletonBlock({ className = '' }: { className?: string }) {
  return <span className={`skeleton-block ${className}`} aria-hidden="true" />
}

export function CultureRankingSkeleton() {
  return (
    <div
      className="culture-ranking-skeleton"
      role="status"
      aria-label="Chargement du classement des cultures"
    >
      <span className="visually-hidden">Chargement du classement…</span>
      {Array.from({ length: 6 }, (_, index) => (
        <div className="culture-ranking-skeleton__row" key={index}>
          <SkeletonBlock className="skeleton-block--label" />
          <SkeletonBlock className="skeleton-block--bar" />
          <SkeletonBlock className="skeleton-block--value" />
        </div>
      ))}
    </div>
  )
}

export function ProductionContentSkeleton() {
  return (
    <div
      className="production-content-skeleton"
      role="status"
      aria-label="Chargement des données de production"
    >
      <span className="visually-hidden">Chargement des données…</span>

      <section className="skeleton-panel" aria-hidden="true">
        <div className="skeleton-panel__heading">
          <SkeletonBlock className="skeleton-block--heading" />
          <SkeletonBlock className="skeleton-block--caption" />
        </div>
        <div className="skeleton-chart-grid">
          {Array.from({ length: 3 }, (_, index) => (
            <div className="skeleton-chart-card" key={index}>
              <SkeletonBlock className="skeleton-block--heading" />
              <SkeletonBlock className="skeleton-block--chart" />
            </div>
          ))}
        </div>
      </section>

      <section className="skeleton-panel" aria-hidden="true">
        <SkeletonBlock className="skeleton-block--heading" />
        <div className="skeleton-distribution-grid">
          <SkeletonBlock className="skeleton-block--distribution" />
          <SkeletonBlock className="skeleton-block--distribution" />
        </div>
      </section>

      <section className="skeleton-panel" aria-hidden="true">
        <SkeletonBlock className="skeleton-block--heading" />
        <CultureRankingSkeleton />
      </section>
    </div>
  )
}

export function ProductionDashboardSkeleton() {
  return (
    <div className="production-dashboard-skeleton">
      <section
        className="skeleton-filter-panel"
        role="status"
        aria-label="Chargement des filtres de production"
      >
        <span className="visually-hidden">Chargement des filtres…</span>
        {Array.from({ length: 4 }, (_, index) => (
          <SkeletonBlock className="skeleton-block--filter" key={index} />
        ))}
      </section>
      <ProductionContentSkeleton />
    </div>
  )
}