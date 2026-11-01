import { CircleDashed } from 'lucide-react'

type PagePlaceholderProps = {
  title: string
  description: string
  phase: string
  reserved?: boolean
}

export function PagePlaceholder({
  title,
  description,
  phase,
  reserved = false,
}: PagePlaceholderProps) {
  return (
    <section className="page" aria-labelledby="page-title">
      <header className="page-header">
        <p className="page-eyebrow">{phase}</p>
        <h1 id="page-title">{title}</h1>
        <p>{description}</p>
      </header>

      <div className="placeholder-panel" role="status">
        <CircleDashed aria-hidden="true" />
        <div>
          <h2>{reserved ? 'Route réservée' : 'Structure prête'}</h2>
          <p>
            {reserved
              ? "Le contrat du modèle doit être validé avant d'ajouter ce formulaire."
              : 'Les données et visualisations seront ajoutées dans la phase prévue, sans calcul métier dans le frontend.'}
          </p>
        </div>
      </div>
    </section>
  )
}
