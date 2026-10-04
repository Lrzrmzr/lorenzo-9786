import { zodResolver } from '@hookform/resolvers/zod'
import {
  Accordion,
  Alert,
  Button,
  Chip,
  Fieldset,
  Group,
  NumberInput,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core'
import { PAYMENT_LIMITS, paymentRequestSchema, TEST_CARDS } from '@snailbet/shared'
import { IconAlertTriangle, IconCircleX, IconLock, IconRefresh } from '@tabler/icons-react'
import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import type { z } from 'zod'
import { formatMoney, toCents } from '../../../lib/money'
import type { TopUpFormValues, TopUpState } from '../types'
import {
  CARD_NUMBER_LENGTH,
  digitsOnly,
  formatCardNumber,
  formatExpiration,
  SECURITY_CODE_LENGTH,
} from '../utils/card-format'

/** Mismas reglas que valida el servidor (solo formato), sin los datos que salen de la sesión. */
const topUpFormSchema = paymentRequestSchema.omit({ payer_id: true, payer_email: true })
type TopUpFormInput = z.input<typeof topUpFormSchema>

const FORM_FIELDS = Object.keys(topUpFormSchema.shape) as (keyof TopUpFormInput)[]
const QUICK_AMOUNTS = [100, 250, 500, 1000]
const MAX_AMOUNT_LABEL = formatMoney(toCents(PAYMENT_LIMITS.maxAmount)).replace('.00', '')
/** Fecha futura para las tarjetas de prueba que no son la de éxito. */
const FUTURE_EXPIRATION = '12/30'

const TEST_CARD_ROWS = [
  {
    label: 'Cobro exitoso',
    number: TEST_CARDS.approved.number,
    expiration: TEST_CARDS.approved.expiration,
    cvv: TEST_CARDS.approved.cvv,
  },
  {
    label: 'Fondos insuficientes',
    number: TEST_CARDS.insufficientFunds,
    expiration: FUTURE_EXPIRATION,
    cvv: '123',
  },
  {
    label: 'Error del sistema',
    number: TEST_CARDS.systemError,
    expiration: FUTURE_EXPIRATION,
    cvv: '123',
  },
  {
    label: 'Timeout (10 s)',
    number: TEST_CARDS.timeout,
    expiration: FUTURE_EXPIRATION,
    cvv: '123',
  },
]

function isValidAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

type TopUpFormProps = {
  state: TopUpState
  onSubmit: (values: TopUpFormValues) => void
}

export function TopUpForm({ state, onSubmit }: TopUpFormProps) {
  const isProcessing = state.status === 'processing'

  const {
    control,
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<TopUpFormInput, unknown, TopUpFormValues>({
    resolver: zodResolver(topUpFormSchema),
    defaultValues: { card_number: '', expiration_date: '', security_code: '', cardholder_name: '' },
  })

  // Errores por campo que devuelve SnailPay (400): se muestran igual que los del formulario.
  useEffect(() => {
    if (state.status !== 'invalid') return
    for (const field of FORM_FIELDS) {
      const message = state.errors[field]?.[0]
      if (message) setError(field, { type: 'server', message })
    }
  }, [state, setError])

  const submit = handleSubmit(onSubmit)
  const amount = useWatch({ control, name: 'transaction_amount' })

  function fillTestCard(row: (typeof TEST_CARD_ROWS)[number]) {
    const options = { shouldValidate: true }
    setValue('card_number', formatCardNumber(row.number), options)
    setValue('expiration_date', row.expiration, options)
    setValue('security_code', row.cvv, options)
  }

  return (
    <form onSubmit={submit} noValidate>
      <Stack gap="md">
        {state.status === 'declined' && (
          <Alert
            color="red"
            variant="light"
            icon={<IconCircleX size={20} />}
            title="Recarga rechazada"
            role="alert"
          >
            {state.message} Tu saldo no fue modificado.
          </Alert>
        )}
        {state.status === 'invalid' && (
          <Alert color="red" variant="light" icon={<IconCircleX size={20} />} role="alert">
            SnailPay rechazó algunos datos. Revisa los campos marcados.
          </Alert>
        )}
        {state.status === 'failed' && (
          <Alert color="amber" variant="light" icon={<IconAlertTriangle size={20} />} role="alert">
            <Stack gap="sm" align="flex-start">
              <Text fz="sm">{state.message}</Text>
              {state.retryable && (
                <Button
                  size="xs"
                  variant="white"
                  color="amber.8"
                  leftSection={<IconRefresh size={16} />}
                  onClick={submit}
                >
                  Reintentar
                </Button>
              )}
            </Stack>
          </Alert>
        )}

        {/* `disabled` en el fieldset deshabilita todos los campos mientras se procesa. */}
        <Fieldset variant="unstyled" disabled={isProcessing}>
          <Stack gap="md">
            <Stack gap="xs">
              <Controller
                control={control}
                name="transaction_amount"
                render={({ field }) => (
                  <NumberInput
                    label="Monto"
                    description={`Máximo ${MAX_AMOUNT_LABEL} por recarga`}
                    prefix="$"
                    thousandSeparator=","
                    decimalScale={2}
                    allowNegative={false}
                    hideControls
                    inputMode="decimal"
                    value={field.value ?? ''}
                    onChange={(value) =>
                      field.onChange(typeof value === 'number' ? value : undefined)
                    }
                    onBlur={field.onBlur}
                    error={errors.transaction_amount?.message}
                  />
                )}
              />
              <Chip.Group
                value={
                  isValidAmount(amount) && QUICK_AMOUNTS.includes(amount) ? String(amount) : null
                }
                onChange={(value) =>
                  setValue('transaction_amount', Number(value), { shouldValidate: true })
                }
              >
                <Group gap="xs">
                  {QUICK_AMOUNTS.map((quick) => (
                    <Chip key={quick} value={String(quick)} size="sm" color="moss">
                      {formatMoney(toCents(quick)).replace('.00', '')}
                    </Chip>
                  ))}
                </Group>
              </Chip.Group>
            </Stack>

            <Controller
              control={control}
              name="card_number"
              render={({ field }) => (
                <TextInput
                  label="Número de tarjeta"
                  placeholder="1234 1234 1234 1234"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  maxLength={CARD_NUMBER_LENGTH + 3}
                  className="sb-tabular"
                  {...field}
                  onChange={(event) => field.onChange(formatCardNumber(event.currentTarget.value))}
                  error={errors.card_number?.message}
                />
              )}
            />

            <SimpleGrid cols={2}>
              <Controller
                control={control}
                name="expiration_date"
                render={({ field }) => (
                  <TextInput
                    label="Vencimiento"
                    placeholder="MM/AA"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    {...field}
                    onChange={(event) =>
                      field.onChange(formatExpiration(event.currentTarget.value))
                    }
                    error={errors.expiration_date?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="security_code"
                render={({ field }) => (
                  <TextInput
                    label="CVV"
                    placeholder="123"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    {...field}
                    onChange={(event) =>
                      field.onChange(digitsOnly(event.currentTarget.value, SECURITY_CODE_LENGTH))
                    }
                    error={errors.security_code?.message}
                  />
                )}
              />
            </SimpleGrid>

            <TextInput
              label="Nombre del titular"
              placeholder="Como aparece en la tarjeta"
              autoComplete="cc-name"
              {...register('cardholder_name')}
              error={errors.cardholder_name?.message}
            />

            <Accordion variant="contained" radius="md">
              <Accordion.Item value="test-cards">
                <Accordion.Control>Tarjetas de prueba</Accordion.Control>
                <Accordion.Panel>
                  <Table fz="sm" verticalSpacing={6}>
                    <Table.Tbody>
                      {TEST_CARD_ROWS.map((row) => (
                        <Table.Tr key={row.number}>
                          <Table.Td>
                            <Text fz="sm" fw={600}>
                              {row.label}
                            </Text>
                            <Text fz="xs" c="dimmed" className="sb-tabular">
                              {formatCardNumber(row.number)} · {row.expiration} · {row.cvv}
                            </Text>
                          </Table.Td>
                          <Table.Td ta="right">
                            <Button
                              size="compact-xs"
                              variant="subtle"
                              onClick={() => fillTestCard(row)}
                            >
                              Usar
                            </Button>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          </Stack>
        </Fieldset>

        <Button
          type="submit"
          size="md"
          fullWidth
          loading={isProcessing}
          loaderProps={{ type: 'dots' }}
        >
          {isValidAmount(amount) ? `Pagar ${formatMoney(toCents(amount))}` : 'Pagar'}
        </Button>
        {isProcessing && (
          <Text fz="sm" c="dimmed" ta="center" aria-live="polite">
            Procesando con SnailPay…
          </Text>
        )}

        <Group gap={6} justify="center">
          <IconLock size={14} color="var(--mantine-color-dimmed)" />
          <Text fz="xs" c="dimmed">
            Pasarela simulada. No se realizan cargos reales.
          </Text>
        </Group>
      </Stack>
    </form>
  )
}
