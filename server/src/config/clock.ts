/**
 * Fuente de la fecha actual. Se inyecta en lugar de llamar a `new Date()` directamente
 * para que las pruebas usen una fecha fija (por ejemplo, para probar el vencimiento 12/26).
 */
export interface Clock {
  now(): Date
}

export const systemClock: Clock = {
  now: () => new Date(),
}

/** Reloj detenido en una fecha; pensado para pruebas. Devuelve copias para evitar mutaciones. */
export function createFixedClock(date: Date): Clock {
  return {
    now: () => new Date(date.getTime()),
  }
}
