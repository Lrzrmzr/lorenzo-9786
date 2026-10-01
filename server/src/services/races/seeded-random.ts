/** Devuelve un número pseudoaleatorio en el rango [0, 1), igual que `Math.random`. */
export type RandomSource = () => number

/**
 * Convierte un texto en un entero de 32 bits (algoritmo FNV-1a) para usarlo como semilla.
 * El mismo texto siempre produce el mismo número.
 */
export function hashSeed(text: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/**
 * Generador pseudoaleatorio con semilla (algoritmo mulberry32).
 *
 * A diferencia de `Math.random`, con la misma semilla produce siempre la misma secuencia.
 * Así los datos simulados son estables: el mismo día muestra siempre las mismas carreras,
 * y las pruebas son predecibles. No es apto para criptografía; solo para simulaciones.
 */
export function createSeededRandom(seed: number): RandomSource {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296
  }
}

/** Entero aleatorio entre `min` y `max`, ambos incluidos. */
export function randomInt(random: RandomSource, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1))
}

/** Elemento aleatorio de una lista. */
export function pickOne<T>(random: RandomSource, items: readonly T[]): T {
  const item = items[Math.floor(random() * items.length)]
  if (item === undefined) {
    throw new Error('Cannot pick an item from an empty list')
  }
  return item
}
