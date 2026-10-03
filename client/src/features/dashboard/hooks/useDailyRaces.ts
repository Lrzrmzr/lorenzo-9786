import type { DailyRaceSummary } from '@snailbet/shared'
import { useCallback, useEffect, useState } from 'react'
import { fetchDailyRaceSummary } from '../api/races.client'

/** Unión discriminada: los datos solo existen cuando la carga terminó bien. */
export type DailyRacesState =
  { status: 'loading' } | { status: 'error' } | { status: 'success'; data: DailyRaceSummary }

/** Carga la jornada de carreras con sus estados de carga, error y éxito, y permite reintentar. */
export function useDailyRaces() {
  const [state, setState] = useState<DailyRacesState>({ status: 'loading' })
  // Cambiar este número vuelve a ejecutar el efecto: así se implementa "Reintentar".
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    // Si el componente se desmonta (o se reintenta) antes de responder, se cancela la
    // petición y su resultado se ignora, para no pisar el estado con datos viejos.
    const controller = new AbortController()

    fetchDailyRaceSummary(controller.signal).then(
      (data) => setState({ status: 'success', data }),
      () => {
        if (!controller.signal.aborted) {
          setState({ status: 'error' })
        }
      },
    )

    return () => controller.abort()
  }, [attempt])

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((current) => current + 1)
  }, [])

  return { state, retry }
}
