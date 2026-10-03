import type { DailyRaceSummary } from '@snailbet/shared'
import { fetchWithTimeout } from '../../../lib/http'

const DAILY_SUMMARY_URL = '/api/races/daily-summary'

/** El servidor respondió con un código de error. */
export class RacesRequestError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`Races request failed with status ${status}`)
    this.name = 'RacesRequestError'
    this.status = status
  }
}

/**
 * Obtiene la jornada simulada del día anterior.
 * La respuesta la produce nuestro propio servidor con el tipo compartido, por eso no se
 * valida campo por campo como los datos de localStorage.
 */
export async function fetchDailyRaceSummary(signal?: AbortSignal): Promise<DailyRaceSummary> {
  const response = await fetchWithTimeout(DAILY_SUMMARY_URL, { signal })
  if (!response.ok) {
    throw new RacesRequestError(response.status)
  }
  return (await response.json()) as DailyRaceSummary
}
