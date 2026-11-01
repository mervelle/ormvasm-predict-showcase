import { Navigate, type RouteObject, useRoutes } from 'react-router-dom'

import { AppLayout } from '../components/layout/AppLayout'
import { ClimateProductionPage } from '../pages/ClimateProductionPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { PredictionsPage } from '../pages/PredictionsPage'
import { ProductionPage } from '../pages/ProductionPage'
import { TerritoryPage } from '../pages/TerritoryPage'
import { RawDataPage } from '../pages/RawDataPage'


const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/production" replace /> },
      { path: 'production', element: <ProductionPage /> },
      { path: 'climat-production', element: <ClimateProductionPage /> },
      { path: 'territoire', element: <TerritoryPage /> },
      { path: 'predictions', element: <PredictionsPage /> },
      { path: '*', element: <NotFoundPage /> },
      {path: 'donnees-brutes',element: <RawDataPage />,},
    ],
  },
]

export function AppRoutes() {
  return useRoutes(routes)
}
