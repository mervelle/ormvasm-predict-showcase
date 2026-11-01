import {
  geoJSON as leafletGeoJSON,
  Path as LeafletPath,
  type Map as LeafletMap,
  type PathOptions,
} from 'leaflet'
import { useCallback, useEffect, useRef } from 'react'
import { GeoJSON, MapContainer, useMap } from 'react-leaflet'
import { LocateFixed } from 'lucide-react'

import type {
  GeoAttribution,
  TerritoryGeoJSON,
  TerritoryGeoProperties,
  TerritoryListItem,
} from '../../../types/territoryTypes'

interface TerritoryMapProps {
  geojson: TerritoryGeoJSON
  territories: TerritoryListItem[]
  attribution: GeoAttribution
  selectedSlug: string | null
  onSelect: (slug: string | null) => void
}

// Leaflet applique les couleurs via JavaScript : ces hexadécimaux sont exactement
// les valeurs des tokens PIAD Terrain leaf-600, sage-100, forest-950, forest-800 et sage-50.
const DEFAULT_STYLE: PathOptions = {
  color: '#2f7d4a',
  weight: 1.6,
  fillColor: '#e9f1e8',
  fillOpacity: 0.9,
}

const SELECTED_STYLE: PathOptions = {
  color: '#123c32',
  weight: 2.5,
  fillColor: '#1d5545',
  fillOpacity: 0.96,
}

const HOVER_STYLE: PathOptions = {
  color: '#1d5545',
  weight: 2.4,
  fillColor: '#f3f7f1',
  fillOpacity: 0.96,
}

const SELECTED_HOVER_STYLE: PathOptions = {
  color: '#102b24',
  weight: 3,
  fillColor: '#1d5545',
  fillOpacity: 0.96,
}

export function getTerritoryPathStyle(
  provinceSlug: string,
  selectedSlug: string | null,
): PathOptions {
  return provinceSlug === selectedSlug ? SELECTED_STYLE : DEFAULT_STYLE
}

function fitMap(
  map: LeafletMap,
  geojson: TerritoryGeoJSON,
  selectedSlug: string | null,
) {
  const selectedFeature =
    selectedSlug === null
      ? null
      : geojson.features.find(
          (feature) => feature.properties.province_slug === selectedSlug,
        ) ?? null
  const target = selectedFeature ?? geojson
  const bounds = leafletGeoJSON(target).getBounds()

  if (bounds.isValid()) {
    const isWide = map.getSize().x >= 760
    map.fitBounds(bounds, {
      paddingTopLeft: isWide ? [295, 42] : [28, 94],
      paddingBottomRight: [42, 72],
      maxZoom: selectedFeature === null ? 8 : 9,
      animate: false,
    })
  }
}

function MapViewport({
  geojson,
  selectedSlug,
  onMapReady,
}: {
  geojson: TerritoryGeoJSON
  selectedSlug: string | null
  onMapReady: (map: LeafletMap) => void
}) {
  const map = useMap()

  useEffect(() => {
    onMapReady(map)
  }, [map, onMapReady])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      map.invalidateSize()
      fitMap(map, geojson, selectedSlug)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [geojson, map, selectedSlug])

  return null
}

function createSafeLabel(label: string) {
  const element = document.createElement('span')
  element.textContent = label
  return element
}

function isTerritoryGeoProperties(value: unknown): value is TerritoryGeoProperties {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const properties = value as Record<string, unknown>
  return (
    typeof properties.province_slug === 'string' &&
    typeof properties.province_label === 'string' &&
    typeof properties.administrative_type === 'string'
  )
}

export function TerritoryMap({
  geojson,
  territories,
  attribution,
  selectedSlug,
  onSelect,
}: TerritoryMapProps) {
  const mapRef = useRef<LeafletMap | null>(null)

  const handleMapReady = useCallback((map: LeafletMap) => {
    mapRef.current = map
  }, [])

  const handleRecenter = () => {
    if (mapRef.current !== null) {
      fitMap(mapRef.current, geojson, selectedSlug)
    }
  }

  return (
    <section className="territory-map-panel" aria-labelledby="territory-map-title">
      <header className="territory-map-panel__header">
        <div>
          <h2 id="territory-map-title">Territoires agricoles couverts</h2>
          <p>Sélectionnez un territoire pour mettre à jour la fiche.</p>
        </div>
        <button
          className="territory-region-button"
          type="button"
          aria-pressed={selectedSlug === null}
          onClick={() => onSelect(null)}
        >
          Région entière
        </button>
      </header>

      <div className="territory-map-stage">
        <MapContainer
          className="territory-leaflet-map"
          center={[29.8, -8.7]}
          zoom={6}
          minZoom={5}
          maxZoom={10}
          scrollWheelZoom={false}
          zoomControl
          attributionControl={false}
        >
          <MapViewport
            geojson={geojson}
            selectedSlug={selectedSlug}
            onMapReady={handleMapReady}
          />
          <GeoJSON
            key={selectedSlug ?? 'region'}
            data={geojson}
            style={(feature) => {
              const properties: unknown = feature?.properties
              const provinceSlug = isTerritoryGeoProperties(properties)
                ? properties.province_slug
                : ''
              return getTerritoryPathStyle(provinceSlug, selectedSlug)
            }}
            onEachFeature={(feature, layer) => {
              const properties: unknown = feature.properties
              if (
                !(layer instanceof LeafletPath) ||
                !isTerritoryGeoProperties(properties)
              ) {
                return
              }

              const currentStyle = () =>
                getTerritoryPathStyle(
                  properties.province_slug,
                  selectedSlug,
                )

              layer.on({
                click: () => onSelect(properties.province_slug),
                mouseover: () =>
                  layer.setStyle(
                    properties.province_slug === selectedSlug
                      ? SELECTED_HOVER_STYLE
                      : HOVER_STYLE,
                  ),
                mouseout: () => layer.setStyle(currentStyle()),
              })

              layer.bindTooltip(createSafeLabel(properties.province_label), {
                permanent: true,
                direction: 'center',
                className: 'territory-map-label',
              })

              layer.once('add', () => {
                const element = layer.getElement()
                if (element === null) {
                  return
                }

                const isSelected = properties.province_slug === selectedSlug
                element.setAttribute('tabindex', '0')
                element.setAttribute('role', 'button')
                element.setAttribute('aria-pressed', String(isSelected))
                element.setAttribute(
                  'aria-label',
                  `${properties.province_label}, ${properties.administrative_type}. ${
                    isSelected ? 'Sélectionné' : 'Sélectionner ce territoire'
                  }`,
                )
                element.addEventListener('keydown', (event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelect(properties.province_slug)
                  }
                })
              })
            }}
          />
        </MapContainer>

        <div className="territory-map-selector" aria-label="Sélection du territoire">
          <span className="territory-map-selector__label">Territoires couverts</span>
          <div className="territory-map-selector__buttons">
            {territories.map((territory) => (
              <button
                key={territory.province_slug}
                type="button"
                aria-pressed={selectedSlug === territory.province_slug}
                onClick={() => onSelect(territory.province_slug)}
              >
                <span className="territory-map-selector__swatch" aria-hidden="true" />
                {territory.province_label}
              </button>
            ))}
          </div>
        </div>

        <button
          className="territory-map-recenter"
          type="button"
          onClick={handleRecenter}
          aria-label="Recentrer la carte sur la sélection"
          title="Recentrer"
        >
          <LocateFixed aria-hidden="true" />
        </button>

        <div className="territory-map-legend" aria-label="Légende de la carte">
          <span><i className="territory-map-legend__normal" />Territoire couvert</span>
          <span><i className="territory-map-legend__selected" />Sélection</span>
        </div>

        <div className="territory-map-attribution">
          <strong>{attribution.source_name}</strong>
          <span>
            <a href={attribution.source_url} target="_blank" rel="noreferrer">
              Source
            </a>
            {' · '}
            <a href={attribution.license_url} target="_blank" rel="noreferrer">
              {attribution.license_name}
            </a>
          </span>
          <small>
            {attribution.source_version}
            {attribution.modified ? ' · Donnée dérivée pour le périmètre du projet.' : ''}
          </small>
        </div>
      </div>
    </section>
  )
}
