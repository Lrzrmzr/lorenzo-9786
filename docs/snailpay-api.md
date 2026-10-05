# API de la pasarela de pagos simulada (SnailPay)

Servicio **simulado**: no se conecta con pasarelas reales ni procesa información financiera real. Todos los datos de tarjeta son ficticios.

## Endpoint

```
POST /api/snailpay/payments
Content-Type: application/json
Idempotency-Key: <UUID v4>
```

### Encabezados

| Encabezado        | Obligatorio | Descripción                                                                                                                                                                     |
| ----------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Content-Type`    | Sí          | `application/json`                                                                                                                                                              |
| `Idempotency-Key` | Sí          | UUID v4 generado por el cliente **por intento de pago**. Si se reintenta la misma operación (por ejemplo tras un timeout), se reutiliza la misma llave para no cobrar dos veces |

### Cuerpo de la petición

Todo el contrato usa `snake_case`.

| Campo                | Tipo   | Reglas                                                                                                                                               |
| -------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `card_number`        | string | 16 dígitos. Se aceptan espacios o guiones entre grupos y se eliminan. No se valida el algoritmo de Luhn (la tarjeta de éxito requerida no lo cumple) |
| `expiration_date`    | string | Formato `MM/AA`, mes entre 01 y 12                                                                                                                   |
| `security_code`      | string | 3 dígitos                                                                                                                                            |
| `cardholder_name`    | string | No vacío, máximo 80 caracteres                                                                                                                       |
| `transaction_amount` | number | Mayor que 0, máximo 2 decimales, máximo **$50,000** por recarga                                                                                      |
| `payer_id`           | string | UUID del usuario registrado                                                                                                                          |
| `payer_email`        | string | Correo del usuario registrado                                                                                                                        |

Ejemplo:

```json
{
  "card_number": "1234123412341234",
  "expiration_date": "12/26",
  "security_code": "543",
  "cardholder_name": "Ana López",
  "transaction_amount": 250,
  "payer_id": "3f1c9a52-8d4e-4b7a-9c2f-5e6d7a8b9c0d",
  "payer_email": "ana.lopez@example.com"
}
```

## Respuesta

Todas las respuestas (aprobadas, rechazadas y errores del sistema) incluyen los mismos campos. Los que no aplican o no se pudieron leer de la petición van en `null`.

| Campo                | Formato                             | Descripción                                                                              |
| -------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------- |
| `id`                 | UUID v4                             | Identificador de la operación                                                            |
| `status`             | `approved` \| `rejected` \| `error` | Estado general: cobro exitoso, error de transacción o error del sistema                  |
| `status_detail`      | texto en `snake_case`               | Detalle del resultado (ver tabla de escenarios)                                          |
| `transaction_amount` | number \| null                      | Monto solicitado                                                                         |
| `date_created`       | ISO 8601 (UTC)                      | Fecha de creación de la operación                                                        |
| `authorization_code` | 6 caracteres \| null                | Solo en operaciones aprobadas. Alfabeto sin `0`, `O`, `1` ni `I` para evitar confusiones |
| `reference`          | `SNP-AAAAMMDD-XXXX`                 | Referencia legible de la operación                                                       |
| `payer_id`           | string \| null                      | Identificador del usuario                                                                |
| `payer_email`        | string \| null                      | Correo del usuario                                                                       |
| `card_number`        | string \| null                      | Número de tarjeta (ficticio, incluido por requisito del proyecto)                        |
| `security_code`      | string \| null                      | CVV (ficticio, incluido por requisito del proyecto)                                      |
| `errors`             | objeto                              | Solo con `invalid_request`: mensajes por campo                                           |

Ejemplo aprobado:

```json
{
  "id": "0b6f3f0e-7c1a-4f7e-9a51-2d4c8e1b9f33",
  "status": "approved",
  "status_detail": "accredited",
  "transaction_amount": 250,
  "date_created": "2026-09-30T18:04:11.532Z",
  "authorization_code": "K7Q2MX",
  "reference": "SNP-20260930-H4TZ",
  "payer_id": "3f1c9a52-8d4e-4b7a-9c2f-5e6d7a8b9c0d",
  "payer_email": "ana.lopez@example.com",
  "card_number": "1234123412341234",
  "security_code": "543"
}
```

Ejemplo con datos inválidos:

```json
{
  "id": "5a0e8a52-1d0f-4a0e-8f0e-6b2d5c1e7a90",
  "status": "rejected",
  "status_detail": "invalid_request",
  "transaction_amount": null,
  "date_created": "2026-09-30T18:05:02.114Z",
  "authorization_code": null,
  "reference": "SNP-20260930-9WPC",
  "payer_id": "3f1c9a52-8d4e-4b7a-9c2f-5e6d7a8b9c0d",
  "payer_email": "ana.lopez@example.com",
  "card_number": "1234",
  "security_code": "543",
  "errors": {
    "card_number": ["El número de tarjeta debe tener 16 dígitos"],
    "transaction_amount": ["Ingresa un monto válido"]
  }
}
```

## Códigos HTTP

Un rechazo de negocio **no** es un error HTTP: la pasarela procesó la operación y el resultado va en `status`.

| HTTP    | Categoría                            | Significado                                                                                         |
| ------- | ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| **201** | Cobro exitoso / Error de transacción | Operación procesada. `status` es `approved` o `rejected`                                            |
| **400** | Error de transacción                 | Datos inválidos (`invalid_request`), incluido un `Idempotency-Key` ausente o con formato incorrecto |
| **422** | Error de transacción                 | `Idempotency-Key` reutilizado con datos distintos (`idempotency_key_mismatch`)                      |
| **503** | Error del sistema                    | La pasarela no pudo procesar la operación (`service_unavailable` o `gateway_timeout`)               |
| **429** | —                                    | Límite de cobros por minuto excedido. Respuesta de error general del API, no del contrato           |

**Regla para el cliente:** el saldo solo se modifica si `status === "approved"`.

## Escenarios reproducibles

| Escenario                       | Datos que lo provocan                                                                                                                             | HTTP | `status`   | `status_detail`            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ---------- | -------------------------- |
| Cobro exitoso                   | Tarjeta `1234123412341234`, fecha `12/26`, CVV `543`, titular no vacío, monto válido                                                              | 201  | `approved` | `accredited`               |
| CVV incorrecto                  | Tarjeta `1234123412341234` con CVV distinto de `543`                                                                                              | 201  | `rejected` | `invalid_security_code`    |
| Fecha incorrecta                | Tarjeta `1234123412341234` con una fecha no vencida distinta de `12/26`                                                                           | 201  | `rejected` | `invalid_expiration_date`  |
| Tarjeta vencida                 | Cualquier tarjeta (excepto la de éxito con sus datos exactos) con fecha anterior al mes actual, por ejemplo `01/25`                               | 201  | `rejected` | `card_expired`             |
| Fondos insuficientes            | Tarjeta `4000000000000002`, fecha futura, cualquier CVV                                                                                           | 201  | `rejected` | `insufficient_funds`       |
| Tarjeta extraviada              | Tarjeta `4000000000000119`, fecha futura, cualquier CVV                                                                                           | 201  | `rejected` | `card_reported_lost`       |
| Alto riesgo                     | Tarjeta `4000000000000259`, fecha futura, cualquier CVV                                                                                           | 201  | `rejected` | `high_risk_blocked`        |
| Tarjeta no reconocida           | Cualquier otra tarjeta de 16 dígitos con fecha futura                                                                                             | 201  | `rejected` | `card_not_recognized`      |
| Datos inválidos                 | Tarjeta con letras o sin 16 dígitos, mes `13`, CVV de 2 dígitos, titular vacío, monto `0`, negativo, con 3 decimales o mayor a $50,000            | 400  | `rejected` | `invalid_request`          |
| Llave reutilizada               | Mismo `Idempotency-Key` con otro monto u otra tarjeta                                                                                             | 422  | `rejected` | `idempotency_key_mismatch` |
| Error del sistema (por datos)   | Tarjeta `4000000000000500`                                                                                                                        | 503  | `error`    | `service_unavailable`      |
| Error del sistema (por entorno) | Variable `SNAILPAY_FORCE_OUTAGE=true` en el servidor; aplica a cualquier petición                                                                 | 503  | `error`    | `service_unavailable`      |
| Timeout                         | Tarjeta `4000000000000408`. El servidor espera `SNAILPAY_TIMEOUT_DELAY_MS` (15 s por defecto) y responde 503; el cliente aborta antes, a los 10 s | 503  | `error`    | `gateway_timeout`          |

### Orden de evaluación

Las reglas se evalúan en orden y gana la primera que aplica:

1. Caída forzada por entorno (antes de validar).
2. Validación del cuerpo y del `Idempotency-Key` → 400.
3. Llave ya usada → respuesta guardada o 422.
4. Tarjeta de error del sistema → 503.
5. Tarjeta de timeout → 503 tras el retraso. Nunca aprueba, para no generar un cobro que el cliente no llegó a ver.
6. Tarjeta de éxito con sus datos exactos → aprobada. Va antes de la regla de vencimiento, así que sigue aprobando aunque la fecha actual sea posterior a 12/26.
7. Tarjeta vencida.
8. Tarjeta de éxito con CVV incorrecto.
9. Tarjeta de éxito con fecha incorrecta.
10. Tarjetas de rechazo (fondos insuficientes, extraviada, alto riesgo).
11. Cualquier otra → no reconocida.

## Idempotencia

- Cada intento de pago envía un `Idempotency-Key` nuevo. Si hay que reintentar ese mismo intento (timeout, 503, error de red), se reutiliza la llave.
- **Misma llave y mismos datos:** se devuelve la respuesta original, con el encabezado `Idempotent-Replayed: true`, sin procesar otra vez.
- **Misma llave y datos distintos:** 422 `idempotency_key_mismatch`.
- Solo se guardan los resultados definitivos (201). Un 503 no se guarda, para que el reintento se procese cuando el servicio se recupere.
- Las llaves expiran a las 24 horas.
- **Limitaciones conocidas:** el almacén es en memoria (se pierde al reiniciar y no se comparte entre instancias) y dos peticiones simultáneas con la misma llave podrían procesarse ambas. En producción se usaría Redis con bloqueo o una restricción `UNIQUE` en base de datos.

## Variables de entorno

| Variable                        | Valor por defecto | Descripción                                               |
| ------------------------------- | ----------------- | --------------------------------------------------------- |
| `SNAILPAY_FORCE_OUTAGE`         | `false`           | `true` simula una caída total: toda petición responde 503 |
| `SNAILPAY_TIMEOUT_DELAY_MS`     | `15000`           | Retraso de la tarjeta de timeout                          |
| `PAYMENT_RATE_LIMIT_PER_MINUTE` | `20`              | Cobros permitidos por minuto y por IP                     |

## Ejemplos con curl

Los ejemplos usan llaves de idempotencia fijas para que funcionen igual en cualquier terminal. Cada escenario usa una llave distinta; para repetir un cobro como operación nueva, cambia cualquier dígito de la llave.

```bash
# Cobro exitoso → 201 approved
curl -i -X POST http://localhost:3001/api/snailpay/payments \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: 11111111-1111-4111-8111-111111111111" \
  -d '{"card_number":"1234123412341234","expiration_date":"12/26","security_code":"543","cardholder_name":"Ana López","transaction_amount":250,"payer_id":"3f1c9a52-8d4e-4b7a-9c2f-5e6d7a8b9c0d","payer_email":"ana.lopez@example.com"}'

# Error del sistema por tarjeta → 503 service_unavailable
curl -i -X POST http://localhost:3001/api/snailpay/payments \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: 22222222-2222-4222-8222-222222222222" \
  -d '{"card_number":"4000000000000500","expiration_date":"12/28","security_code":"123","cardholder_name":"Ana López","transaction_amount":250,"payer_id":"3f1c9a52-8d4e-4b7a-9c2f-5e6d7a8b9c0d","payer_email":"ana.lopez@example.com"}'
```

**Idempotencia paso a paso:**

1. Ejecuta el cobro exitoso **dos veces** con la misma llave: la segunda respuesta tiene el mismo `id` y el encabezado `Idempotent-Replayed: true`.
2. Ejecútalo otra vez con la misma llave pero `"transaction_amount":300`: responde **422** `idempotency_key_mismatch`.
3. Sin el encabezado `Idempotency-Key`: responde **400** con `errors.idempotency_key`.

Para simular la caída total, inicia el servidor con la variable activa:

```bash
SNAILPAY_FORCE_OUTAGE=true pnpm --filter @snailbet/server dev
```

## Seguridad

- Los logs del servidor nunca incluyen el cuerpo de las peticiones: el número de tarjeta y el CVV no se registran.
- La huella de idempotencia es un hash SHA-256 de la petición, no una copia de sus datos.
- Incluir la tarjeta y el CVV en la respuesta y guardarlos en el navegador es un **requisito del proyecto**. En una integración real está prohibido por PCI DSS: el CVV nunca se almacena y la tarjeta se reemplaza por un token de la pasarela.
