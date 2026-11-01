export function formatMetricValue(
  value: number | null,
  unit: string,
  maximumFractionDigits = 2,
) {
  if (value === null) return 'Donnée indisponible'

  const formatted = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits,
  }).format(value)

  return `${formatted} ${unit}`
}

export function formatCompactMetricValue(value: number | null, unit: string) {
  if (value === null) return 'Donnée indisponible'

  const formatted = new Intl.NumberFormat('fr-FR', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value)

  return `${formatted} ${unit}`
}

// Le pourcentage est déjà calculé par l’API : cette fonction ne fait que le
// formater selon la locale de l’interface.
export function formatPercentage(
  value: number,
  unit: string,
  maximumFractionDigits = 1,
) {
  const formatted = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits,
  }).format(value)

  return `${formatted} ${unit}`
}

// Utilisé uniquement pour présenter un écart entre deux valeurs API.
export function formatSignedMetricValue(
  value: number,
  unit: string,
  maximumFractionDigits = 2,
) {
  const formatted = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits,
  }).format(value)
  const sign = value > 0 ? '+' : ''

  return `${sign}${formatted} ${unit}`
}
