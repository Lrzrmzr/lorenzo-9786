import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Anchor, Button, PasswordInput, Stack, TextInput } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { registerSchema } from '@snailbet/shared'
import { IconAlertCircle, IconMail } from '@tabler/icons-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import type { AuthError } from '../services/auth.service'
import { PasswordStrength } from './PasswordStrength'

export function RegisterForm() {
  const { register: registerAccount } = useAuth()
  const [authError, setAuthError] = useState<AuthError | null>(null)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  // Se actualiza en cada tecla para el indicador de fuerza, sin esperar a validar el campo.
  const password = useWatch({ control, name: 'password' })

  const onSubmit = handleSubmit(async (data) => {
    setAuthError(null)
    const result = await registerAccount(data)
    if (!result.ok) {
      setAuthError(result.error)
      return
    }
    notifications.show({
      color: 'green',
      title: 'Cuenta creada',
      message: 'Tu saldo inicial es $0.00. Haz tu primera recarga cuando quieras.',
    })
  })

  return (
    <form onSubmit={onSubmit} noValidate>
      <Stack gap="md">
        {authError?.code === 'email_taken' && (
          <Alert color="red" variant="light" icon={<IconAlertCircle size={20} />} role="alert">
            Ya existe una cuenta con este correo.{' '}
            <Anchor component={Link} to="/login" inherit fw={700}>
              Inicia sesión
            </Anchor>
          </Alert>
        )}
        {authError && authError.code !== 'email_taken' && (
          <Alert color="red" variant="light" icon={<IconAlertCircle size={20} />} role="alert">
            No pudimos crear tu cuenta en este navegador. Revisa que no esté bloqueado el
            almacenamiento.
          </Alert>
        )}

        <TextInput
          label="Nombre completo"
          placeholder="Ana López"
          autoComplete="name"
          withAsterisk
          error={errors.name?.message}
          {...register('name')}
        />
        <TextInput
          label="Correo electrónico"
          placeholder="ana@ejemplo.com"
          type="email"
          autoComplete="email"
          withAsterisk
          leftSection={<IconMail size={18} />}
          error={errors.email?.message}
          {...register('email')}
        />
        <Stack gap={8}>
          <PasswordInput
            label="Contraseña"
            autoComplete="new-password"
            withAsterisk
            error={errors.password?.message}
            {...register('password')}
          />
          <PasswordStrength password={password} />
        </Stack>
        <PasswordInput
          label="Confirmar contraseña"
          autoComplete="new-password"
          withAsterisk
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
          Crear cuenta
        </Button>
      </Stack>
    </form>
  )
}
