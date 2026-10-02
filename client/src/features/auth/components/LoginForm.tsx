import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, PasswordInput, Stack, TextInput } from '@mantine/core'
import { loginSchema } from '@snailbet/shared'
import { IconAlertCircle, IconClock, IconMail } from '@tabler/icons-react'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../hooks/useAuth'
import type { AuthError } from '../services/auth.service'

function secondsUntil(date: Date): number {
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 1000))
}

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

/** Alerta de bloqueo con cuenta regresiva; avisa cuando termina para habilitar el formulario. */
function LockedAlert({ lockedUntil, onExpire }: { lockedUntil: Date; onExpire: () => void }) {
  const [secondsLeft, setSecondsLeft] = useState(() => secondsUntil(lockedUntil))

  useEffect(() => {
    const intervalId = setInterval(() => {
      const next = secondsUntil(lockedUntil)
      setSecondsLeft(next)
      if (next === 0) onExpire()
    }, 1000)
    return () => clearInterval(intervalId)
  }, [lockedUntil, onExpire])

  return (
    <Alert color="red" variant="light" icon={<IconClock size={20} />} title="Demasiados intentos">
      <span aria-live="polite">Intenta de nuevo en {formatCountdown(secondsLeft)}.</span>
    </Alert>
  )
}

/** Mensaje para cada error de inicio de sesión, salvo el bloqueo, que tiene su propia alerta. */
function loginErrorMessage(error: Exclude<AuthError, { code: 'locked' }>): string {
  switch (error.code) {
    case 'invalid_credentials':
      // Mismo mensaje para correo inexistente y contraseña incorrecta:
      // no revela qué correos están registrados.
      return 'Correo o contraseña incorrectos.'
    case 'email_taken':
    case 'storage_unavailable':
      return 'No pudimos iniciar tu sesión en este navegador. Revisa que no esté bloqueado el almacenamiento.'
  }
}

export function LoginForm() {
  const { login } = useAuth()
  const [authError, setAuthError] = useState<AuthError | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: { email: '', password: '' },
  })

  const clearError = useCallback(() => setAuthError(null), [])

  const onSubmit = handleSubmit(async (data) => {
    setAuthError(null)
    const result = await login(data)
    // Si fue exitoso, la ruta pública redirige sola al dashboard.
    if (!result.ok) setAuthError(result.error)
  })

  const isLocked = authError?.code === 'locked'

  return (
    <form onSubmit={onSubmit} noValidate>
      <Stack gap="md">
        {authError?.code === 'locked' && (
          <LockedAlert lockedUntil={authError.lockedUntil} onExpire={clearError} />
        )}
        {authError && authError.code !== 'locked' && (
          <Alert color="red" variant="light" icon={<IconAlertCircle size={20} />} role="alert">
            {loginErrorMessage(authError)}
          </Alert>
        )}

        <TextInput
          label="Correo electrónico"
          placeholder="ana@ejemplo.com"
          type="email"
          autoComplete="email"
          leftSection={<IconMail size={18} />}
          error={errors.email?.message}
          disabled={isLocked}
          {...register('email')}
        />
        <PasswordInput
          label="Contraseña"
          autoComplete="current-password"
          error={errors.password?.message}
          disabled={isLocked}
          {...register('password')}
        />

        <Button type="submit" size="lg" fullWidth loading={isSubmitting} disabled={isLocked}>
          Iniciar sesión
        </Button>
      </Stack>
    </form>
  )
}
