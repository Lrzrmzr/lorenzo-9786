import { expect, test, type Page } from '@playwright/test'
import { balance, registerUser } from './support/auth'

type Card = { number: string; expiration: string; cvv: string }

const CARDS = {
  approved: { number: '1234123412341234', expiration: '12/26', cvv: '543' },
  insufficientFunds: { number: '4000000000000002', expiration: '12/30', cvv: '123' },
  systemError: { number: '4000000000000500', expiration: '12/30', cvv: '123' },
} satisfies Record<string, Card>

const PAYMENTS_URL = '**/api/snailpay/payments'
const FAILED_MESSAGE = 'No pudimos procesar tu recarga. Tu saldo no fue modificado.'

async function fillTopUp(page: Page, amount: string, card: Card) {
  await page.getByRole('button', { name: 'Recargar con SnailPay' }).click()
  const dialog = page.getByRole('dialog')

  await dialog.getByLabel('Monto').fill(amount)
  await dialog.getByLabel('Número de tarjeta').fill(card.number)
  await dialog.getByLabel('Vencimiento').fill(card.expiration)
  await dialog.getByLabel('CVV').fill(card.cvv)
  await dialog.getByLabel('Nombre del titular').fill('Lorenzo Ramirez')
  return dialog
}

test.describe('Recarga con SnailPay', () => {
  test.beforeEach(async ({ page }) => {
    await registerUser(page)
  })

  test('una recarga aprobada actualiza el saldo al instante', async ({ page }) => {
    const dialog = await fillTopUp(page, '250', CARDS.approved)
    await dialog.getByRole('button', { name: 'Pagar $250.00' }).click()

    await expect(dialog.getByRole('heading', { name: 'Recarga aprobada' })).toBeVisible()
    await expect(dialog.getByText(/^SNP-\d{8}-[A-Z0-9]{4}$/)).toBeVisible()
    await dialog.getByRole('button', { name: 'Listo' }).click()

    await expect(balance(page)).toContainText('$250.00')

    // El saldo quedó guardado: sobrevive a una recarga de la página.
    await page.reload()
    await expect(balance(page)).toContainText('$250.00')
  })

  test('una recarga rechazada explica el motivo y no cambia el saldo', async ({ page }) => {
    const dialog = await fillTopUp(page, '250', CARDS.insufficientFunds)
    await dialog.getByRole('button', { name: /^Pagar/ }).click()

    const alert = dialog.getByRole('alert')
    await expect(alert).toContainText('La tarjeta no tiene fondos suficientes.')
    await expect(alert).toContainText('Tu saldo no fue modificado.')

    await page.keyboard.press('Escape')
    await expect(balance(page)).toContainText('$0.00')
  })

  test('un error del sistema ofrece reintentar y no cambia el saldo', async ({ page }) => {
    const dialog = await fillTopUp(page, '250', CARDS.systemError)
    await dialog.getByRole('button', { name: /^Pagar/ }).click()

    await expect(dialog.getByRole('alert')).toContainText(FAILED_MESSAGE)
    await expect(dialog.getByRole('button', { name: 'Reintentar' })).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(balance(page)).toContainText('$0.00')
  })

  test('tras un timeout, el reintento usa la misma llave de idempotencia', async ({ page }) => {
    // Reloj falso: el timeout de 10 s se adelanta sin esperarlo.
    // Se instala después del registro (beforeEach) y aplica desde la siguiente carga.
    await page.clock.install()
    await page.reload()

    const keys: string[] = []
    await page.route(PAYMENTS_URL, (route) => {
      keys.push(route.request().headers()['idempotency-key'] ?? '')
      // No se responde: la petición queda colgada, como una pasarela que no contesta.
    })

    const dialog = await fillTopUp(page, '250', CARDS.approved)
    await dialog.getByRole('button', { name: /^Pagar/ }).click()
    await expect.poll(() => keys.length).toBe(1)
    await page.clock.fastForward(10_000)

    await expect(dialog.getByRole('alert')).toContainText(FAILED_MESSAGE)

    await dialog.getByRole('button', { name: 'Reintentar' }).click()
    await expect.poll(() => keys.length).toBe(2)
    await page.clock.fastForward(10_000)

    await expect(dialog.getByRole('alert')).toContainText(FAILED_MESSAGE)
    expect(keys[0]).not.toBe('')
    expect(keys[1]).toBe(keys[0])

    await page.unrouteAll({ behavior: 'ignoreErrors' })
  })

  test('un doble clic en Pagar envía una sola petición', async ({ page }) => {
    let requests = 0
    page.on('request', (request) => {
      if (request.url().endsWith('/api/snailpay/payments')) requests++
    })

    const dialog = await fillTopUp(page, '250', CARDS.approved)
    await dialog.getByRole('button', { name: /^Pagar/ }).dblclick()

    await expect(dialog.getByRole('heading', { name: 'Recarga aprobada' })).toBeVisible()
    expect(requests).toBe(1)
  })
})
