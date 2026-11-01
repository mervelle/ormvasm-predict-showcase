import { AlertTriangle, RefreshCw } from 'lucide-react'

export function TerritoryInitialSkeleton() {
  return (
    <div className="territory-skeleton" aria-label="Chargement du territoire" aria-busy="true">
      <div className="territory-skeleton__profile" />
      <div className="territory-skeleton__map" />
    </div>
  )
}

export function TerritoryErrorState({ retry }: { retry: () => void }) {
  return (
    <section className="territory-page-state" role="alert">
      <AlertTriangle aria-hidden="true" />
      <div>
        <h2>Impossible de charger le territoire</h2>
        <p>Les données territoriales sont momentanément indisponibles.</p>
      </div>
      <button type="button" onClick={retry}>
        <RefreshCw aria-hidden="true" />
        Réessayer
      </button>
    </section>
  )
}

export function TerritoryDetailErrorState({ retry }: { retry: () => void }) {
  return (
    <div className="territory-inline-state" role="alert">
      <AlertTriangle aria-hidden="true" />
      <strong>La fiche sélectionnée n'a pas pu être chargée.</strong>
      <button type="button" onClick={retry}>Réessayer</button>
    </div>
  )
}

export function TerritoryEmptyState() {
  return (
    <div className="territory-inline-state">
      <strong>Aucune donnée agricole disponible pour ce territoire.</strong>
      <span>La carte reste disponible pour changer de sélection.</span>
    </div>
  )
}
