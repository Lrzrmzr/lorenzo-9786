import { expect, type Page } from '@playwright/test'

export type TestUser = {
  name: string
  email: string
  password: string
}

/**
 * Cada prueba corre en su propio contexto de navegador (localStorage propio),
 * así que el mismo usuario puede registrarse en pruebas paralelas sin chocar.
 */
export const TEST_USER: TestUser = {
  name: 'Lorenzo Ramirez',
  email: 'lorenzo.ramirez@example.com',
  password: 'securePassword123',
}

/**
 * Los campos de contraseña se buscan por rol: el texto de su etiqueta incluye el asterisco
 * de campo obligatorio ("Contraseña *"), pero su nombre accesible no.
 */
export function passwordInput(page: Page) {
  return page.getByRole('textbox', { name: 'Contraseña', exact: true })
}

export function confirmPasswordInput(page: Page) {
  return page.getByRole('textbox', { name: 'Confirmar contraseña' })
}

export async function registerUser(page: Page, user: TestUser = TEST_USER): Promise<void> {
  await page.goto('/register')
  await page.getByLabel('Nombre completo').fill(user.name)
  await page.getByLabel('Correo electrónico').fill(user.email)
  await passwordInput(page).fill(user.password)
  await confirmPasswordInput(page).fill(user.password)
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
}

export async function login(page: Page, user: TestUser = TEST_USER): Promise<void> {
  await page.getByLabel('Correo electrónico').fill(user.email)
  await passwordInput(page).fill(user.password)
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
}

export async function logout(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  // Hay dos botones "Cerrar sesión": el del encabezado y el de la confirmación.
  await page.getByRole('dialog').getByRole('button', { name: 'Cerrar sesión' }).click()
  await expect(page).toHaveURL(/\/login$/)
}

export function balance(page: Page) {
  return page.getByRole('region', { name: 'Saldo disponible' })
}
