# SnailBet

Aplicación web con temática de apuestas en carreras de caracoles. Permite registrarse, iniciar sesión, consultar un dashboard con estadísticas simuladas y recargar saldo mediante una pasarela de pagos simulada.

> Proyecto en desarrollo. Las instrucciones de instalación, ejecución y pruebas se agregarán conforme avance la implementación.

## Stack

| Capa         | Tecnología                      |
| ------------ | ------------------------------- |
| Frontend     | React + Vite + TypeScript       |
| Backend      | Express + TypeScript            |
| Persistencia | LocalStorage (simulación local) |
| Monorepo     | pnpm workspaces                 |

## Estructura

```
client/   Aplicación web (React)
server/   API y pasarela de pagos simulada (Express)
shared/   Esquemas de validación y tipos compartidos
docs/     Documentación técnica
```

## Aviso

La pasarela de pagos es un servicio simulado. No se conecta con pasarelas reales ni procesa información financiera real; todos los datos de tarjeta utilizados son ficticios.
