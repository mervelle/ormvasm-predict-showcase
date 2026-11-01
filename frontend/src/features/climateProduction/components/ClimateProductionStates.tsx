function SkeletonBlock({ className = '' }: { className?: string }) {
  return <span className={`skeleton-block ${className}`} aria-hidden="true" />
}

export function ClimateProductionSkeleton() {
  return (
    <div
      className="climate-skeleton"
      role="status"
      aria-label="Chargement des séries climatiques et agricoles"
    >
      <span className="visually-hidden">Chargement des données…</span>
      <div className="climate-skeleton__charts" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="climate-skeleton__chart" key={index}>
            <SkeletonBlock className="skeleton-block--heading" />
            <SkeletonBlock className="skeleton-block--climate-chart" />
          </div>
        ))}
      </div>
    </div>
  )
}
