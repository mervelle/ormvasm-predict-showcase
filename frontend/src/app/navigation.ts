import { BarChart3, CloudSun, Database, Map, Sparkles, type LucideIcon } from 'lucide-react'

export type NavigationItem = {
  label: string
  path: string
  icon: LucideIcon
  available: boolean
}

export const navigationItems: NavigationItem[] = [
  { label: 'Production', path: '/production', icon: BarChart3, available: true },
  { label: 'Climat × production', path: '/climat-production', icon: CloudSun, available: true },
  { label: 'Territoire', path: '/territoire', icon: Map, available: true },
  { label: 'Prédictions', path: '/predictions', icon: Sparkles, available: false },
  {path: '/donnees-brutes',label: 'Données brutes',icon: Database,available: true,},
]
