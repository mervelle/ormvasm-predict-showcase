import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

import { navigationItems } from '../../app/navigation'

export function AppLayout() {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false)

  const closeNavigation = () => setIsNavigationOpen(false)

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Aller au contenu
      </a>

      <header className="mobile-header">
        <span className="mobile-brand">Ormvas-Predict</span>
        <button
          className="menu-button"
          type="button"
          aria-expanded={isNavigationOpen}
          aria-controls="primary-navigation"
          aria-label={isNavigationOpen ? 'Fermer la navigation' : 'Ouvrir la navigation'}
          onClick={() => setIsNavigationOpen((isOpen) => !isOpen)}
        >
          {isNavigationOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </header>

      <aside className={isNavigationOpen ? 'sidebar sidebar--open' : 'sidebar'}>
        <div className="brand-block">
          <span className="brand-name">Ormvas-Predict</span>
          <span className="brand-context">Souss-Massa</span>
        </div>

        <nav id="primary-navigation" aria-label="Navigation principale">
          <ul className="navigation-list">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.path}>
                  <NavLink
                    className={({ isActive }) =>
                      isActive ? 'navigation-link navigation-link--active' : 'navigation-link'
                    }
                    to={item.path}
                    onClick={closeNavigation}
                  >
                    <Icon aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>

      {isNavigationOpen && (
        <button
          className="navigation-backdrop"
          type="button"
          aria-label="Fermer la navigation"
          onClick={closeNavigation}
        />
      )}

      <main id="main-content" className="main-content" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  )
}
