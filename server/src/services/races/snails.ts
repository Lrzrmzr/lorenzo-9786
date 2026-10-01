import type { Snail } from '@snailbet/shared'

/**
 * Catálogo de los 6 caracoles.
 * Los colores son de la paleta Okabe-Ito, diseñada para distinguirse también con daltonismo;
 * se reutilizan en la gráfica y en su leyenda.
 */
export const SNAILS: readonly Snail[] = [
  { id: 'turbo-baba', name: 'Turbo Baba', color: '#E69F00' },
  { id: 'dona-concha', name: 'Doña Concha', color: '#56B4E9' },
  { id: 'rayo-espiral', name: 'Rayo Espiral', color: '#009E73' },
  { id: 'sir-babosa', name: 'Sir Babosa', color: '#0072B2' },
  { id: 'caracolina', name: 'Caracolina', color: '#D55E00' },
  { id: 'flash-lento', name: 'Flash Lento', color: '#CC79A7' },
]
