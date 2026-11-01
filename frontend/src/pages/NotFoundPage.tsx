import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="page" aria-labelledby="page-title">
      <header className="page-header">
        <p className="page-eyebrow">Erreur 404</p>
        <h1 id="page-title">Page introuvable</h1>
        <p>Cette adresse ne correspond à aucune route du dashboard.</p>
      </header>
      <Link className="return-link" to="/production">
        Revenir à la production
      </Link>
    </section>
  )
}
