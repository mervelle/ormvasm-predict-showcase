const integerFormatter = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
})

const areaFormatter = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 2,
})

const decimalFormatter = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

export function formatArea(value: number | null) {
  return value === null ? 'Donnée indisponible' : `${areaFormatter.format(value)} ha`
}

export function formatPercentage(value: number | null) {
  return value === null
    ? 'Donnée indisponible'
    : `${decimalFormatter.format(value)} %`
}

export function formatRankingValue(value: number, unit: string) {
  const formatted = unit === 't/ha'
    ? decimalFormatter.format(value)
    : integerFormatter.format(value)
  return `${formatted} ${unit}`
}

export function formatClimateValue(value: number | null, unit: string) {
  return value === null
    ? 'Donnée indisponible'
    : `${decimalFormatter.format(value)} ${unit}`
}

export function formatPeriod(
  startCampaign: string | null,
  endCampaign: string | null,
) {
  if (startCampaign === null || endCampaign === null) {
    return 'Période indisponible'
  }
  return `${startCampaign}–${endCampaign}`
}
