import { expect, test } from '@playwright/test'
import {
  balance,
  confirmPasswordInput,
  login,
  logout,
  passwordInput,
  registerUser,
  TEST_USER,
} from './support/auth'

/** El saludo usa solo el nombre de pila. */
const GREETING = 'Hola, Lorenzo'

test.describe('Autenticación', () => {
  test('registro, cierre de sesión e inicio de sesión de nuevo', async ({ page }) => {
    await registerUser(page)

    await expect(page.getByRole('heading', { name: GREETING })).toBeVisible()
    await expect(balance(page)).toContainText('$0.00')

    await logout(page)
    await login(page)

    await expect(page.getByRole('heading', { name: GREETING })).toBeVisible()
  })

  test('la sesión persiste al recargar la página', async ({ page }) => {
    await registerUser(page)
    await page.reload()

    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('heading', { name: GREETING })).toBeVisible()
  })

  test('el dashboard sin sesión redirige al inicio de sesión', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: 'Inicia sesión' })).toBeVisible()
  })

  test('con sesión, el inicio de sesión redirige al dashboard', async ({ page }) => {
    await registerUser(page)
    await page.goto('/login')

    await expect(page).toHaveURL(/\/dashboard$/)
  })

  test('muestra los errores de validación del formulario de registro', async ({ page }) => {
    await page.goto('/register')

    await page.getByLabel('Nombre completo').fill('Lrz')
    await page.getByLabel('Correo electrónico').fill('lrz@')
    await passwordInput(page).fill(TEST_USER.password)
    await confirmPasswordInput(page).fill('otraContraseña1')
    await page.getByRole('button', { name: 'Crear cuenta' }).click()

    await expect(page.getByText('Ingresa tu nombre y al menos un apellido')).toBeVisible()
    await expect(page.getByText('Ingresa un correo electrónico válido')).toBeVisible()
    await expect(page.getByText('Las contraseñas no coinciden')).toBeVisible()
    await expect(page).toHaveURL(/\/register$/)
  })

  test('rechaza credenciales inválidas sin revelar si el correo existe', async ({ page }) => {
    await registerUser(page)
    await logout(page)

    await page.getByLabel('Correo electrónico').fill(TEST_USER.email)
    await passwordInput(page).fill('contraseñaIncorrecta1')
    await page.getByRole('button', { name: 'Iniciar sesión' }).click()

    await expect(page.getByText('Correo o contraseña incorrectos.')).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)
  })
})
