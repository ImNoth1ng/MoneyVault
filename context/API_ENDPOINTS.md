# API Finanzas Personales - Documentación de Endpoints

## Estado del Proyecto
- Compilación exitosa
- Estructura completa creada
- Swagger/OpenAPI habilitado
- Validaciones en DTOs activas
- Roles inicializados automáticamente
- Tests de arranque pasando
- Snapshots de balance expuestos

---

## Autenticación

### 1. Registro de Usuario
**POST** `/api/v1/auth/register`
```json
{
  "username": "juan.perez",
  "email": "juan@example.com",
  "password": "MiPassword123!",
  "passwordConfirm": "MiPassword123!"
}
```
**Respuesta (201):**
```
Usuario registrado con éxito
```

### 2. Login
**POST** `/api/v1/auth/login`
```json
{
  "username": "juan.perez",
  "password": "MiPassword123!"
}
```
**Respuesta (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "username": "juan.perez",
  "email": "juan@example.com",
  "userId": 1
}
```

---

## Cuentas Bancarias

### 3. Crear Cuenta
**POST** `/api/v1/accounts`  
**Headers:** `Authorization: Bearer {token}`
```json
{
  "name": "Cuenta Corriente Banco X",
  "type": "DEBIT",
  "currentBalance": 5000.00,
  "creditLimit": null,
  "currency": "MXN"
}
```

### 4. Listar mis Cuentas
**GET** `/api/v1/accounts`  
**Headers:** `Authorization: Bearer {token}`

**Respuesta (200):**
```json
[
  {
    "id": 1,
    "name": "Cuenta Corriente Banco X",
    "type": "DEBIT",
    "currentBalance": 5000.00,
    "creditLimit": null,
    "currency": "MXN",
    "createdAt": "2026-04-30T10:30:00"
  }
]
```

### 5. Obtener Detalle de Cuenta
**GET** `/api/v1/accounts/{id}`  
**Headers:** `Authorization: Bearer {token}`

### 6. Actualizar Cuenta
**PUT** `/api/v1/accounts/{id}`  
**Headers:** `Authorization: Bearer {token}`
```json
{
  "name": "Cuenta Actualizada",
  "type": "DEBIT",
  "currentBalance": 6000.00,
  "currency": "MXN"
}
```

### 7. Eliminar Cuenta
**DELETE** `/api/v1/accounts/{id}`  
**Headers:** `Authorization: Bearer {token}`

---

## Snapshots de Balance

### 8. Crear Snapshot
**POST** `/api/v1/accounts/{accountId}/snapshots`  
**Headers:** `Authorization: Bearer {token}`
```json
{
  "frequency": "MONTHLY"
}
```

### 9. Listar Snapshots de una Cuenta
**GET** `/api/v1/accounts/{accountId}/snapshots`  
**Headers:** `Authorization: Bearer {token}`

### 10. Listar Snapshots por Periodo
**GET** `/api/v1/accounts/{accountId}/snapshots/period?startDate=2026-08-01T00:00:00&endDate=2026-08-31T23:59:59`  
**Headers:** `Authorization: Bearer {token}`

---

## Deudores

### 11. Crear Deudor
**POST** `/api/v1/debtors`  
**Headers:** `Authorization: Bearer {token}`
```json
{
  "name": "Carlos López",
  "contactInfo": "carlos@email.com o 555-1234"
}
```

### 12. Listar Deudores
**GET** `/api/v1/debtors`  
**Headers:** `Authorization: Bearer {token}`

### 13. Obtener Deudor
**GET** `/api/v1/debtors/{id}`

### 14. Actualizar Deudor
**PUT** `/api/v1/debtors/{id}`
```json
{
  "name": "Carlos López Actualizado",
  "contactInfo": "carlos.nuevo@email.com"
}
```

### 15. Eliminar Deudor
**DELETE** `/api/v1/debtors/{id}`

---

## Tickets de Deuda

### 16. Crear Ticket de Deuda
**POST** `/api/v1/debt-tickets`  
**Headers:** `Authorization: Bearer {token}`
```json
{
  "debtorId": 1,
  "description": "Préstamo para compra de auto",
  "items": [
    {
      "concept": "Préstamo principal",
      "amount": 50000.00
    },
    {
      "concept": "Interés",
      "amount": 5000.00
    }
  ]
}
```

### 17. Listar mis Tickets
**GET** `/api/v1/debt-tickets`  
**Headers:** `Authorization: Bearer {token}`

### 18. Obtener Ticket
**GET** `/api/v1/debt-tickets/{id}`

### 19. Listar Tickets de un Deudor
**GET** `/api/v1/debt-tickets/debtor/{debtorId}`

### 20. Marcar Ticket como Pagado
**PUT** `/api/v1/debt-tickets/{id}/mark-paid`  
**Headers:** `Authorization: Bearer {token}`

### 21. Eliminar Ticket
**DELETE** `/api/v1/debt-tickets/{id}`

---

## Estructura de Carpetas Creada

```
src/main/java/com/nth/finanzas/
├── model/                      # Entidades JPA
├── repository/                 # Repositorios JPA
├── service/                    # Servicios de Negocio
├── controller/                 # Controladores REST
├── dto/                        # Data Transfer Objects
├── config/                     # Configuración
├── filter/                     # Filtros
├── exception/                  # Manejo de Excepciones
└── FinanzasApplication.java
```

---

## Ejemplo de Uso Completo (CURL)

### 1. Registrarse
```bash
curl -X POST http://localhost:8085/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "juan.perez",
    "email": "juan@example.com",
    "password": "Seguro123!",
    "passwordConfirm": "Seguro123!"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:8085/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "juan.perez",
    "password": "Seguro123!"
  }'
```

### 3. Crear Cuenta
```bash
curl -X POST http://localhost:8085/api/v1/accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN_AQUI}" \
  -d '{
    "name": "Mi Cuenta Corriente",
    "type": "DEBIT",
    "currentBalance": 5000.00,
    "currency": "MXN"
  }'
```
