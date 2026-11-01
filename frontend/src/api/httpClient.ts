import axios from 'axios'

// Seule la couche API connaît la racine HTTP. La valeur par défaut fonctionne
// avec le proxy Vite et évite de coder une origine locale dans les composants.
export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  timeout: 15_000,
})
