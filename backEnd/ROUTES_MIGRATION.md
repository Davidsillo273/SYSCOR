# Migración de rutas — SYSCOR API

Este documento lista todas las rutas que cambiaron de nombre durante la
refactorización. **Necesario para actualizar la app móvil (React Native)**,
que consume esta misma API y no se tocó en este trabajo.

Todas las rutas siguen viviendo bajo el prefijo `/api`.

## Reorganización general (recursos agrupados por dominio)

| Antes | Ahora |
|---|---|
| `/api/carts/...` | `/api/orders/carts/...` |
| `/api/wompi/...` | `/api/orders/wompi/...` |
| `/api/extras/...` | `/api/menu/extras/...` |
| `/api/drinks/...` | `/api/menu/drinks/...` |
| `/api/saucers/...` | `/api/menu/saucers/...` |
| `/api/combos/...` | `/api/menu/combos/...` |
| `/api/drink-sets/...` | `/api/menu/drink-sets/...` |
| `/api/customers/...` | `/api/users/customers/...` |
| `/api/employees/...` | `/api/users/employees/...` |
| `/api/admins/...` | `/api/users/admins/...` |
| `/api/inventory/...` | *(sin cambio)* |
| `/api/tables/...` | *(sin cambio)* |
| `/api/notifications/...` | *(sin cambio)* |
| `/api/settings/...` | *(sin cambio)* |
| `/api/ai/...` | *(sin cambio)* |
| `/api/chat/...` | *(sin cambio)* |

## Rutas puntuales renombradas (camelCase → kebab-case)

| Antes | Ahora |
|---|---|
| `POST /api/wompi/paymentTest` | `POST /api/orders/wompi/payment-test` |
| `POST /api/auth/admins/invite/sendInvitation` | `POST /api/auth/admins/invite/send-invitation` |
| `GET /api/auth/admins/invite/checkInvitation` | `GET /api/auth/admins/invite/check-invitation` |
| `POST /api/auth/admins/invite/acceptInvitation` | `POST /api/auth/admins/invite/accept-invitation` |
| `POST /api/auth/employees/invite/sendInvitation` | `POST /api/auth/employees/invite/send-invitation` |
| `GET /api/auth/employees/invite/checkInvitation` | `GET /api/auth/employees/invite/check-invitation` |
| `POST /api/auth/employees/invite/acceptInvitation` | `POST /api/auth/employees/invite/accept-invitation` |
| `POST /api/auth/customers/register/sendCode` | `POST /api/auth/customers/register/send-code` |
| `POST /api/auth/customers/register/verifyCode` | `POST /api/auth/customers/register/verify-code` |
| `POST /api/auth/customers/register/personalInfo` | `POST /api/auth/customers/register/personal-info` |
| `POST /api/auth/customers/register/setPassword` | `POST /api/auth/customers/register/set-password` |
| `POST /api/auth/recoveryPassword/requestCode` | `POST /api/auth/recovery-password/request-code` |
| `POST /api/auth/recoveryPassword/verifyCode` | `POST /api/auth/recovery-password/verify-code` |
| `POST /api/auth/recoveryPassword/newPassword` | `POST /api/auth/recovery-password/new-password` |
| `PATCH /api/auth/changePassword` | `PATCH /api/auth/update-password` |

## Método HTTP: PUT → PATCH (actualizaciones parciales)

Estas rutas seguían usando `PUT`; ahora usan `PATCH` (ya era el estándar en
varios endpoints del sistema, esto solo lo hace consistente en todos):

- `PATCH /api/orders/carts/:id`
- `PATCH /api/users/customers/:id`
- `PATCH /api/menu/saucers/:id`
- `PATCH /api/menu/drink-sets/:id`
- `PATCH /api/menu/drinks/:id`
- `PATCH /api/menu/combos/:id`
- `PATCH /api/menu/extras/:id`
- `PATCH /api/inventory/:id`
- `PATCH /api/tables/:id`
- `PATCH /api/settings`

## Sin cambios

Las rutas de login (`/api/auth/admins/login`, `/api/auth/employees/login`,
`/api/auth/customers/login`), logout (`/api/auth/logout`), sesión actual
(`/api/auth/me`), y todas las rutas GET de solo lectura (`/active`,
`/best-sellers`, `/check-name`, etc.) mantienen su nombre y método.
