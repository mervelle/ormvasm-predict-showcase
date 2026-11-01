import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import { AppProviders } from './app/AppProviders'
import { AppRoutes } from './app/router'
import './styles/index.css'

import 'leaflet/dist/leaflet.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error("L'élément racine de l'application est introuvable")
}

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProviders>
  </StrictMode>,
)
