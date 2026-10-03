/*
 * Fechas en español de México. Intl ya conoce los nombres de días y meses;
 * aquí solo se ajusta el formato al que usa el diseño.
 */

const LONG_DATE = new Intl.DateTimeFormat('es-MX', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/*
 * Las fechas AAAA-MM-DD del API son días de calendario, no instantes. Se interpretan y
 * formatean en UTC para que el día no se recorra según la zona horaria del navegador
 * (en México, "2026-09-30" interpretado como hora local sería el 29 por la tarde).
 */
const DAY_MONTH = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
})

const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/

function capitalize(text: string): string {
  return text.charAt(0).toLocaleUpperCase('es-MX') + text.slice(1)
}

/** Fecha completa en hora local: "Viernes 2 de octubre de 2026". */
export function formatLongDate(date: Date): string {
  // Intl produce "viernes, 2 de octubre de 2026"; el diseño no lleva coma tras el día.
  const text = LONG_DATE.formatToParts(date)
    .filter(
      (part, index, parts) => !(part.type === 'literal' && parts[index - 1]?.type === 'weekday'),
    )
    .map((part) => (part.type === 'weekday' ? `${part.value} ` : part.value))
    .join('')
  return capitalize(text)
}

/** Día y mes de una fecha AAAA-MM-DD: "2026-09-30" → "30 de septiembre". */
export function formatDayMonth(isoDay: string): string {
  const match = ISO_DAY.exec(isoDay)
  if (!match) {
    throw new RangeError(`Invalid ISO day: ${isoDay}`)
  }
  const [, year, month, day] = match
  return DAY_MONTH.format(new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))))
}
